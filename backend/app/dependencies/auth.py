from typing import Annotated

from fastapi import Depends, Header

from app.core.errors import AppError
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User, UserRole


def get_current_user(
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
    container: AppContainer = Depends(get_container),
) -> User:
    if not x_user_id:
        raise AppError(401, "user_id_required", "Provide a user ID in the X-User-Id header.")
    user = container.user_repository.get_user(x_user_id)
    if user is None:
        raise AppError(401, "unknown_user_id", "The selected user ID does not exist.")
    return user


def require_quality_engineer(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.QUALITY_ENGINEER:
        raise AppError(403, "forbidden", "Only a Quality Engineer can perform this action.")
    return user
