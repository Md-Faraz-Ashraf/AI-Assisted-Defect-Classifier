from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import BatchRow, InspectionRow, UserRow
from app.models.domain import (
    Batch,
    DefectType,
    Inspection,
    InspectionStatus,
    PendingAnalysis,
    Prediction,
    User,
    UserRole,
)


def _user(row: UserRow) -> User:
    return User(id=row.id, name=row.name, role=UserRole(row.role))


def _batch(row: BatchRow) -> Batch:
    return Batch(
        id=row.id,
        batch_number=row.batch_number,
        product_name=row.product_name,
        production_line=row.production_line,
    )


def _inspection(row: InspectionRow) -> Inspection:
    return Inspection(
        id=row.id,
        batch_id=row.batch_id,
        inspector_id=row.inspector_id,
        image_ref=row.image_ref,
        original_ai_prediction=DefectType(row.original_ai_prediction),
        ai_confidence=float(row.ai_confidence),
        ai_provider=row.ai_provider,
        ai_model=row.ai_model,
        final_defect_type=DefectType(row.final_defect_type),
        was_overridden=row.was_overridden,
        comments=row.comments,
        inspected_at=row.inspected_at,
    )


class PostgresUserRepository:
    def __init__(self, sessions: sessionmaker[Session]) -> None:
        self.sessions = sessions

    def list_users(self) -> list[User]:
        with self.sessions() as session:
            return [_user(row) for row in session.scalars(select(UserRow).order_by(UserRow.id))]

    def get_user(self, user_id: str) -> User | None:
        with self.sessions() as session:
            row = session.get(UserRow, user_id)
            return _user(row) if row else None


class PostgresBatchRepository:
    def __init__(self, sessions: sessionmaker[Session]) -> None:
        self.sessions = sessions

    def list_batches(self) -> list[Batch]:
        with self.sessions() as session:
            rows = session.scalars(select(BatchRow).order_by(BatchRow.batch_number))
            return [_batch(row) for row in rows]

    def get_batch(self, batch_id: str) -> Batch | None:
        with self.sessions() as session:
            row = session.get(BatchRow, batch_id)
            return _batch(row) if row else None


class PostgresInspectionLifecycleRepository:
    def __init__(self, sessions: sessionmaker[Session]) -> None:
        self.sessions = sessions

    @staticmethod
    def _domain(row: InspectionRow) -> PendingAnalysis:
        return PendingAnalysis(
            id=row.id,
            batch_id=row.batch_id,
            inspector_id=row.inspector_id,
            image_ref=row.image_ref,
            prediction=Prediction(
                defect_type=DefectType(row.original_ai_prediction),
                confidence=float(row.ai_confidence),
                provider=row.ai_provider,
                model=row.ai_model,
            ),
            created_at=row.analyzed_at,
            status=InspectionStatus(row.status),
        )

    def add(self, analysis: PendingAnalysis) -> None:
        with self.sessions.begin() as session:
            session.add(
                InspectionRow(
                    id=analysis.id,
                    status=analysis.status.value,
                    batch_id=analysis.batch_id,
                    inspector_id=analysis.inspector_id,
                    image_ref=analysis.image_ref,
                    original_ai_prediction=analysis.prediction.defect_type.value,
                    ai_confidence=analysis.prediction.confidence,
                    ai_provider=analysis.prediction.provider,
                    ai_model=analysis.prediction.model,
                    analyzed_at=analysis.created_at,
                )
            )

    def get(self, analysis_id: str) -> PendingAnalysis | None:
        try:
            UUID(analysis_id)
        except ValueError:
            return None
        with self.sessions() as session:
            row = session.get(InspectionRow, analysis_id)
            return self._domain(row) if row else None


class PostgresInspectionRepository:
    _sort_columns = {
        "inspected_at": InspectionRow.inspected_at,
        "batch_id": InspectionRow.batch_id,
        "final_defect_type": InspectionRow.final_defect_type,
        "inspector_id": InspectionRow.inspector_id,
    }

    def __init__(self, sessions: sessionmaker[Session]) -> None:
        self.sessions = sessions

    def get(self, inspection_id: str) -> Inspection | None:
        try:
            UUID(inspection_id)
        except ValueError:
            return None
        with self.sessions() as session:
            row = session.scalar(
                select(InspectionRow).where(
                    InspectionRow.id == inspection_id,
                    InspectionRow.status == InspectionStatus.REVIEWED.value,
                )
            )
            return _inspection(row) if row else None

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
        filters = []
        filters.append(InspectionRow.status == InspectionStatus.REVIEWED.value)
        if defect_type is not None:
            filters.append(InspectionRow.final_defect_type == defect_type.value)
        if batch_id is not None:
            filters.append(InspectionRow.batch_id == batch_id)
        if inspector_id is not None:
            filters.append(InspectionRow.inspector_id == inspector_id)
        if date_from is not None:
            filters.append(InspectionRow.inspected_at >= date_from)
        if date_to is not None:
            filters.append(InspectionRow.inspected_at <= date_to)

        sort_column = self._sort_columns[sort_by]
        ordering = sort_column.asc() if sort_order == "asc" else sort_column.desc()
        tie_breaker = InspectionRow.id.asc() if sort_order == "asc" else InspectionRow.id.desc()
        with self.sessions() as session:
            total = (
                session.scalar(select(func.count()).select_from(InspectionRow).where(*filters)) or 0
            )
            rows = session.scalars(
                select(InspectionRow)
                .where(*filters)
                .order_by(ordering, tie_breaker)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            return [_inspection(row) for row in rows], int(total)

    def dashboard_counts(self) -> dict[DefectType, int]:
        with self.sessions() as session:
            rows = session.execute(
                select(InspectionRow.final_defect_type, func.count())
                .where(InspectionRow.status == InspectionStatus.REVIEWED.value)
                .group_by(InspectionRow.final_defect_type)
            )
            result = {kind: 0 for kind in DefectType}
            for defect_type, count in rows:
                result[DefectType(defect_type)] = int(count)
            return result

    def dashboard_accepted_count(self) -> int:
        with self.sessions() as session:
            count = session.scalar(
                select(func.count())
                .select_from(InspectionRow)
                .where(InspectionRow.status == InspectionStatus.REVIEWED.value)
                .where(InspectionRow.was_overridden.is_(False))
            )
            return int(count or 0)


class PostgresInspectionSubmissionRepository:
    """Moves one database row from UNREVIEWED to REVIEWED atomically."""

    def __init__(self, sessions: sessionmaker[Session]) -> None:
        self.sessions = sessions

    def submit_pending(self, analysis_id: str, inspection: Inspection) -> bool:
        try:
            UUID(analysis_id)
        except ValueError:
            return False
        with self.sessions.begin() as session:
            analysis_row = session.scalar(
                select(InspectionRow).where(InspectionRow.id == analysis_id).with_for_update()
            )
            if analysis_row is None or analysis_row.status != InspectionStatus.UNREVIEWED.value:
                return False
            analysis_row.status = InspectionStatus.REVIEWED.value
            analysis_row.final_defect_type = inspection.final_defect_type.value
            analysis_row.was_overridden = inspection.was_overridden
            analysis_row.comments = inspection.comments
            analysis_row.inspected_at = inspection.inspected_at
            return True
