# Implementation Plan

## Overall progress

- Current phase: Phase 5 — Pluggable PostgreSQL Integration
- Phase 1 status: `APPROVED`
- Phase 2 status: `APPROVED`
- Phase 3 status: `APPROVED`
- Phase 4 status: `APPROVED`
- Phase 5 status: `APPROVED`
- Proposed Phase 6 status: `NOT_STARTED` (not present in the supplied five-phase master prompt; requires owner approval as a plan amendment)
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
| P2-09 | User manual verification and approval | APPROVED | P2-01–P2-08 | User explicitly approved Phase 2 and instructed starting Phase 3 on 2026-11-24. | Yes |

Phase status: `APPROVED`

## Phase 3 — Build React and Integrate with Backend

| Task ID | Description | Status | Dependencies | Verification method / actual result | User input required? |
|---|---|---|---|---|---|
| P3-01 | Configure React, strict TypeScript, routing, TanStack Query, forms, validation, Tailwind and reusable shadcn/ui | COMPLETED | Phase 2 approved | React Router, TanStack Query, React Hook Form, Zod, Tailwind 4 and shadcn/ui are configured; `components.json` and themed components are present. | No |
| P3-02 | Build responsive dashboard, summary metrics, final-defect chart, recent history, and loading/error/empty states | COMPLETED | P3-01 | Dashboard uses typed API queries and server calculations; screen-level empty-state test passes. | No |
| P3-03 | Build inspection history with image previews, decision status, filters and pagination | COMPLETED | P3-01 | API-backed history table and batch/defect filters; history empty-state and filter controls test passes. | No |
| P3-04 | Build engineer-only upload, AI prediction, accept/override, comments, and submission flow | COMPLETED | P3-01, P3-02 | Zod validates JPEG/PNG/WebP and 5 MiB limit; final category is required; request mutation invalidates dashboard/history and navigates on success. Supervisor link and route are role-gated in the UI; backend remains authoritative. | No |
| P3-05 | Add typed API client, cancellation, query keys, demo-user selector and role indicator | COMPLETED | P3-01 | API client tests cover demo header, query filters, multipart upload and structured API errors; queries pass TanStack cancellation signals. | No |
| P3-06 | Run frontend checks and API integration smoke | COMPLETED | P3-01–P3-05 | `npm run typecheck`, lint (0 errors), Prettier, Vitest (5 passed), and production build passed. Existing Phase 2 backend integration suite has 30 passing cases. Direct Uvicorn loopback smoke was attempted but Windows sandbox denied the socket (`WinError 10013`); combined browser-to-live-API flow remains for Phase 4 verification. `npm audit --omit=dev` could not reach registry DNS. | No |
| P3-07 | User verification and approval to proceed | APPROVED | P3-01–P3-06 | User explicitly approved Phase 3 on 2026-11-24. User had reported end-to-end mock backend verification. | Yes |

Phase status: `APPROVED`

## Phase 4 — Verify Complete Mock Flow

| Task ID | Description | Status | Dependencies | Verification method / actual result | User input required? |
|---|---|---|---|---|---|
| P4-01 | Verify acceptance, override, No Defect metrics, supervisor permissions, and API error handling | COMPLETED | Phase 3 approved | Existing Phase 2 API tests cover all listed backend cases (30 passed in recorded Phase 2 run; see `docs/MOCK_FLOW_VERIFICATION.md`). Frontend checks pass (5 tests), but UI-specific manual cases are not individually confirmed. | No |
| P4-02 | Verify complete workflow through browser and live HTTP API; record evidence | APPROVED | P4-01 | User explicitly reported manual verification of Phase 4 on 2026-11-24. Local socket test attempts in this environment were denied/stalled; user performed the manual end-to-end verification. | Yes |
| P4-03 | User confirmation before Phase 5 | APPROVED | P4-01–P4-02 | User confirmed: “Manually verified phase 4!” on 2026-11-24. | Yes |

