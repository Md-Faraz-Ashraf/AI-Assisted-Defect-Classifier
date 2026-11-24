from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies.auth import require_quality_engineer
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import User
from app.schemas.api import AIResponse
from app.services.inspection import InspectionService

router = APIRouter(tags=["AI analysis"])


@router.post("/ai/predict", response_model=AIResponse, status_code=201)
async def predict(
    batch_id: Annotated[str, Form(min_length=1, max_length=64)],
    image: Annotated[UploadFile, File(description="JPEG, PNG, or WebP product image")],
    user: User = Depends(require_quality_engineer),
    container: AppContainer = Depends(get_container),
) -> AIResponse:
    content = await image.read(container.settings.max_image_size_bytes + 1)
    return await InspectionService(container).predict(
        image=content,
        media_type=image.content_type,
        batch_id=batch_id,
        user=user,
    )
