import logging

from fastapi import FastAPI

from app.api.routes.health import router as health_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="Quality Inspection API",
    description="Foundation API for human-reviewed manufacturing quality inspection.",
    version="0.1.0",
)
app.include_router(health_router, prefix="/api/v1")
