from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.dependencies.common import get_container
from app.dependencies.container import AppContainer

router = APIRouter(tags=["health"])


@router.get("/health", response_model=None)
def get_health(container: AppContainer = Depends(get_container)) -> dict[str, str] | JSONResponse:
    try:
        container.check_database()
    except SQLAlchemyError:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}
