from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock

import anyio
import pytest

from app.models.domain import Batch
from app.services.ai.provider import GeminiAIProvider


def test_gemini_sends_image_context_and_structured_schema(monkeypatch):
    generated = AsyncMock(
        return_value=SimpleNamespace(text='{"defect_type":"Scratch","confidence":0.8}')
    )
    fake_client = SimpleNamespace(models=SimpleNamespace(generate_content=generated))

    @asynccontextmanager
    async def client_context():
        yield fake_client

    monkeypatch.setattr(
        "app.services.ai.provider.genai.Client",
        lambda *, api_key: SimpleNamespace(aio=client_context()),
    )
    provider = GeminiAIProvider("test-key", "gemini-3.5-flash-lite")
    batch = Batch("BATCH-001", "BATCH-001", "Steel Bracket X200", "Line 3")

    result = anyio.run(provider.analyze, b"image bytes", "image/png", batch)

    assert result == '{"defect_type":"Scratch","confidence":0.8}'
    kwargs = generated.await_args.kwargs
    assert kwargs["model"] == "gemini-3.5-flash-lite"
    assert kwargs["config"].response_mime_type == "application/json"
    schema = kwargs["config"].response_schema
    assert schema.type == "OBJECT"
    assert schema.required == ["defect_type", "confidence"]
    assert schema.properties["defect_type"].enum
    assert "BATCH-001" in kwargs["contents"][0]
    assert kwargs["contents"][1].inline_data.mime_type == "image/png"
    assert kwargs["contents"][1].inline_data.data == b"image bytes"


def test_gemini_rethrows_request_timeout(monkeypatch):
    @asynccontextmanager
    async def client_context():
        yield SimpleNamespace(
            models=SimpleNamespace(generate_content=AsyncMock(side_effect=TimeoutError))
        )

    monkeypatch.setattr(
        "app.services.ai.provider.genai.Client",
        lambda *, api_key: SimpleNamespace(aio=client_context()),
    )
    provider = GeminiAIProvider("test-key", "gemini-3.5-flash-lite", timeout_seconds=1)
    batch = Batch("BATCH-001", "BATCH-001", "Steel Bracket X200", "Line 3")

    with pytest.raises(TimeoutError):
        anyio.run(provider.analyze, b"image bytes", "image/png", batch)
