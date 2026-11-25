from fastapi import APIRouter, Depends

from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.schemas.api import UserResponse

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserResponse])
def list_users(container: AppContainer = Depends(get_container)) -> list[UserResponse]:
    return [UserResponse.model_validate(user) for user in container.user_repository.list_users()]
