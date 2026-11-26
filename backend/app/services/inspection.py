import logging
from datetime import UTC, datetime
from math import ceil
from uuid import uuid4

import anyio
from pydantic import ValidationError

from app.core.errors import AIProviderError, AIProviderRateLimited, AIProviderUnavailable, AppError
from app.dependencies.container import AppContainer
from app.models.domain import (
    Batch,
    DefectType,
    Inspection,
    InspectionStatus,
    PendingAnalysis,
    Prediction,
    User,
)
from app.schemas.ai import ProviderPrediction
from app.schemas.api import (
    AIResponse,
    InspectionFinalizeRequest,
    InspectionPage,
    InspectionResponse,
    PredictionResponse,
)
from app.services.image_storage import validate_image

logger = logging.getLogger(__name__)


class InspectionService:
    def __init__(self, container: AppContainer) -> None:
        self.container = container

    async def predict(
        self, *, image: bytes, media_type: str | None, batch_id: str, user: User
    ) -> AIResponse:
        # Check if batch exits
        batch = self.container.batch_repository.get_batch(batch_id)
        if batch is None:
            raise AppError(404, "batch_not_found", "The selected batch does not exist.")
        # Validate before calling AI so invalid uploads don't incur provider cost.
        normalized_type, extension = await anyio.to_thread.run_sync(
            validate_image,
            image,
            media_type,
            self.container.settings.max_image_size_bytes,
        )
        try:
            # The call to analyze method of the AI service
            raw_response = await self.container.ai_provider.analyze(image, normalized_type, batch)
        except TimeoutError as exc:
            logger.warning("AI provider timed out")
            raise AppError(
                504, "ai_timeout", "The AI provider timed out. Please try again."
            ) from exc
        except AIProviderRateLimited as exc:
            logger.warning("AI provider rate limited the analysis")
            raise AppError(
                503, "ai_rate_limited", "The AI provider is temporarily rate limited."
            ) from exc
        except AIProviderUnavailable as exc:
            logger.warning("AI provider is unavailable")
            raise AppError(
                503, "ai_unavailable", "The configured AI provider is unavailable."
            ) from exc
        except AIProviderError as exc:
            logger.error("AI provider failed (%s)", type(exc).__name__)
            raise AppError(
                502, "ai_provider_error", "The AI provider could not analyze this image."
            ) from exc
        try:
            # Ensure the provider response matches the expected schema.
            prediction_payload = ProviderPrediction.model_validate_json(raw_response)
        except (ValidationError, TypeError) as exc:
            logger.warning("AI provider returned an invalid prediction payload")
            raise AppError(
                502,
                "invalid_ai_response",
                "The AI provider returned an invalid prediction response.",
            ) from exc
        prediction = Prediction(
            defect_type=prediction_payload.defect_type,
            confidence=prediction_payload.confidence,
            provider=self.container.ai_provider.name,
            model=self.container.ai_provider.model,
        )
        # Local disk is for development; production should use object storage.
        image_ref = await anyio.to_thread.run_sync(
            self.container.image_storage.save, image, extension
        )
        analysis = PendingAnalysis(
            inspection_id=str(uuid4()),
            batch_id=batch.batch_id,
            inspector_id=user.user_id,
            image_ref=image_ref,
            prediction=prediction,
            created_at=datetime.now(UTC),
        )
        # Save the analysis in inspections table and return it FE
        self.container.pending_analysis_repository.add(analysis)
        return AIResponse(
            inspection_id=analysis.inspection_id,
            status=InspectionStatus.UNREVIEWED,
            batch_id=batch.batch_id,
            image_url=f"/api/v1/images/{image_ref}",
            prediction=PredictionResponse(
                defect_type=prediction.defect_type,
                confidence=prediction.confidence,
                provider=prediction.provider,
                model=prediction.model,
            ),
            created_at=analysis.created_at,
        )

    def finalize(self, payload: InspectionFinalizeRequest, user: User) -> InspectionResponse:
        analysis = self.container.pending_analysis_repository.get(payload.inspection_id)
        if analysis is None:
            raise AppError(404, "analysis_not_found", "The AI analysis does not exist.")
        if analysis.inspector_id != user.user_id:
            raise AppError(403, "analysis_forbidden", "This AI analysis belongs to another user.")
        if analysis.submitted:
            raise AppError(
                409, "analysis_already_submitted", "This AI analysis was already submitted."
            )
        batch = self.container.batch_repository.get_batch(analysis.batch_id)
        if batch is None:
            raise AppError(422, "invalid_analysis", "The analysis references an unavailable batch.")
        if not self.container.image_storage.contains(analysis.image_ref):
            raise AppError(422, "invalid_analysis", "The analysis image is unavailable.")

        now = datetime.now(UTC)
        inspection = Inspection(
            inspection_id=analysis.inspection_id,
            batch_id=batch.batch_id,
            inspector_id=user.user_id,
            image_ref=analysis.image_ref,
            original_ai_prediction=analysis.prediction.defect_type,
            ai_confidence=analysis.prediction.confidence,
            ai_provider=analysis.prediction.provider,
            ai_model=analysis.prediction.model,
            final_defect_type=payload.final_defect_type,
            was_overridden=(analysis.prediction.defect_type != payload.final_defect_type),
            comments=payload.comments,
            inspected_at=now,
        )
        if not self.container.inspection_submission_repository.submit_pending(
            analysis.inspection_id, inspection
        ):
            raise AppError(
                409, "analysis_already_submitted", "This AI analysis was already submitted."
            )
        return self._inspection_response(inspection, batch, user.name)

    def list_inspections(
        self,
        *,
        status: InspectionStatus,
        defect_type: DefectType | None,
        batch_id: str | None,
        inspector_id: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        page: int,
        page_size: int,
        sort_by: str,
        sort_order: str,
    ) -> InspectionPage:
        if date_from is not None and date_from.tzinfo is None:
            date_from = date_from.replace(tzinfo=UTC)
        if date_to is not None and date_to.tzinfo is None:
            date_to = date_to.replace(tzinfo=UTC)
        if date_from is not None and date_to is not None and date_from > date_to:
            raise AppError(
                422, "invalid_date_range", "date_from must be earlier than or equal to date_to."
            )
        rows, total = self.container.inspection_repository.list_page(
            status=status,
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
        users = {person.user_id: person for person in self.container.user_repository.list_users()}
        batches = {
            batch.batch_id: batch for batch in self.container.batch_repository.list_batches()
        }
        return InspectionPage(
            items=[
                self._inspection_response(
                    row,
                    batches[row.batch_id],
                    users[row.inspector_id].name,
                )
                for row in rows
            ],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    def get_inspection(self, inspection_id: str) -> InspectionResponse:
        inspection = self.container.inspection_repository.get(inspection_id)
        if inspection is None:
            raise AppError(404, "inspection_not_found", "The inspection does not exist.")
        batch = self.container.batch_repository.get_batch(inspection.batch_id)
        inspector = self.container.user_repository.get_user(inspection.inspector_id)
        if batch is None or inspector is None:
            raise AppError(
                500, "invalid_inspection", "The inspection references missing related data."
            )
        return self._inspection_response(inspection, batch, inspector.name)

    @staticmethod
    def _inspection_response(
        inspection: Inspection | PendingAnalysis, batch: Batch, inspector_name: str
    ) -> InspectionResponse:
        if isinstance(inspection, Inspection):
            status = InspectionStatus.REVIEWED
            prediction = inspection.original_ai_prediction
            confidence = inspection.ai_confidence
            provider = inspection.ai_provider
            model = inspection.ai_model
            final_defect_type = inspection.final_defect_type
            was_overridden = inspection.was_overridden
            comments = inspection.comments
            inspected_at = inspection.inspected_at
        else:
            status = InspectionStatus.UNREVIEWED
            prediction = inspection.prediction.defect_type
            confidence = inspection.prediction.confidence
            provider = inspection.prediction.provider
            model = inspection.prediction.model
            final_defect_type = None
            was_overridden = None
            comments = None
            inspected_at = None

        return InspectionResponse(
            inspection_id=inspection.inspection_id,
            status=status,
            batch_id=inspection.batch_id,
            batch_number=batch.batch_number,
            product_name=batch.product_name,
            inspector_id=inspection.inspector_id,
            inspector_name=inspector_name,
            image_ref=inspection.image_ref,
            image_url=f"/api/v1/images/{inspection.image_ref}",
            original_ai_prediction=prediction,
            ai_confidence=confidence,
            ai_provider=provider,
            ai_model=model,
            final_defect_type=final_defect_type,
            was_overridden=was_overridden,
            comments=comments,
            inspected_at=inspected_at,
        )
