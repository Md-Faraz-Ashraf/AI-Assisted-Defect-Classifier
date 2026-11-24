# AI-Assisted Manufacturing Quality Inspection

Starter monorepo for a human-reviewed manufacturing inspection workflow. The AI recommends a classification; a Quality Engineer makes and submits the final decision.

## Phase 1 status

This repository is being built in approval-gated phases. Phase 1 establishes the React/Vite and FastAPI foundations only. The business API and inspection workflow are intentionally not implemented yet.

## Product overview

The planned application supports manufacturing Quality Engineers who inspect product images. A vision model will recommend one of five classifications — Scratch, Dent, Paint Issue, Missing Component, or No Defect — and the engineer will accept or override that suggestion before submitting an inspection. The original AI prediction and final human decision will remain separately traceable. Production Supervisors will have read-only access to dashboard and inspection history. Backend role enforcement and the full workflow are scheduled for later phases.

Planned dashboard calculations use the final human classification: passed means `No Defect`; rejected means any other category; defect rate is rejected divided by all submitted inspections; AI acceptance rate is non-overridden submissions divided by all submissions. Zero-record percentage values will be zero. These metrics and API endpoints are not implemented in Phase 1.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Git

PostgreSQL and an AI API key are not required for the initial mock-first development path.

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

Health endpoint: http://127.0.0.1:8000/api/v1/health. API docs: http://127.0.0.1:8000/docs.

## Configuration

Copy `.env.example` to `.env` for local overrides. Never put credentials in source control. The current foundation reads environment variables through Pydantic Settings. Demo-user selection, authorization, image storage, database persistence, and AI integration are scheduled for later phases.

The planned AI boundary will keep provider credentials on the backend and use a deterministic mock provider for the no-key demo. PostgreSQL and SQL aggregation are planned for persistent mode; uploaded images will be stored on the local filesystem with generated safe names and only references stored in the database. No real AI provider, database schema, image handling, or authentication exists yet. Demo-user selection will be a development convenience, not production authentication.

## Current API and persistence

Only `GET /api/v1/health` exists today. There is no inspection, dashboard, user, batch, or AI endpoint yet. Phase 1 is stateless and does not require PostgreSQL. Persistent database setup, migration and seed commands, filtering/pagination contracts, and their verification will be added with Phase 5.

## Repository layout

- `frontend/` — React, TypeScript, Vite, Tailwind, Vitest
- `backend/` — FastAPI, Pydantic Settings, pytest, Ruff
- `docs/` — implementation checklist, user dependencies, architecture, API and database notes

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for phase status and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for current decisions. PostgreSQL schema, API contracts, AI provider choices/costs, image storage, detailed test/security commands, and database setup will be documented as those phases are implemented and verified.

## Current limitations

- The frontend is a foundation shell, not the complete inspection workflow.
- The backend has only a health endpoint; no business records are stored.
- No sample product images or external assets are included.
- No AI calls, PostgreSQL repositories, production authentication, or deployment setup are included at this stage.
- The full quick-demo and persistent setup paths will be documented after their implementation and verification phases.
