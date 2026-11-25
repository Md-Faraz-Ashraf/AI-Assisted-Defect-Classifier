from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum


class DefectType(StrEnum):
    SCRATCH = "Scratch"
    DENT = "Dent"
    PAINT_ISSUE = "Paint Issue"
    MISSING_COMPONENT = "Missing Component"
    NO_DEFECT = "No Defect"


class UserRole(StrEnum):
    QUALITY_ENGINEER = "QUALITY_ENGINEER"
    PRODUCTION_SUPERVISOR = "PRODUCTION_SUPERVISOR"


class InspectionStatus(StrEnum):
    UNREVIEWED = "UNREVIEWED"
    REVIEWED = "REVIEWED"


@dataclass(frozen=True)
class User:
    user_id: str
    name: str
    role: UserRole


@dataclass(frozen=True)
class Batch:
    batch_id: str
    batch_number: str
    product_name: str
    production_line: str


@dataclass(frozen=True)
class Prediction:
    defect_type: DefectType
    confidence: float
    provider: str
    model: str


@dataclass
class PendingAnalysis:
    inspection_id: str
    batch_id: str
    inspector_id: str
    image_ref: str
    prediction: Prediction
    created_at: datetime
    status: InspectionStatus = InspectionStatus.UNREVIEWED

    @property
    def submitted(self) -> bool:
        return self.status == InspectionStatus.REVIEWED


@dataclass(frozen=True)
class Inspection:
    inspection_id: str
    batch_id: str
    inspector_id: str
    image_ref: str
    original_ai_prediction: DefectType
    ai_confidence: float
    ai_provider: str
    ai_model: str
    final_defect_type: DefectType
    was_overridden: bool
    comments: str | None
    inspected_at: datetime
