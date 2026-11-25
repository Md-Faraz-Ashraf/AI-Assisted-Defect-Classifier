"""Create users, batches, and unified inspection lifecycle tables.

Revision ID: 20261124_01
Revises:
Create Date: 2026-11-24
"""

import sqlalchemy as sa
from alembic import op

revision = "20261124_01"
down_revision = None
branch_labels = None
depends_on = None

DEFECTS = "'Scratch', 'Dent', 'Paint Issue', 'Missing Component', 'No Defect'"
REVIEW_STATE = (
    "(status = 'UNREVIEWED' and final_defect_type is null and was_overridden is null "
    "and comments is null and inspected_at is null) "
    "or (status = 'REVIEWED' and final_defect_type is not null "
    "and was_overridden is not null and inspected_at is not null "
    "and was_overridden = (original_ai_prediction <> final_defect_type))"
)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "role in ('QUALITY_ENGINEER', 'PRODUCTION_SUPERVISOR')", name="ck_users_role"
        ),
    )
    op.create_table(
        "batches",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("batch_number", sa.String(length=64), nullable=False, unique=True),
        sa.Column("product_name", sa.String(length=160), nullable=False),
        sa.Column("production_line", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_table(
        "inspections",
        sa.Column("id", sa.Uuid(as_uuid=False), primary_key=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column(
            "batch_id",
            sa.String(length=64),
            sa.ForeignKey("batches.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "inspector_id",
            sa.String(length=64),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("image_ref", sa.String(length=255), nullable=False),
        sa.Column("original_ai_prediction", sa.String(length=40), nullable=False),
        sa.Column("ai_confidence", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column("ai_provider", sa.String(length=80), nullable=False),
        sa.Column("ai_model", sa.String(length=160), nullable=False),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("final_defect_type", sa.String(length=40)),
        sa.Column("was_overridden", sa.Boolean()),
        sa.Column("comments", sa.Text()),
        sa.Column("inspected_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status in ('UNREVIEWED', 'REVIEWED')", name="ck_inspections_status"),
        sa.CheckConstraint(
            "ai_confidence >= 0 and ai_confidence <= 1", name="ck_inspections_confidence"
        ),
        sa.CheckConstraint(
            "original_ai_prediction in (" + DEFECTS + ")", name="ck_inspections_original_defect"
        ),
        sa.CheckConstraint(
            "final_defect_type is null or final_defect_type in (" + DEFECTS + ")",
            name="ck_inspections_final_defect",
        ),
        sa.CheckConstraint(
            REVIEW_STATE,
            name="ck_inspections_review_state",
        ),
    )
    op.create_index(
        "ix_inspections_status_inspected_at_id", "inspections", ["status", "inspected_at", "id"]
    )
    op.create_index("ix_inspections_status_analyzed_at", "inspections", ["status", "analyzed_at"])
    op.create_index("ix_inspections_batch", "inspections", ["batch_id"])
    op.create_index("ix_inspections_inspector", "inspections", ["inspector_id"])
    op.create_index("ix_inspections_final_defect", "inspections", ["final_defect_type"])


def downgrade() -> None:
    op.drop_table("inspections")
    op.drop_table("batches")
    op.drop_table("users")
