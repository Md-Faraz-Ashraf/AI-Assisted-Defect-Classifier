from datetime import datetime
from typing import Protocol

from app.models.domain import (
    Batch,
    DefectType,
    Inspection,
    InspectionStatus,
    PendingAnalysis,
    User,
)


class UserRepository(Protocol):
    def list_users(self) -> list[User]: ...

    def get_user(self, user_id: str) -> User | None: ...


class BatchRepository(Protocol):
    def list_batches(self) -> list[Batch]: ...

    def get_batch(self, batch_id: str) -> Batch | None: ...


class PendingAnalysisRepository(Protocol):
    def add(self, analysis: PendingAnalysis) -> None: ...

    def get(self, inspection_id: str) -> PendingAnalysis | None: ...


class InspectionRepository(Protocol):
    def get(self, inspection_id: str) -> Inspection | None: ...

    def list_page(
        self,
        *,
        status: InspectionStatus,
        defect_type: DefectType | None,
        batch_id: str | None,
        inspector_id: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        page: int,
        page_size: int,
        sort_by: str,
        sort_order: str,
    ) -> tuple[list[Inspection | PendingAnalysis], int]: ...

    def dashboard_counts(self) -> dict[DefectType, int]: ...

    def dashboard_accepted_count(self) -> int: ...


class InspectionSubmissionRepository(Protocol):
    def submit_pending(self, inspection_id: str, inspection: Inspection) -> bool: ...