Phase status: `APPROVED`

## Phase 5 — Pluggable PostgreSQL Integration

Database lifecycle decision: use exactly three application tables (`users`, `batches`, `inspections`). A prediction creates one `inspections` row with `UNREVIEWED`; the engineer's submission updates that same row to `REVIEWED`. The API analysis identifier is the row's UUID. There is no `pending_analyses` table.

| Task ID | Description | Status | Dependencies | Verification method / actual result | User input required? |
|---|---|---|---|---|---|
| P5-01 | Add SQLAlchemy, PostgreSQL driver, settings, and database session lifecycle | COMPLETED | Phase 4 approved | Installed SQLAlchemy/Alembic/Psycopg; DB mode explicitly checks the PostgreSQL connection and fails without mock fallback. | No |
| P5-02 | Implement three-table schema and PostgreSQL repository adapters | COMPLETED | P5-01 | Shared API/domain services; prediction inserts `UNREVIEWED`; submission transaction updates the same row to `REVIEWED`; reads/dashboard exclude unreviewed records. | No |
| P5-03 | Add Alembic migration, repeatable seed, explicit reset, and database docs | COMPLETED | P5-01, P5-02 | Initial migration test verifies only users, batches, inspections, and Alembic bookkeeping are created; seed test runs twice without duplicates. | No |
| P5-04 | Test persistence adapters, status transition, rollback, API contract, and mock regressions | COMPLETED | P5-01–P5-03 | Backend suite: 35 passed; Ruff lint/format and Mypy passed. Frontend typecheck, lint (0 errors, 4 warnings), Prettier, Vitest (5 passed), and production build passed. SQLite migration test confirms three application tables and no `pending_analyses`. | No |
| P5-05 | Verify local PostgreSQL migration/seed, HTTP lifecycle, restart persistence, and user review | APPROVED | P5-01–P5-04 | Connected with local `.env`; migration `20261124_01` and seed succeeded. User completed the database-mode end-to-end flow and confirmed it works. PostgreSQL contains 4 reviewed inspections; a newly constructed backend app instance returned all 4 in history and dashboard. | Yes |

Phase status: `APPROVED`

## Proposed Phase 6 — Real Vision Provider Integration

The supplied master prompt ends at Phase 5 and does not schedule a live vendor adapter. Phase 2 delivered only the provider contract and deterministic mock. This proposed phase would add a selected vendor SDK/client, backend-only credential configuration, structured response parsing, timeout/rate-limit/error handling, and provider-specific tests, while retaining mock mode. It requires owner approval as a plan amendment and selection of a provider/model plus a locally configured API key. No live-model calls should be made before that approval and configuration.

Phase status: `NOT_STARTED` (proposed; plan amendment not yet approved)

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

Phase 2 was explicitly approved by the user on 2026-11-24. Phase 3 was approved by the user; Phase 4 verification is in progress.

## Open questions

- A real vision adapter is not assigned to any of the supplied five phases. Phase 2 implements only the provider boundary and mock. A proposed Phase 6 is recorded above, pending owner approval and provider/model selection.
- PostgreSQL connection details are only needed for Phase 5.

## User approval history

- 2026-11-24: User explicitly approved Phase 1 and instructed start of Phase 2 (`"project is pushed to git. please start phase 2"`).
- 2026-11-24: User explicitly approved Phase 2 and instructed start of Phase 3.
- 2026-11-24: Phase 3 implementation reached `READY_FOR_REVIEW`; user approved Phase 3 and proceeding to Phase 4.
- 2026-11-24: User manually verified and approved Phase 4; Phase 5 started.
- 2026-11-25: User confirmed database-mode end-to-end workflow works; Phase 5 approved.
- 2026-11-24: Identified that live vision-model implementation is not assigned in the five-phase prompt; proposed a separate Phase 6 after Phase 5, pending approval.
