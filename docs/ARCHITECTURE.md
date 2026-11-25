# Architecture

## Phase 2 runtime

The monorepo contains independently runnable React/Vite and FastAPI apps. Backend requests are versioned under `/api/v1`; routes bind schemas and dependencies, services implement workflow/business rules, repository protocols define data operations, and mock repositories provide no-database operation. A per-app container is constructed at startup and injected through FastAPI dependencies. `APP_MODE` selects mock or PostgreSQL repositories without changing the HTTP contract; `AI_PROVIDER` independently selects prediction behavior.

## Backend boundaries

- `app/api/routes/`: HTTP endpoints and dependency binding.
- `app/schemas/`: strict request and response contracts, including the shared five-value defect enum.
- `app/services/`: image-analysis lifecycle, inspection submission, history transformation, dashboard calculations.
- `app/repositories/protocols.py`: user, batch, pending-analysis lifecycle, and reviewed-inspection query contracts.
- `app/repositories/mock.py`: seeded demo identities/batches and in-memory analysis/inspection records.
- `app/services/ai/provider.py`: AI provider protocol, deterministic mock, and Gemini adapter.
- `app/services/image_storage.py`: image verification and safe local file storage behind a small storage component.
- `app/dependencies/`: application container and trusted demo-user role lookup.

Services depend on repository contracts. `APP_MODE=database` selects PostgreSQL adapters and fails clearly if the database is unreachable; it never silently falls back to mock.

## Inspection lifecycle and trust

Prediction uploads and validates an image, verifies the batch, asks the configured provider, validates its JSON and confidence/category, stores a server-generated image reference, and creates an unreviewed analysis owned by the selected inspector. It is not yet a completed inspection. In PostgreSQL mode, this is one `inspections` table row with status `UNREVIEWED`.

Submission accepts only the analysis ID, final classification, and optional comment. The server checks ownership, batch, stored image, preserves original prediction/provider metadata, computes the override flag, and prevents a second submission. In PostgreSQL mode it updates that same row to `REVIEWED` in one transaction. History and dashboard queries include reviewed records only. The browser cannot supply an authoritative role, AI prediction/confidence, or override flag.

Demo identity is selected with `X-User-Id` (`1` for Priya or `2` for Rahul). The role is always looked up in repository data. This is a demo selection mechanism, not production authentication.

## Image and AI boundaries

JPEG, PNG, and WebP content is decoded and verified with Pillow; MIME type must agree with actual content; uploads have a configurable 5 MiB default limit and 40 MP pixel limit. Uploaded filenames are ignored. Local storage accepts only generated UUID references and the browser receives an API reference, not a filesystem path.

The deterministic mock provider uses image bytes to return one of the exact five categories with a fixed indicative score. The Gemini adapter sends the validated image and batch/product context, requests structured JSON matching the backend prediction contract, and records the selected model/provider with the analysis. `AI_API_KEY` is backend-only; missing credentials prevent Gemini mode from starting. Provider failures and malformed responses remain errors; they are never translated to `No Defect`.

## Dashboard and repository strategy

Dashboard service formulas use only final classifications and repository aggregate operations. The PostgreSQL implementation uses SQL `GROUP BY` and `COUNT` instead of loading all records. The in-memory repository necessarily filters its local collection before pagination.

## Current assumptions and limits

- `APP_MODE=mock` and `AI_PROVIDER=mock` are the verified no-setup choices.
- Mock inspections and unreviewed analyses are lost on backend restart; image files remain under the configured local storage directory.
- No production authentication, deployment, or container infrastructure is included. Live-model output quality depends on image quality and is not calibrated as a statistical probability; every decision remains subject to engineer review.
