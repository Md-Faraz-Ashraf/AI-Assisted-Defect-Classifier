import re
from io import BytesIO
from pathlib import Path
from typing import Protocol
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from app.core.errors import AppError

ALLOWED_MEDIA_TYPES = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
}
SAFE_IMAGE_REF = re.compile(r"^[0-9a-f]{32}\.(?:jpg|png|webp)$")
MAX_IMAGE_PIXELS = 40_000_000
MEDIA_TYPES_BY_EXTENSION = {value[1]: value[0] for value in ALLOWED_MEDIA_TYPES.values()}


class ImageStorage(Protocol):
    def save(self, content: bytes, extension: str) -> str: ...

    def contains(self, image_ref: str) -> bool: ...

    def load(self, image_ref: str) -> tuple[bytes, str] | None: ...


class LocalImageStorage:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, extension: str) -> str:
        image_ref = f"{uuid4().hex}{extension}"
        target = (self.root / image_ref).resolve()
        if target.parent != self.root:
            raise AppError(500, "image_storage_error", "The image could not be stored.")
        target.write_bytes(content)
        return image_ref

    def get_path(self, image_ref: str) -> Path | None:
        if not SAFE_IMAGE_REF.fullmatch(image_ref):
            return None
        target = (self.root / image_ref).resolve()
        if target.parent != self.root or not target.is_file():
            return None
        return target

    def contains(self, image_ref: str) -> bool:
        return self.get_path(image_ref) is not None

    def load(self, image_ref: str) -> tuple[bytes, str] | None:
        path = self.get_path(image_ref)
        if path is None:
            return None
        media_type = MEDIA_TYPES_BY_EXTENSION.get(path.suffix)
        if media_type is None:
            return None
        return path.read_bytes(), media_type


def validate_image(content: bytes, media_type: str | None, max_size: int) -> tuple[str, str]:
    if not content:
        raise AppError(422, "empty_image", "The uploaded image is empty.")
    if len(content) > max_size:
        raise AppError(413, "image_too_large", f"Image exceeds the {max_size}-byte limit.")
    if media_type not in {item[0] for item in ALLOWED_MEDIA_TYPES.values()}:
        raise AppError(415, "unsupported_image_type", "Upload a JPEG, PNG, or WebP image.")

    try:
        with Image.open(BytesIO(content)) as image:
            image_format = image.format
            width, height = image.size
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                raise AppError(422, "invalid_image", "Image dimensions are invalid or too large.")
            image.verify()
    except AppError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as exc:
        raise AppError(422, "invalid_image", "The uploaded file is not a valid image.") from exc

    image_metadata = ALLOWED_MEDIA_TYPES.get(image_format or "")
    if image_metadata is None:
        raise AppError(415, "unsupported_image_type", "Upload a JPEG, PNG, or WebP image.")
    actual_media_type, extension = image_metadata
    if media_type != actual_media_type:
        raise AppError(
            415, "image_type_mismatch", "The declared MIME type does not match the image."
        )
    return actual_media_type, extension
