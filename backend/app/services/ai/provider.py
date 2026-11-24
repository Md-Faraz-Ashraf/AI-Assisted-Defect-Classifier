import hashlib
import json
from typing import Protocol

from app.core.errors import AIProviderUnavailable
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


class VisionProviderBoundary:
    """Replaceable integration boundary; live provider adapters are not configured yet."""

    name = "vision"
    model = "unconfigured"
    classification_instructions = (
        "Inspect the uploaded manufactured product image using the product and batch context. "
        "Choose exactly one allowed defect category; do not invent categories. "
        "Return JSON only with defect_type and confidence from 0 to 1. "
        "Confidence is an indicative model-reported score, not a calibrated probability."
    )
    response_schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["defect_type", "confidence"],
        "properties": {
            "defect_type": {
                "type": "string",
                "enum": [kind.value for kind in DefectType],
            },
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
    }

    @staticmethod
    def request_context(batch: Batch) -> dict[str, object]:
        return {
            "batch_number": batch.batch_number,
            "product_name": batch.product_name,
            "production_line": batch.production_line,
            "allowed_defect_types": [kind.value for kind in DefectType],
        }

    async def analyze(self, image: bytes, media_type: str, batch: Batch) -> str:
        del image, media_type, batch
        raise AIProviderUnavailable(
            "No real vision provider adapter is configured. Set AI_PROVIDER=mock for local use."
        )
