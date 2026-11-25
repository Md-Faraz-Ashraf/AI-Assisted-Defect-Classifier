from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

_DEFECT_VALUES_SQL = "'Scratch', 'Dent', 'Paint Issue', 'Missing Component', 'No Defect'"
_REVIEW_STATE_SQL = (
    "(status = 'UNREVIEWED' and final_defect_type is null and was_overridden is null "
    "and comments is null and inspected_at is null) "
    "or (status = 'REVIEWED' and final_defect_type is not null "
    "and was_overridden is not null and inspected_at is not null "
    "and was_overridden = (original_ai_prediction <> final_defect_type))"
)


class UserRow(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role in ('QUALITY_ENGINEER', 'PRODUCTION_SUPERVISOR')", name="ck_users_role"
        ),
    )

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BatchRow(Base):
    __tablename__ = "batches"

    batch_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    batch_number: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    product_name: Mapped[str] = mapped_column(String(160), nullable=False)
    production_line: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InspectionRow(Base):
    __tablename__ = "inspections"
    __table_args__ = (
        CheckConstraint(
            "ai_confidence >= 0 and ai_confidence <= 1", name="ck_inspections_confidence"
        ),
        CheckConstraint(
            "original_ai_prediction in (" + _DEFECT_VALUES_SQL + ")",
            name="ck_inspections_original_defect",
        ),
        CheckConstraint(
            "final_defect_type is null or final_defect_type in (" + _DEFECT_VALUES_SQL + ")",
            name="ck_inspections_final_defect",
        ),
        CheckConstraint(
            "status in ('UNREVIEWED', 'REVIEWED')",
            name="ck_inspections_status",
        ),
        CheckConstraint(
            _REVIEW_STATE_SQL,
            name="ck_inspections_review_state",
        ),
        Index(
            "ix_inspections_status_inspected_at_inspection_id",
            "status",
            "inspected_at",
            "inspection_id",
        ),
        Index("ix_inspections_status_analyzed_at", "status", "analyzed_at"),
        Index("ix_inspections_batch", "batch_id"),
        Index("ix_inspections_inspector", "inspector_id"),
        Index("ix_inspections_final_defect", "final_defect_type"),
    )

    inspection_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="UNREVIEWED", server_default="UNREVIEWED"
    )
    batch_id: Mapped[str] = mapped_column(
        ForeignKey("batches.batch_id", ondelete="RESTRICT"), nullable=False
    )
    inspector_id: Mapped[str] = mapped_column(
        ForeignKey("users.user_id", name="fk_inspections_inspector_id_users", ondelete="RESTRICT"),
        nullable=False,
    )
    image_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    original_ai_prediction: Mapped[str] = mapped_column(String(40), nullable=False)
    ai_confidence: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(80), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(160), nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    final_defect_type: Mapped[str | None] = mapped_column(String(40))
    was_overridden: Mapped[bool | None] = mapped_column(Boolean)
    comments: Mapped[str | None] = mapped_column(Text)
    inspected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
