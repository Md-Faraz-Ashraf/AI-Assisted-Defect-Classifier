from collections.abc import Iterator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def client(tmp_path) -> Iterator[TestClient]:
    app = create_app(Settings(image_storage_path=str(tmp_path / "images")))
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def engineer_headers() -> dict[str, str]:
    return {"X-Demo-User": "priya"}


def make_png(color: tuple[int, int, int] = (30, 120, 90)) -> bytes:
    output = BytesIO()
    Image.new("RGB", (24, 24), color).save(output, format="PNG")
    return output.getvalue()


@pytest.fixture
def png_bytes() -> bytes:
    return make_png()
