from typing import Annotated

from fastapi import Depends, Header

from app.core.errors import AppError
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User, UserRole


def get_current_user(
    x_demo_user: Annotated[str | None, Header()] = None,
    container: AppContainer = Depends(get_container),
) -> User:
    if not x_demo_user:
        raise AppError(401, "demo_user_required", "Select a demo user with the X-Demo-User header.")
    user = container.user_repository.get_user(x_demo_user)
    if user is None:
        raise AppError(401, "unknown_demo_user", "The selected demo user does not exist.")
    return user


def require_quality_engineer(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.QUALITY_ENGINEER:
        raise AppError(403, "forbidden", "Only a Quality Engineer can perform this action.")
    return user
