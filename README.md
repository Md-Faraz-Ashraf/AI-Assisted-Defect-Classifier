# AI-Assisted Manufacturing Quality Inspection

Starter monorepo for a human-reviewed manufacturing inspection workflow. The AI recommends a classification; a Quality Engineer makes and submits the final decision.

## Current status

This repository is being built in approval-gated phases. Phase 1 is approved and Phase 2 implements the FastAPI API, deterministic mock AI analysis, server-side authorization, image validation/storage, inspection history, and dashboard calculations. React integration and persistent PostgreSQL support are later phases.

## Product overview

The application supports manufacturing Quality Engineers who inspect product images. A configurable AI provider recommends one of five classifications — Scratch, Dent, Paint Issue, Missing Component, or No Defect — and the engineer accepts or overrides that suggestion before submitting an inspection. The original AI prediction and final human decision remain separately traceable. Production Supervisors have read-only access to dashboard and inspection history. Phase 2 currently uses a deterministic mock AI provider; no live vendor/model request is configured yet.

Dashboard calculations use the final human classification: passed means `No Defect`; rejected means any other category; defect rate is rejected divided by all submitted inspections; AI acceptance rate is non-overridden submissions divided by all submissions. Zero-record percentage values are zero.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Git

PostgreSQL and an AI API key are not required for the mock development path.

## Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). Build and quality commands: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`.

## Start the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Health endpoint: http://127.0.0.1:8000/api/v1/health. Interactive API docs: http://127.0.0.1:8000/docs. API examples are in [docs/API.md](docs/API.md).

Backend checks (run from `backend`):

```powershell
python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy app
python -m compileall -q app
```

## Configuration

Copy `.env.example` to `.env` for local overrides. Never put credentials in source control. The backend reads environment variables through Pydantic Settings. `APP_MODE=mock` is required for the current repository implementation; database mode will be added in Phase 5. `AI_PROVIDER=mock` selects deterministic mock analysis.

The AI provider boundary keeps credentials on the backend; the mock demo needs no key. A vision-provider integration boundary is available but no vendor adapter is configured. Uploaded images are validated and stored on the local filesystem with generated safe names. Mock repositories keep users, batches, analyses, and inspections in memory; records reset when the backend restarts. Demo-user selection uses `X-Demo-User: priya` or `X-Demo-User: rahul`; it is a development convenience, not production authentication.

Mock analysis has no provider cost. Real inference costs depend on the vendor, model, image resolution, and request volume; provider/model selection is deferred and no live AI cost has been incurred or verified.

## Current API and persistence

The API includes health, users, batches, prediction, inspection create/list/detail, image retrieval, and dashboard summary endpoints under `/api/v1`. PostgreSQL persistence, migrations, and seed/reset commands will be added in Phase 5.

## Repository layout

- `frontend/` — React, TypeScript, Vite, Tailwind, Vitest
- `backend/` — FastAPI, Pydantic Settings, pytest, Ruff
- `docs/` — implementation checklist, user dependencies, architecture, API and database notes

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for phase status, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions, and [docs/API.md](docs/API.md) for endpoint contracts. PostgreSQL schema and setup will be documented when implemented and verified.

## Current limitations

- The frontend is a foundation shell, not the complete inspection workflow.
- Mock repositories are in-memory, so inspections are not persistent across backend restarts.
- No sample product images or external assets are included.
- No live AI vendor adapter, PostgreSQL repositories, production authentication, or deployment setup are included at this stage.
- The mock API and inspection workflow are implemented, but the React application is not yet integrated with them.
- The persistent PostgreSQL setup path will be documented after its implementation and verification phase.
