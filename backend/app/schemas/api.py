from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import DefectType, InspectionStatus, UserRole


class DomainResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserResponse(DomainResponse):
    user_id: str
    name: str
    role: UserRole


class BatchResponse(DomainResponse):
    batch_id: str
    batch_number: str
    product_name: str
    production_line: str


class PredictionResponse(BaseModel):
    defect_type: DefectType
    confidence: float = Field(ge=0, le=1)
    provider: str
    model: str


class AIResponse(BaseModel):
    analysis_id: str
    status: InspectionStatus
    batch_id: str
    image_url: str
    prediction: PredictionResponse
    created_at: datetime


class InspectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    analysis_id: str = Field(min_length=1, max_length=64)
    final_defect_type: DefectType
    comments: str | None = Field(default=None, max_length=2000)


class InspectionResponse(BaseModel):
    inspection_id: str
    status: InspectionStatus
    batch_id: str
    batch_number: str
    product_name: str
    inspector_id: str
    inspector_name: str
    image_ref: str
    image_url: str
    original_ai_prediction: DefectType
    ai_confidence: float
    ai_provider: str
    ai_model: str
    final_defect_type: DefectType
    was_overridden: bool
    comments: str | None
    inspected_at: datetime


class InspectionPage(BaseModel):
    items: list[InspectionResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class DefectCount(BaseModel):
    defect_type: DefectType
    count: int


class DashboardSummary(BaseModel):
    total_inspections: int
    passed_inspections: int
    rejected_inspections: int
    defect_rate: float
    ai_acceptance_rate: float
    defect_breakdown: list[DefectCount]
