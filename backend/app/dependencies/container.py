from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings
from app.repositories.mock import (
    MockBatchRepository,
    MockInspectionRepository,
    MockPendingAnalysisRepository,
    MockUserRepository,
)
from app.repositories.protocols import (
    BatchRepository,
    InspectionRepository,
    PendingAnalysisRepository,
    UserRepository,
)
from app.services.ai.provider import AIProvider, MockAIProvider, VisionProviderBoundary
from app.services.image_storage import ImageStorage, LocalImageStorage


@dataclass
class AppContainer:
    settings: Settings
    users: UserRepository
    batches: BatchRepository
    inspections: InspectionRepository
    analyses: PendingAnalysisRepository
    ai_provider: AIProvider
    image_storage: ImageStorage


def build_container(settings: Settings) -> AppContainer:
    if settings.app_mode == "database":
        raise RuntimeError(
            "APP_MODE=database was selected, but PostgreSQL repositories "
            "are not available until Phase 5."
        )
    if settings.app_mode != "mock":
        raise RuntimeError("APP_MODE must be either 'mock' or 'database'.")
    if settings.ai_provider == "mock":
        provider: AIProvider = MockAIProvider()
    elif settings.ai_provider == "vision":
        provider = VisionProviderBoundary()
    else:
        raise RuntimeError("AI_PROVIDER must be either 'mock' or 'vision'.")
    return AppContainer(
        settings=settings,
        users=MockUserRepository(),
        batches=MockBatchRepository(),
        inspections=MockInspectionRepository(),
        analyses=MockPendingAnalysisRepository(),
        ai_provider=provider,
        image_storage=LocalImageStorage(Path(settings.image_storage_path)),
    )
