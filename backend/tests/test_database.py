from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import func, inspect, select
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.base import Base
from app.db.models import BatchRow, InspectionRow, UserRow
from app.db.session import make_engine, make_session_factory
from app.models.domain import (
    DefectType,
    Inspection,
    InspectionStatus,
    PendingAnalysis,
    Prediction,
)
from app.repositories.postgres import (
    PostgresBatchRepository,
    PostgresInspectionLifecycleRepository,
    PostgresInspectionRepository,
    PostgresInspectionSubmissionRepository,
    PostgresUserRepository,
)


def unique_sqlite_url(prefix: str) -> tuple[str, Path]:
    database_path = Path("var") / f"{prefix}-{uuid4()}.sqlite"
    database_path.parent.mkdir(exist_ok=True)
    return f"sqlite:///{database_path.resolve()}", database_path


@pytest.fixture
def database():
    database_url, database_path = unique_sqlite_url("phase5")
    engine = make_engine(database_url)
    Base.metadata.create_all(engine)
    sessions = make_session_factory(engine)
    with sessions.begin() as session:
        session.add_all(
            [
                UserRow(user_id="1", name="Priya", role="QUALITY_ENGINEER"),
                UserRow(user_id="2", name="Rahul", role="PRODUCTION_SUPERVISOR"),
                BatchRow(
                    batch_id="BATCH-001",
                    batch_number="BATCH-001",
                    product_name="Steel Bracket X200",
                    production_line="Line 3",
                ),
            ]
        )
    yield engine, sessions
    engine.dispose()
    database_path.unlink(missing_ok=True)


def make_analysis(inspection_id: str | None = None) -> PendingAnalysis:
    return PendingAnalysis(
        inspection_id=inspection_id or str(uuid4()),
        batch_id="BATCH-001",
        inspector_id="1",
        image_ref="generated.png",
        prediction=Prediction(DefectType.SCRATCH, 0.82, "mock", "deterministic-mock-v1"),
        created_at=datetime.now(UTC),
    )


def make_inspection(inspection_id: str | None = None) -> Inspection:
    return Inspection(
        inspection_id=inspection_id or str(uuid4()),
        batch_id="BATCH-001",
        inspector_id="1",
        image_ref="generated.png",
        original_ai_prediction=DefectType.SCRATCH,
        ai_confidence=0.82,
        ai_provider="mock",
        ai_model="deterministic-mock-v1",
        final_defect_type=DefectType.DENT,
        was_overridden=True,
        comments="Verified",
        inspected_at=datetime.now(UTC),
    )


def test_database_repositories_round_trip_filter_and_aggregate(database):
    _, sessions = database
    users = PostgresUserRepository(sessions)
    batches = PostgresBatchRepository(sessions)
    analyses = PostgresInspectionLifecycleRepository(sessions)
    inspections = PostgresInspectionRepository(sessions)
    submissions = PostgresInspectionSubmissionRepository(sessions)
    assert users.get_user("1").name == "Priya"
    assert users.get_user("2").role.value == "PRODUCTION_SUPERVISOR"
    assert batches.get_batch("BATCH-001").product_name == "Steel Bracket X200"

    pending = make_analysis()
    analyses.add(pending)
    record = make_inspection(pending.inspection_id)
    assert submissions.submit_pending(pending.inspection_id, record) is True
    assert submissions.submit_pending(pending.inspection_id, make_inspection()) is False
    assert analyses.get(pending.inspection_id).submitted is True
    assert inspections.get(record.inspection_id).original_ai_prediction == DefectType.SCRATCH
    rows, total = inspections.list_page(
        status=InspectionStatus.REVIEWED,
        defect_type=DefectType.DENT,
        batch_id="BATCH-001",
        inspector_id="1",
        date_from=None,
        date_to=None,
        page=1,
        page_size=10,
        sort_by="inspected_at",
        sort_order="desc",
    )
    assert total == 1 and rows[0].inspection_id == record.inspection_id
    assert inspections.dashboard_counts()[DefectType.DENT] == 1
    assert inspections.dashboard_accepted_count() == 0


def test_failed_review_update_rolls_back_status_change(database):
    _, sessions = database
    analyses = PostgresInspectionLifecycleRepository(sessions)
    submissions = PostgresInspectionSubmissionRepository(sessions)
    pending = make_analysis()
    analyses.add(pending)
    first = make_inspection(pending.inspection_id)
    assert submissions.submit_pending(pending.inspection_id, first)

    second_pending = make_analysis()
    analyses.add(second_pending)
    inconsistent = make_inspection(second_pending.inspection_id)
    inconsistent = replace(inconsistent, was_overridden=False)
    with pytest.raises(IntegrityError):
        submissions.submit_pending(second_pending.inspection_id, inconsistent)

    assert analyses.get(second_pending.inspection_id).submitted is False
    with sessions() as session:
        assert (
            session.scalar(
                select(func.count())
                .select_from(InspectionRow)
                .where(InspectionRow.status == "REVIEWED")
            )
            == 1
        )


def test_database_mode_does_not_fall_back_when_connection_fails(monkeypatch):
    from app.dependencies import container as container_module

    def fail_to_connect(_: str):
        raise OperationalError("connect", {}, OSError("database unavailable"))

    monkeypatch.setattr(container_module, "make_engine", fail_to_connect)
    with pytest.raises(RuntimeError, match="requires a reachable PostgreSQL database"):
        container_module.build_container(
            Settings(
                _env_file=None,
                ai_provider="mock",
                app_mode="database",
                database_url="postgresql+psycopg://bad",
                image_storage_path="var/test-images",
            )
        )


def test_database_seed_script_is_idempotent(monkeypatch):
    from scripts.seed import seed

    database_url, database_path = unique_sqlite_url("seed")
    engine = make_engine(database_url)
    Base.metadata.create_all(engine)
    engine.dispose()
    monkeypatch.setenv("APP_MODE", "database")
    monkeypatch.setenv("DATABASE_URL", database_url)

    seed()
    seed()

    engine = make_engine(database_url)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(UserRow)) == 2
        assert session.scalar(select(func.count()).select_from(BatchRow)) == 3
        assert session.scalar(select(func.count()).select_from(InspectionRow)) == 0
    engine.dispose()
    database_path.unlink(missing_ok=True)


def test_initial_migration_creates_only_three_application_tables(monkeypatch):
    database_url, database_path = unique_sqlite_url("migration")
    monkeypatch.setenv("DATABASE_URL", database_url)
    config = Config("alembic.ini")

    command.upgrade(config, "head")

    engine = make_engine(database_url)
    tables = set(inspect(engine).get_table_names())
    engine.dispose()
    database_path.unlink(missing_ok=True)
    assert {"users", "batches", "inspections", "alembic_version"} == tables
    assert "pending_analyses" not in tables
