from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings
from app.db.session import make_engine, make_session_factory
from app.repositories.mock import (
    MockBatchRepository,
    MockInspectionRepository,
    MockInspectionSubmissionRepository,
    MockPendingAnalysisRepository,
    MockUserRepository,
)
from app.repositories.postgres import (
    PostgresBatchRepository,
    PostgresInspectionLifecycleRepository,
    PostgresInspectionRepository,
    PostgresInspectionSubmissionRepository,
    PostgresUserRepository,
)
from app.repositories.protocols import (
    BatchRepository,
    InspectionRepository,
    InspectionSubmissionRepository,
    PendingAnalysisRepository,
    UserRepository,
)
from app.services.ai.provider import AIProvider, GeminiAIProvider, MockAIProvider
from app.services.image_storage import ImageStorage, LocalImageStorage


@dataclass
class AppContainer:
    settings: Settings
    user_repository: UserRepository
    batch_repository: BatchRepository
    inspection_repository: InspectionRepository
    inspection_submission_repository: InspectionSubmissionRepository
    pending_analysis_repository: PendingAnalysisRepository
    ai_provider: AIProvider
    image_storage: ImageStorage
    database_engine: Engine | None = None

    def check_database(self) -> None:
        if self.database_engine is not None:
            with self.database_engine.connect() as connection:
                connection.exec_driver_sql("SELECT 1")

    def close(self) -> None:
        if self.database_engine is not None:
            self.database_engine.dispose()


def build_container(settings: Settings) -> AppContainer:
    if settings.ai_provider == "mock":
        provider: AIProvider = MockAIProvider()
    elif settings.ai_provider == "gemini":
        if not settings.ai_api_key:
            raise RuntimeError("AI_PROVIDER=gemini requires AI_API_KEY in the environment.")
        provider = GeminiAIProvider(
            api_key=settings.ai_api_key,
            model=settings.llm_model,
            timeout_seconds=settings.ai_timeout_seconds,
        )
    else:
        raise RuntimeError("AI_PROVIDER must be either 'mock' or 'gemini'.")

    if settings.app_mode == "database":
        is_postgres = settings.database_url.startswith("postgresql+psycopg://")
        is_test_sqlite = settings.app_env == "test" and settings.database_url.startswith(
            "sqlite://"
        )
        if not (is_postgres or is_test_sqlite):
            raise RuntimeError(
                "APP_MODE=database requires a PostgreSQL DATABASE_URL using the psycopg driver."
            )
        engine: Engine | None = None
        try:
            engine = make_engine(settings.database_url)
            with engine.connect() as connection:
                connection.exec_driver_sql("SELECT 1")
        except SQLAlchemyError as exc:
            if engine is not None:
                engine.dispose()
            raise RuntimeError(
                "APP_MODE=database requires a reachable PostgreSQL database. "
                "Check DATABASE_URL and ensure PostgreSQL is running."
            ) from exc
        assert engine is not None
        sessions: sessionmaker[Session] = make_session_factory(engine)
        return AppContainer(
            settings=settings,
            user_repository=PostgresUserRepository(sessions),
            batch_repository=PostgresBatchRepository(sessions),
            inspection_repository=PostgresInspectionRepository(sessions),
            inspection_submission_repository=PostgresInspectionSubmissionRepository(sessions),
            pending_analysis_repository=PostgresInspectionLifecycleRepository(sessions),
            ai_provider=provider,
            image_storage=LocalImageStorage(Path(settings.image_storage_path)),
            database_engine=engine,
        )

    if settings.app_mode != "mock":
        raise RuntimeError("APP_MODE must be either 'mock' or 'database'.")
    users = MockUserRepository()
    batches = MockBatchRepository()
    inspections = MockInspectionRepository()
    analyses = MockPendingAnalysisRepository()
    return AppContainer(
        settings=settings,
        user_repository=users,
        batch_repository=batches,
        inspection_repository=inspections,
        inspection_submission_repository=MockInspectionSubmissionRepository(analyses, inspections),
        pending_analysis_repository=analyses,
        ai_provider=provider,
        image_storage=LocalImageStorage(Path(settings.image_storage_path)),
    )
