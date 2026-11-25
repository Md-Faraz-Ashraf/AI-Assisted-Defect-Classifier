import hashlib
import json
from asyncio import timeout
from typing import Protocol

from google import genai
from google.genai import errors, types
from httpx import TimeoutException as HttpxTimeoutException

from app.core.errors import AIProviderError, AIProviderRateLimited, AIProviderUnavailable
from app.models.domain import Batch, DefectType


class AIProvider(Protocol):
    name: str
    model: str

    async def analyze(self, image: bytes, media_type: str, batch: Batch) -> str: ...


class MockAIProvider:
    name = "mock"
    model = "deterministic-image-hash-v1"
    _categories = tuple(DefectType)

    async def analyze(self, image: bytes, media_type: str, batch: Batch) -> str:
        del media_type, batch
        digest = hashlib.sha256(image).digest()
        category = self._categories[digest[0] % len(self._categories)]
        return json.dumps({"defect_type": category.value, "confidence": 0.82})


class GeminiAIProvider:
    """Gemini image classifier using Google's asynchronous GenerateContent API."""

    name = "gemini"
    classification_instructions = (
        "Inspect the uploaded manufactured product image using the product and batch context. "
        "Choose exactly one allowed defect category; do not invent categories. "
        "Return JSON only with defect_type and confidence from 0 to 1. "
        "Confidence is an indicative model-reported score, not a calibrated probability."
    )

    def __init__(self, api_key: str, model: str, timeout_seconds: float = 30) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds

    @staticmethod
    def request_context(batch: Batch) -> dict[str, object]:
        return {
            "batch_number": batch.batch_number,
            "product_name": batch.product_name,
            "production_line": batch.production_line,
            "allowed_defect_types": [kind.value for kind in DefectType],
        }

    async def analyze(self, image: bytes, media_type: str, batch: Batch) -> str:
        prompt = (
            f"{self.classification_instructions}\n"
            f"Manufacturing context: {json.dumps(self.request_context(batch))}\n"
            "Inspect the visible product surfaces carefully. If no listed defect is visible, "
            "choose No Defect. Do not infer defects that cannot be seen in the image."
        )
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=types.Schema(
                type="OBJECT",
                properties={
                    "defect_type": types.Schema(
                        type="STRING",
                        enum=[kind.value for kind in DefectType],
                    ),
                    "confidence": types.Schema(type="NUMBER"),
                },
                required=["defect_type", "confidence"],
            ),
            max_output_tokens=128,
        )
        try:
            async with genai.Client(api_key=self.api_key).aio as client:
                async with timeout(self.timeout_seconds):
                    response = await client.models.generate_content(
                        model=self.model,
                        contents=[
                            prompt,
                            types.Part.from_bytes(data=image, mime_type=media_type),
                        ],
                        config=config,
                    )
        except (TimeoutError, HttpxTimeoutException) as exc:
            raise TimeoutError from exc
        except errors.APIError as exc:
            status_code = getattr(exc, "code", None)
            if status_code == 429:
                raise AIProviderRateLimited from exc
            if status_code in (401, 403, 404):
                raise AIProviderUnavailable from exc
            raise AIProviderError from exc
        except Exception as exc:
            # Avoid exposing SDK details or request metadata at the API boundary.
            raise AIProviderError from exc

        response_text: object = response.text
        if not isinstance(response_text, str) or not response_text:
            raise AIProviderError("Gemini returned no structured prediction.")
        return response_text
