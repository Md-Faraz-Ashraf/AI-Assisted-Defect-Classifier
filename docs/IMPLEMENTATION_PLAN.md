# Implementation Plan

## Overall progress

- Current phase: Phase 2 — Build Backend API
- Phase 1 status: `APPROVED`
- Phase 2 status: `READY_FOR_REVIEW`
- Later phases remain `NOT_STARTED` and will not begin until the preceding phase is explicitly approved.

Statuses: `NOT_STARTED`, `IN_PROGRESS`, `READY_FOR_REVIEW`, `APPROVED`, `BLOCKED`, `REJECTED`, `COMPLETED`.

## Phase 1 — Project Structure Setup

| Task ID | Description | Status | Dependencies | Verification method / actual result | User input required? |
|---|---|---|---|---|---|
| P1-01 | Inspect repository and conventions | COMPLETED | None | Only `CODEX_MASTER_PROMPT.md` existed; no Git repository or prior app code detected. Node 24.21.0, npm 11.19.0, Python 3.14.7 available. | No |
| P1-02 | Establish monorepo directories and config | COMPLETED | P1-01 | Created root docs/config, frontend feature-oriented folders, backend modular folders, env example, Makefile, and pre-commit config. | No |
| P1-03 | Initialize minimal React/Vite frontend | COMPLETED | P1-02 | `npm install` succeeded (232 packages initially; 0 vulnerabilities). TypeScript, ESLint, Prettier, Vitest (1 test), production build passed. Vite started; `GET /` returned HTTP 200. | No |
| P1-04 | Initialize FastAPI backend foundation | COMPLETED | P1-02 | `python -m pip install -e ".[dev]"` succeeded on Python 3.14.7. Ruff lint/format passed; pytest: 1 passed. Uvicorn started; health endpoint returned `{"status":"ok"}` with HTTP 200. | No |
| P1-05 | Add initial docs and environment example | COMPLETED | P1-02 | README and initial docs created. Placeholder-only `.env.example`; source scan found no likely API-key/private-key patterns. npm audit endpoint could not resolve in sandbox, so a fresh registry security scan was not verified; npm install reported 0 vulnerabilities. | No |
| P1-06 | User approval to proceed | APPROVED | P1-02–P1-05 | User explicitly instructed starting Phase 2. The user did not separately report running the Phase 1 manual checks. | No |

Phase status: `APPROVED`

## Phase 2 — Build Backend API

| Task ID | Description | Status | Dependencies | Verification method / actual result | User input required? |
|---|---|---|---|---|---|
| P2-01 | Define shared domain taxonomy, API schemas, repository protocols, and error contracts | COMPLETED | Phase 1 approved | Backend API tests validate the five categories and request/response constraints. | No |
| P2-02 | Implement seeded mock user/batch repositories, inspection/analysis repositories, and mode provider | COMPLETED | P2-01 | API tests confirm seed data; database mode fails clearly instead of falling back to mock. | No |
| P2-03 | Implement versioned health, user, batch, AI, inspection, image, and dashboard endpoints | COMPLETED | P2-01, P2-02 | OpenAPI endpoint test plus integration tests; manual smoke pending user review. | No |
| P2-04 | Enforce demo-user roles and pending-analysis ownership | COMPLETED | P2-02 | Tests cover missing/unknown users, supervisor forbidden writes, read access, and analysis ownership. | No |
| P2-05 | Implement deterministic AI provider, vision-provider boundary, and response/error validation | COMPLETED | P2-01 | Tests cover deterministic output, malformed/unsupported response, confidence bounds, timeout, rate limit, and provider error. | No for mock; real provider requires user selection/key |
| P2-06 | Validate and store images safely behind storage interface | COMPLETED | P2-01 | Tests cover valid images, invalid content, MIME mismatch, file size, generated names, serving, and traversal attempt. | No |
| P2-07 | Add business/API tests and run backend lint, formatting, type/syntax and smoke checks | COMPLETED | P2-01–P2-06 | `python -m pytest -v`: 30 passed; Ruff lint and format check passed; `python -m mypy app`: no issues in 26 source files; `python -m compileall -q app` passed. Live Uvicorn smoke on port 8001: health `ok`, users 2, batches 3, empty dashboard total 0, Swagger HTTP 200. | No |
| P2-08 | Document API examples and update architecture, setup, user dependencies, and checklist | COMPLETED | P2-01–P2-07 | Updated API reference with endpoint contracts, request examples, error shape, demo user mechanism, Swagger and PowerShell verification. README and architecture/user-input docs reflect current implementation and limitations. | No |
| P2-09 | User manual verification and approval | NOT_STARTED | P2-01–P2-08 | User follows Swagger/PowerShell steps and explicitly approves. | Yes |

Phase status: `READY_FOR_REVIEW`

## Phase 3 — Build React and Integrate with Backend

Phase status: `NOT_STARTED`

## Phase 4 — Verify Complete Mock Flow

Phase status: `NOT_STARTED`

## Phase 5 — Pluggable PostgreSQL Integration

Phase status: `NOT_STARTED`

## Technical decisions and assumptions

- The starting repository contains only the supplied master prompt, so there was no existing code or convention to preserve.
- Keep the requested monorepo at the repository root (no extra nested project directory).
- Use a conventional Vite React + TypeScript frontend and FastAPI backend; no containers or external infrastructure.
- The current runtime provides Node 24 and Python 3.14.7. Backend support targets Python 3.11+ and will be verified on the available Python 3.14 runtime.
- Keep each phase approval-gated; the user explicitly approved moving from Phase 1 to Phase 2.
- Phase 2 uses in-memory mock repositories and local generated-name image files. Inspection/analysis records reset on backend restart; image files remain.
- The configured `vision` provider is an explicit integration boundary and responds with a safe unavailable error until a vendor adapter/model is selected and credentials are supplied.

## Dependencies and verification evidence

Phase 1 frontend and backend checks passed as previously recorded. The user approved Phase 1 by directing the implementation to proceed to Phase 2.

Phase 2 verification evidence:

- Installed backend dependencies with `python -m pip install -e ".[dev]"` on Python 3.14.7, including `python-multipart`, Pillow, and Mypy.
- `python -m pytest -v`: 30 passed, 1 upstream Starlette deprecation warning.
- `python -m ruff check .`: passed.
- `python -m ruff format --check .`: passed.
- `python -m mypy app`: passed, no issues in 26 source files.
- `python -m compileall -q app`: passed.
- Started Uvicorn on port 8001 because port 8000 was already occupied. Live requests returned health `ok`, 2 demo users, 3 batches, empty dashboard total `0`, and Swagger UI HTTP 200.
- OpenAPI is generated from the running FastAPI app; automated test checks the Phase 2 endpoints are present.
- The local mock API needs neither PostgreSQL nor an AI key. Live vision analysis remains unverified and needs user selection of a provider/model and local credential configuration.

Phase 2 is `READY_FOR_REVIEW`; no Phase 2 approval has been recorded.

## Open questions

- Which real AI provider/model to use is deferred until the provider phase; mock provider remains the planned default.
- PostgreSQL connection details are only needed for Phase 5.

## User approval history

- 2026-11-24: User explicitly approved Phase 1 and instructed start of Phase 2 (`"project is pushed to git. please start phase 2"`).
- Phase 2 user review is pending.
