from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User
from app.schemas.api import DashboardSummary
from app.services.dashboard import DashboardService

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_summary(
    _: User = Depends(get_current_user), container: AppContainer = Depends(get_container)
) -> DashboardSummary:
    return DashboardService(container).summary()
