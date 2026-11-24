import anyio
from fastapi import APIRouter, Depends, Response

from app.core.errors import AppError
from app.dependencies.auth import get_current_user
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User

router = APIRouter(tags=["images"])


@router.get("/images/{image_ref}")
async def get_image(
    image_ref: str,
    _: User = Depends(get_current_user),
    container: AppContainer = Depends(get_container),
) -> Response:
    stored_image = await anyio.to_thread.run_sync(container.image_storage.load, image_ref)
    if stored_image is None:
        raise AppError(404, "image_not_found", "The image does not exist.")
    content, media_type = stored_image
    return Response(content=content, media_type=media_type)
