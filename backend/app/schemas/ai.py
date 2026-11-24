from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DefectType


class ProviderPrediction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    defect_type: DefectType
    confidence: float = Field(ge=0.0, le=1.0, strict=True)
