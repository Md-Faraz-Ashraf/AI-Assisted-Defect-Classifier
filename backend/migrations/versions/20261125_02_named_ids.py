"""Use entity-specific primary keys and numeric-string user IDs.

Revision ID: 20261125_02
Revises: 20261124_01
"""

from alembic import op

revision = "20261125_02"
down_revision = "20261124_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    dialect = op.get_bind().dialect.name
    op.drop_index("ix_inspections_status_inspected_at_id", table_name="inspections")

    if dialect == "postgresql":
        op.drop_constraint("inspections_inspector_id_fkey", "inspections", type_="foreignkey")

    op.execute(
        "UPDATE users SET id = CASE id WHEN 'priya' THEN '1' WHEN 'rahul' THEN '2' ELSE id END"
    )
    op.execute(
        "UPDATE inspections SET inspector_id = CASE inspector_id "
        "WHEN 'priya' THEN '1' WHEN 'rahul' THEN '2' ELSE inspector_id END"
    )

    op.alter_column("users", "id", new_column_name="user_id")
    op.alter_column("batches", "id", new_column_name="batch_id")
    op.alter_column("inspections", "id", new_column_name="inspection_id")
    op.create_index(
        "ix_inspections_status_inspected_at_inspection_id",
        "inspections",
        ["status", "inspected_at", "inspection_id"],
    )

    if dialect == "postgresql":
        op.create_foreign_key(
            "fk_inspections_inspector_id_users",
            "inspections",
            "users",
            ["inspector_id"],
            ["user_id"],
            ondelete="RESTRICT",
        )


def downgrade() -> None:
    dialect = op.get_bind().dialect.name
    op.drop_index("ix_inspections_status_inspected_at_inspection_id", table_name="inspections")

    if dialect == "postgresql":
        op.drop_constraint("fk_inspections_inspector_id_users", "inspections", type_="foreignkey")

    op.execute(
        "UPDATE users SET user_id = CASE user_id "
        "WHEN '1' THEN 'priya' WHEN '2' THEN 'rahul' ELSE user_id END"
    )
    op.execute(
        "UPDATE inspections SET inspector_id = CASE inspector_id "
        "WHEN '1' THEN 'priya' WHEN '2' THEN 'rahul' ELSE inspector_id END"
    )

    op.alter_column("inspections", "inspection_id", new_column_name="id")
    op.alter_column("batches", "batch_id", new_column_name="id")
    op.alter_column("users", "user_id", new_column_name="id")
    op.create_index(
        "ix_inspections_status_inspected_at_id", "inspections", ["status", "inspected_at", "id"]
    )

    if dialect == "postgresql":
        op.create_foreign_key(
            "inspections_inspector_id_fkey",
            "inspections",
            "users",
            ["inspector_id"],
            ["id"],
            ondelete="RESTRICT",
        )
