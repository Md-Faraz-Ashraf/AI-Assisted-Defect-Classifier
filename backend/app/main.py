import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.ai import router as ai_router
from app.api.routes.batches import router as batches_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.images import router as images_router
from app.api.routes.inspections import router as inspections_router
from app.api.routes.users import router as users_router
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.dependencies.container import build_container

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    container = build_container(app_settings)
    application = FastAPI(
        title="Quality Inspection API",
        description="Human-reviewed manufacturing quality inspection API.",
        version="0.2.0",
    )
    application.state.container = container
    application.router.on_shutdown.append(container.close)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[app_settings.frontend_origin],
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Demo-User"],
    )

    @application.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @application.exception_handler(RequestValidationError)
    async def request_validation_error_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "request_validation_error",
                    "message": "The request did not match the required format.",
                    "details": [
                        {
                            "location": [str(part) for part in item["loc"]],
                            "message": item["msg"],
                            "type": item["type"],
                        }
                        for item in exc.errors()
                    ],
                }
            },
        )

    application.include_router(health_router, prefix="/api/v1")
    for router in (
        users_router,
        batches_router,
        ai_router,
        inspections_router,
        dashboard_router,
        images_router,
    ):
        application.include_router(router, prefix="/api/v1")
    return application


app = create_app()
