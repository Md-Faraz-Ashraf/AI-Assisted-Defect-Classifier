from datetime import datetime
from threading import Lock

from app.models.domain import (
    Batch,
    DefectType,
    Inspection,
    InspectionStatus,
    PendingAnalysis,
    User,
    UserRole,
)


class MockUserRepository:
    def __init__(self) -> None:
        self._users = {
            "priya": User("priya", "Priya", UserRole.QUALITY_ENGINEER),
            "rahul": User("rahul", "Rahul", UserRole.PRODUCTION_SUPERVISOR),
        }

    def list_users(self) -> list[User]:
        return list(self._users.values())

    def get_user(self, user_id: str) -> User | None:
        return self._users.get(user_id)


class MockBatchRepository:
    def __init__(self) -> None:
        self._batches = {
            "BATCH-001": Batch("BATCH-001", "BATCH-001", "Steel Bracket X200", "Line 3"),
            "BATCH-002": Batch("BATCH-002", "BATCH-002", "Plastic Housing P100", "Line 2"),
            "BATCH-003": Batch("BATCH-003", "BATCH-003", "Aluminium Panel A50", "Line 1"),
        }

    def list_batches(self) -> list[Batch]:
        return list(self._batches.values())

    def get_batch(self, batch_id: str) -> Batch | None:
        return self._batches.get(batch_id)


class MockPendingAnalysisRepository:
    def __init__(self) -> None:
        self._analyses: dict[str, PendingAnalysis] = {}
        self._submission_lock = Lock()

    def add(self, analysis: PendingAnalysis) -> None:
        self._analyses[analysis.id] = analysis

    def get(self, analysis_id: str) -> PendingAnalysis | None:
        return self._analyses.get(analysis_id)

    def mark_reviewed(self, analysis_id: str) -> bool:
        with self._submission_lock:
            analysis = self._analyses.get(analysis_id)
            if analysis is None or analysis.submitted:
                return False
            analysis.status = InspectionStatus.REVIEWED
            return True


class MockInspectionRepository:
    def __init__(self) -> None:
        self._inspections: dict[str, Inspection] = {}

    def dashboard_accepted_count(self) -> int:
        return sum(not row.was_overridden for row in self._inspections.values())

    def add(self, inspection: Inspection) -> None:
        self._inspections[inspection.id] = inspection

    def get(self, inspection_id: str) -> Inspection | None:
        return self._inspections.get(inspection_id)

    def list_page(
        self,
        *,
        defect_type: DefectType | None,
        batch_id: str | None,
        inspector_id: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        page: int,
        page_size: int,
        sort_by: str,
        sort_order: str,
    ) -> tuple[list[Inspection], int]:
        records = list(self._inspections.values())
        if defect_type is not None:
            records = [row for row in records if row.final_defect_type == defect_type]
        if batch_id is not None:
            records = [row for row in records if row.batch_id == batch_id]
        if inspector_id is not None:
            records = [row for row in records if row.inspector_id == inspector_id]
        if date_from is not None:
            records = [row for row in records if row.inspected_at >= date_from]
        if date_to is not None:
            records = [row for row in records if row.inspected_at <= date_to]

        sort_key = {
            "inspected_at": lambda row: row.inspected_at,
            "batch_id": lambda row: row.batch_id,
            "final_defect_type": lambda row: row.final_defect_type.value,
            "inspector_id": lambda row: row.inspector_id,
        }[sort_by]
        records.sort(key=lambda row: (sort_key(row), row.id), reverse=sort_order == "desc")
        total = len(records)
        offset = (page - 1) * page_size
        return records[offset : offset + page_size], total

    def dashboard_counts(self) -> dict[DefectType, int]:
        counts = {defect: 0 for defect in DefectType}
        for inspection in self._inspections.values():
            counts[inspection.final_defect_type] += 1
        return counts


class MockInspectionSubmissionRepository:
    """Atomically marks an analysis submitted and stores its inspection in mock mode."""

    def __init__(
        self,
        analyses: MockPendingAnalysisRepository,
        inspections: MockInspectionRepository,
    ) -> None:
        self.analyses = analyses
        self.inspections = inspections
        self._lock = Lock()

    def submit_pending(self, analysis_id: str, inspection: Inspection) -> bool:
        with self._lock:
            analysis = self.analyses.get(analysis_id)
            if analysis is None or analysis.submitted:
                return False
            self.inspections.add(inspection)
            return self.analyses.mark_reviewed(analysis_id)
