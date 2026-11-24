from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import get_current_user, require_quality_engineer
from app.dependencies.common import get_container
from app.dependencies.container import AppContainer
from app.models.domain import DefectType, User
from app.schemas.api import InspectionCreate, InspectionPage, InspectionResponse
from app.services.inspection import InspectionService

router = APIRouter(tags=["inspections"])


@router.post("/inspections", response_model=InspectionResponse, status_code=201)
def create_inspection(
    payload: InspectionCreate,
    user: User = Depends(require_quality_engineer),
    container: AppContainer = Depends(get_container),
) -> InspectionResponse:
    return InspectionService(container).submit(payload, user)


@router.get("/inspections", response_model=InspectionPage)
def list_inspections(
    defect_type: DefectType | None = None,
    batch_id: Annotated[str | None, Query(max_length=64)] = None,
    inspector_id: Annotated[str | None, Query(max_length=64)] = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Literal[
        "inspected_at", "batch_id", "final_defect_type", "inspector_id"
    ] = "inspected_at",
    sort_order: Literal["asc", "desc"] = "desc",
    _: User = Depends(get_current_user),
    container: AppContainer = Depends(get_container),
) -> InspectionPage:
    return InspectionService(container).list_inspections(
        defect_type=defect_type,
        batch_id=batch_id,
        inspector_id=inspector_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/inspections/{inspection_id}", response_model=InspectionResponse)
def get_inspection(
    inspection_id: str,
    _: User = Depends(get_current_user),
    container: AppContainer = Depends(get_container),
) -> InspectionResponse:
    return InspectionService(container).get_inspection(inspection_id)
