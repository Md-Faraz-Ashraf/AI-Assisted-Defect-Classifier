from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User
from app.schemas.api import BatchResponse

router = APIRouter(tags=["batches"])


@router.get("/batches", response_model=list[BatchResponse])
def list_batches(
    _: User = Depends(get_current_user), container: AppContainer = Depends(get_container)
) -> list[BatchResponse]:
    return [
        BatchResponse.model_validate(batch) for batch in container.batch_repository.list_batches()
    ]
