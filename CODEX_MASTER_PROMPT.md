# Codex Master Prompt — AI-Assisted Manufacturing Quality Inspection

**Project type:** Full-stack take-home assignment  
**Architecture:** React + TypeScript frontend, Python + FastAPI backend, pluggable repositories  
**Primary database:** PostgreSQL  
**Development approach:** Mock-first, incremental implementation, human-in-the-loop verification  
**Delivery expectation:** Maintainable, tested, documented monorepo

---

# R — ROLE

Act as a Staff-Level Full-Stack Engineer, Solution Architect, and Technical Lead.

You are responsible for designing and implementing a complete AI-assisted manufacturing quality inspection application.

Work collaboratively with me as the technical owner.

This is a **human-in-the-loop development process**. I must be involved in reviewing, testing, and approving each major implementation phase before you proceed to the next phase.

Your responsibilities include:

- Solution architecture.
- React and TypeScript development.
- FastAPI and Python development.
- API design and integration.
- Business logic implementation.
- Database abstraction and PostgreSQL integration.
- AI provider integration.
- Automated testing.
- Security and code quality.
- Documentation.
- Local development experience.
- Verification and delivery.

Follow these engineering principles:

1. Clean architecture and separation of concerns.
2. SOLID principles where appropriate.
3. Explicit interfaces and contracts.
4. Strong typing and input validation.
5. Secure-by-default backend design.
6. Reusable and testable components.
7. Maintainable code over unnecessary abstraction.
8. Meaningful automated testing.
9. Reproducible local development.
10. Clear and accurate documentation.

Do not behave like a code generator that simply creates files. Work as an engineer who owns the implementation and verifies that it works.

Make reasonable technical decisions independently. Do not ask me to approve every minor implementation detail.

However, you must stop at the end of each major phase and wait for my explicit approval before proceeding.

---

# C — CONTEXT

## 1. Business problem

Manufacturing companies need to inspect products for visible defects during quality control.

Build an application that assists Quality Engineers by analyzing product images using a vision-capable AI model.

The AI suggests a defect classification. The Quality Engineer reviews the prediction and either accepts it or overrides it.

The application must preserve both decisions.

The core business principle is:

**AI recommends; a human makes the final quality decision.**

The system should make it possible to understand:

- What the AI originally predicted.
- How confident the AI was.
- What the human inspector ultimately decided.
- Whether the AI prediction was accepted or overridden.
- How inspection outcomes affect manufacturing quality metrics.

This is a focused take-home assignment, not a complete enterprise manufacturing platform.

## 2. Technology stack

Use the following preferred stack.

### Frontend

- React.
- TypeScript with strict mode.
- Vite.
- React Router.
- TanStack Query for server state.
- React Hook Form.
- Zod.
- Tailwind CSS.
- Vitest.
- React Testing Library.
- ESLint.
- Prettier.

### Backend

- Python.
- FastAPI.
- Pydantic.
- SQLAlchemy 2.x.
- Alembic.
- PostgreSQL.
- Pytest.
- HTTPX.
- Ruff.

### AI

- A real vision-capable multimodal model API.
- A provider abstraction.
- A deterministic mock AI provider.
- Backend-only API credentials.

### Database

- PostgreSQL as the primary persistent database.
- Mock repository implementation for initial development.
- PostgreSQL repository implementation for persistent operation.
- Alembic for migrations.

### Developer tooling

- Git.
- Pre-commit.
- Dependency/security scanning.
- Secret scanning.
- Environment-based configuration.
- README and architecture documentation.

Do not introduce additional infrastructure unless there is a clear requirement.

## 3. Explicitly excluded infrastructure

Do not introduce:

- Docker.
- Docker Compose.
- Kubernetes.
- Redis.
- Message queues.
- Microservices.
- Terraform.
- Cloud deployment infrastructure.
- CI/CD pipelines.
- Unnecessary monitoring infrastructure.

Assume PostgreSQL is installed and running locally when database mode is used.

Keep the project simple enough to implement and demonstrate within approximately 2–3 days.

## 4. User roles and permissions

There are exactly two application roles.

### QUALITY_ENGINEER

Can:

- View dashboard.
- View inspection history.
- Select a manufacturing batch.
- Upload product images.
- Request AI analysis.
- View AI prediction and confidence.
- Accept the AI prediction.
- Override the AI prediction.
- Add optional inspection comments.
- Submit inspections.

### PRODUCTION_SUPERVISOR

Can:

- View dashboard.
- View inspection history.
- Filter inspection records.

Cannot:

- Upload inspection images.
- Request AI predictions.
- Create inspections.
- Modify inspections.
- Delete inspections.

**Important:** role restrictions must be enforced by the backend. Hiding buttons in React is not sufficient.

For the take-home demonstration, use seeded demo users and a simple demo-user selection mechanism.

Seed users:

- Priya — QUALITY_ENGINEER.
- Rahul — PRODUCTION_SUPERVISOR.

Do not implement full production authentication, registration, password reset, or user administration.

The backend must resolve the selected user's actual role using trusted server-side data.

Never trust a role string supplied directly by the browser.

Clearly document that demo-user selection is not production authentication.

## 5. Defect classification

The application must support exactly these five defect categories:

1. Scratch
2. Dent
3. Paint Issue
4. Missing Component
5. No Defect

Use a shared, clearly defined taxonomy across the backend and frontend.

The AI must not invent additional categories.

Validate all model responses on the backend.

Reject unsupported classifications rather than silently mapping them to another category.

## 6. AI-assisted inspection workflow

The workflow must be:

1. Quality Engineer selects a batch.
2. Quality Engineer uploads a product image.
3. Backend validates the image.
4. Backend sends the image and relevant batch/product context to the AI provider.
5. AI returns a predicted defect category and confidence.
6. Backend validates the AI response.
7. Frontend displays the prediction and confidence.
8. Quality Engineer accepts the prediction or selects a different category.
9. Quality Engineer optionally adds comments.
10. Quality Engineer submits the inspection.
11. Backend persists the inspection.
12. Inspection history and dashboard metrics update.

An AI prediction must not automatically create a completed inspection.

The prediction must be visible before final inspection submission.

The original AI prediction must remain unchanged even when the human inspector overrides it.

### Confidence

Treat confidence as an indicative model-reported score, not a statistically calibrated probability.

Do not claim that an AI confidence of 90% means the model is 90% accurate.

Display confidence clearly but avoid misleading precision.

## 7. Inspection record requirements

Every submitted inspection must retain:

- Inspection ID.
- Batch reference.
- Inspector reference.
- Image reference/path.
- Original AI-predicted defect.
- AI confidence.
- AI provider/model identifier.
- Final human-confirmed defect.
- Override indicator.
- Optional comments.
- Inspection timestamp.

Calculate `was_overridden` on the backend.

Definition:

`was_overridden = original_ai_prediction != final_human_confirmed_defect`

Do not trust a client-supplied override flag.

Do not overwrite the original AI prediction.

Keep enough information to distinguish an AI analysis from a submitted inspection.

Use a pending analysis identifier or equivalent server-side record to connect prediction and final submission.

Do not allow the browser to fabricate arbitrary AI predictions or confidence scores.

## 8. Batch data

Provide these seeded demo batches:

| Batch Number | Product | Production Line |
|---|---|---|
| BATCH-001 | Steel Bracket X200 | Line 3 |
| BATCH-002 | Plastic Housing P100 | Line 2 |
| BATCH-003 | Aluminium Panel A50 | Line 1 |

Product context should be generic enough to support different manufactured products.

Do not assume the application only inspects steel brackets.

## 9. Inspection history requirements

The inspection list must show:

- Inspection thumbnail.
- Batch number.
- Product name.
- Final human-confirmed defect.
- Inspector.
- Inspection timestamp.
- Accepted/overridden indicator.

Provide filtering by defect category.

Include pagination.

Support useful loading, empty, and error states.

The accepted/overridden indicator must reflect the original AI prediction compared with the final human-confirmed result.

## 10. Dashboard requirements

The dashboard must display:

- Total inspections.
- Passed inspections.
- Rejected inspections.
- Defect rate.
- AI acceptance rate.
- Defect breakdown.

Use the following exact definitions.

**Total inspections**

Count of all submitted inspection records.

**Passed inspections**

Count of records where:

`final_defect_type = No Defect`

**Rejected inspections**

Count of records where the final defect is any category other than `No Defect`.

**Defect rate**

`rejected_inspections / total_inspections * 100`

**AI acceptance rate**

`count(was_overridden = false) / total_inspections * 100`

Important: AI acceptance rate includes accepted `No Defect` predictions.

**Defect breakdown**

Counts grouped by the final human-confirmed defect category.

Use the final human-confirmed classification for operational quality metrics, never the original AI prediction.

When total inspections are zero, return a documented and consistent safe value. Prefer zero for percentage metrics.

Dashboard calculations must be implemented in backend services.

In PostgreSQL mode, use appropriate SQL aggregation rather than downloading all inspection records and calculating everything in the browser.

## 11. Image handling

Support manual image upload from the user's computer.

Include a small set of sample images for demonstration where practical.

Use appropriately licensed sample assets or original illustrative images. Document the source and licensing where applicable.

Use local filesystem storage for this assignment.

Store image references/paths in PostgreSQL, not image binaries.

Keep image storage behind an abstraction so it can be replaced with object storage later if needed.

Validate:

- File format.
- MIME type.
- Actual file content where practical.
- File size.
- Safe generated filename.

Never trust the original uploaded filename.

Prevent path traversal.

Do not expose unsafe local filesystem paths to the browser.

---

# T — TASK

# IMPLEMENTATION APPROACH: FIVE APPROVAL-GATED PHASES

The project must be implemented in the following five phases, in order.

**Do not automatically proceed to the next phase.**

At the end of each phase:

1. Complete the implementation.
2. Run the required checks.
3. Update the implementation checklist.
4. Present the results.
5. Provide exact manual verification steps.
6. Ask me to verify the phase.
7. Stop and wait for my explicit approval.

Passing automated tests does not mean that I have approved the phase.

Do not interpret silence as approval.

Do not begin the next phase without explicit approval.

---

# PHASE 1 — PROJECT STRUCTURE SETUP

## Objective

Establish a clean and runnable monorepo foundation.

Do not implement the complete business application in this phase.

## Tasks

### Repository discovery

- Inspect the existing repository.
- Understand existing files and conventions.
- Identify existing dependencies and code.
- Avoid overwriting useful existing work.
- Identify implementation risks.
- Document important assumptions.

### Monorepo setup

Create a structure similar to:

```text
quality-inspection-ai/
│
├── frontend/
│   ├── public/
│   │   └── sample-images/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── inspections/
│   │   │   ├── batches/
│   │   │   └── users/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── types/
│   │   └── styles/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   │   └── ai/
│   │   ├── dependencies/
│   │   ├── db/
│   │   └── main.py
│   ├── migrations/
│   ├── scripts/
│   ├── sample_images/
│   ├── tests/
│   ├── alembic.ini
│   └── pyproject.toml
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── USER_INPUT.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DATABASE.md
│
├── .env.example
├── .gitignore
├── .pre-commit-config.yaml
├── Makefile
└── README.md
```

You may adjust this structure when justified.

### Initialize frontend

- Initialize React with Vite.
- Configure TypeScript strict mode.
- Configure routing.
- Configure Tailwind.
- Configure ESLint and Prettier.
- Add Vitest and React Testing Library.
- Create a minimal application shell.

### Initialize backend

- Initialize FastAPI.
- Configure Python project dependencies.
- Configure Pydantic settings.
- Configure logging.
- Create a health endpoint.
- Configure Pytest and Ruff.
- Establish modular application structure.

### Configuration

Create `.env.example` with placeholders only.

Do not commit real secrets.

Provide sensible local development configuration.

Do not add Docker or Docker Compose.

### Initial documentation

Create:

- `README.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/USER_INPUT.md`
- `docs/ARCHITECTURE.md`

### Phase 1 verification

Verify:

- Frontend dependencies install.
- Frontend starts.
- Frontend production build succeeds.
- Backend dependencies install.
- FastAPI starts.
- Health endpoint responds.
- TypeScript checks pass.
- Frontend lint passes.
- Backend lint and formatting checks pass.
- No secrets are committed.

## Phase 1 approval gate

Present:

1. Repository structure.
2. Architecture decisions.
3. Important configuration files.
4. Frontend startup instructions.
5. Backend startup instructions.
6. Verification results.
7. Known issues.
8. Updated checklist.

Give me the exact commands to run locally.

Ask:

**"Have you verified Phase 1 and approved proceeding to Phase 2 — Backend API?"**

Stop and wait.

---

# PHASE 2 — BUILD FASTAPI BACKEND API

## Objective

Implement the complete backend API and business logic using mock repositories initially.

The backend must work without PostgreSQL.

Business services must be independent of the underlying persistence implementation.

## 2.1 Backend architecture

Separate responsibilities into:

- API routes.
- Request/response schemas.
- Business services.
- Repository interfaces.
- Mock repository implementations.
- AI provider interfaces.
- Mock AI provider.
- Authorization dependencies.
- Configuration.
- Shared utilities.

Do not place business logic inside route handlers.

Use FastAPI dependency injection.

Use Python type hints throughout.

Use Pydantic validation at API boundaries.

Avoid circular dependencies.

Keep modules focused.

## 2.2 Repository abstraction

Define repository contracts or protocols for:

- User repository.
- Batch repository.
- Inspection repository.
- Pending AI analysis repository, if required.

Implement in-memory/mock repositories.

Business services must depend on these contracts, not directly on SQLAlchemy.

Create a repository provider/factory that selects implementations through configuration.

Initial configuration:

`APP_MODE=mock`

The mock repositories must support the same business operations and return the same domain-level structures expected from future PostgreSQL repositories.

Do not silently fall back to mock mode if database mode is selected and the database is unavailable.

## 2.3 Required API endpoints

Use API versioning:

`/api/v1`

### Health

`GET /api/v1/health`

### Users

`GET /api/v1/users`

### Batches

`GET /api/v1/batches`

### AI prediction

`POST /api/v1/ai/predict`

### Inspections

`POST /api/v1/inspections`

`GET /api/v1/inspections`

`GET /api/v1/inspections/{inspection_id}`

### Dashboard

`GET /api/v1/dashboard/summary`

Use consistent request and response schemas.

Provide predictable error responses.

## 2.4 Inspection filters and pagination

Support:

- Defect category.
- Batch.
- Inspector.
- Date range.
- Pagination.
- Sorting.

Validate filter parameters.

Use stable ordering for pagination.

Return pagination metadata.

Do not load all records unnecessarily.

## 2.5 Authorization

Implement demo-user selection through a documented request mechanism.

Resolve the user and role from the backend repository.

Do not accept a browser-supplied role as authoritative.

Enforce:

- Quality Engineer can request AI predictions.
- Quality Engineer can submit inspections.
- Production Supervisor can read dashboard and history.
- Production Supervisor cannot request predictions.
- Production Supervisor cannot submit inspections.

Return HTTP 403 for forbidden operations.

Write tests for all these permissions.

## 2.6 AI provider abstraction

Implement:

- AI provider interface/protocol.
- Deterministic mock AI provider.
- Real vision-provider integration boundary.

The mock provider must produce predictable results for testing.

The real provider must be replaceable through configuration without changing API routes or business services.

The model request should include:

- Image.
- Product/batch context where available.
- Exact five-category taxonomy.
- Clear classification instructions.
- Structured response requirements.

Validate returned categories and confidence.

Handle:

- Invalid JSON.
- Missing response fields.
- Unknown defect category.
- Confidence outside accepted range.
- Provider timeout.
- Provider errors.
- Rate limiting where applicable.

Never convert AI failure into `No Defect`.

Do not expose API keys or internal model reasoning.

Do not claim that the mock provider is a real AI model.

## 2.7 Prediction lifecycle

Keep AI prediction separate from final inspection submission.

A successful prediction should create a server-controlled pending analysis record or equivalent identifier.

The submission endpoint must verify:

- The prediction exists.
- The prediction belongs to the relevant user/workflow.
- The analysis is valid.
- The image reference is valid.
- The selected batch exists.
- The final defect category is supported.

Do not trust arbitrary prediction or confidence values submitted by the browser.

Calculate `was_overridden` on the backend.

Persist both original and final classifications.

Prevent duplicate submissions where practical.

## 2.8 Image upload

Implement secure image upload handling.

Requirements:

- Supported image formats only.
- File size validation.
- MIME validation.
- Content validation where practical.
- Server-generated filenames.
- Safe local storage.
- Path traversal prevention.
- Safe image references.
- Useful validation errors.

Do not store binary images in PostgreSQL.

Do not trust the uploaded filename.

## 2.9 Backend testing

Create unit and integration tests for:

- Defect category validation.
- Confidence validation.
- Override calculation.
- Dashboard calculations.
- User authorization.
- Batch retrieval.
- Mock AI prediction.
- Invalid AI response.
- AI provider failure.
- Image validation.
- Inspection submission.
- Duplicate submission protection.
- Inspection filtering.
- Pagination.
- Empty dashboard.
- Supervisor forbidden actions.

Use isolated test repositories or test fixtures.

Do not depend on a paid AI API for automated tests.

## 2.10 Phase 2 verification

Run:

- Pytest.
- Ruff lint.
- Ruff format check.
- API smoke tests.
- Relevant static/type checks.

Document API examples in `docs/API.md`.

## Phase 2 approval gate

Present:

1. Backend architecture.
2. Repository contracts.
3. API endpoints.
4. Request/response examples.
5. Business rules.
6. Authorization implementation.
7. AI provider abstraction.
8. Image handling.
9. Test results.
10. Swagger UI and curl testing instructions.
11. Known limitations.
12. Updated checklist.

Give me exact manual verification commands.

Ask:

**"Have you verified Phase 2 and approved proceeding to Phase 3 — React application and backend integration?"**

Stop and wait.

---

# PHASE 3 — BUILD REACT APPLICATION AND INTEGRATE WITH BACKEND

## Objective

Build the complete frontend and connect it to the real FastAPI endpoints implemented in Phase 2.

Do not build a separate frontend-only mock application.

The frontend must communicate with the backend over HTTP.

The backend may use mock repositories, but the frontend must use actual API responses.

## 3.1 Frontend architecture

Use:

- React functional components.
- TypeScript strict mode.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- Tailwind CSS.
- Reusable UI components.
- Centralized API client.
- Typed API contracts.

Use feature-oriented folders.

Avoid:

- `any` types.
- Monolithic components.
- API requests inside presentation components.
- Duplicated server state.
- Unnecessary global state.
- Unnecessary `useEffect`.
- Array indexes as dynamic list keys.
- Suppressing lint or TypeScript errors.

Use meaningful component names and clear interfaces.

Keep UI components separate from business/API logic.

## 3.2 Centralized API integration

Create a centralized API client.

Requirements:

- Configurable backend base URL.
- Typed API methods.
- Centralized error handling.
- Predictable request/response types.
- Request cancellation where appropriate.
- TanStack Query integration.
- Stable query keys.
- Query invalidation after mutations.

Avoid scattering raw `fetch` calls across components.

Use backend OpenAPI schemas as the source of truth where practical.

Do not duplicate business logic in the frontend.

## 3.3 Dashboard screen

Display:

- Total inspections.
- Passed inspections.
- Rejected inspections.
- Defect rate.
- AI acceptance rate.
- Defect breakdown.
- Recent inspections.

All metrics must come from the dashboard API.

Use a suitable chart component for defect breakdown.

Include loading, empty, and error states.

## 3.4 Inspection history screen

Display:

- Thumbnail.
- Batch number.
- Product name.
- Final defect.
- Inspector.
- Timestamp.
- Accepted/overridden indicator.

Implement:

- Defect filter.
- Batch filter where practical.
- Pagination.
- Loading state.
- Empty state.
- Error state.

Use backend filtering and pagination.

## 3.5 New inspection screen

Only available to Quality Engineers.

Include:

- Batch selector.
- Product/batch context.
- Image upload.
- Image preview.
- AI analysis action.
- Prediction category.
- Confidence indicator.
- Accept prediction action.
- Override category selector.
- Optional comments.
- Final submission action.

Requirements:

- Prediction must be visible before submission.
- Submission must be disabled until required fields are available.
- Prevent duplicate submission.
- Show loading state during analysis.
- Show useful error messages.
- Allow retry where appropriate.
- Preserve the original prediction when the user overrides it.

## 3.6 Demo user selection

Provide a simple selector:

- Priya — Quality Engineer.
- Rahul — Production Supervisor.

Show the current demo role clearly.

The frontend may hide unavailable actions for the current role, but backend authorization remains mandatory.

## 3.7 UI quality and accessibility

Implement:

- Responsive desktop and mobile layouts.
- Accessible labels.
- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Clear validation messages.
- Sufficient contrast.
- Status communication beyond color alone.
- Consistent spacing and typography.
- Clear button labels.

Keep the UI professional and focused on the inspection workflow.

Do not overdesign.

## 3.8 Frontend testing

Test:

- Dashboard rendering.
- Inspection history.
- Defect filtering.
- Pagination.
- Role-specific UI.
- Image upload validation.
- Prediction display.
- Accept workflow.
- Override workflow.
- Submission success.
- Submission failure.
- Loading state.
- Empty state.
- Error state.

## 3.9 Phase 3 verification

Run:

- Frontend production build.
- TypeScript checks.
- ESLint.
- Prettier check.
- Vitest.
- API integration smoke tests.

Verify that the React application uses the FastAPI endpoints and does not rely on hardcoded business data.

## Phase 3 approval gate

Present:

1. Implemented screens.
2. Component structure.
3. API integration details.
4. User workflow.
5. Role-specific UI behavior.
6. Screenshots or visual previews where available.
7. Test results.
8. Commands to run frontend and backend.
9. Known issues.
10. Updated checklist.

Ask:

**"Have you verified Phase 3 and approved proceeding to Phase 4 — End-to-end mock flow verification?"**

Stop and wait.

---

# PHASE 4 — VERIFY THE COMPLETE APPLICATION WITH MOCK FLOW

## Objective

Prove that the application works end to end without PostgreSQL and without a real AI API key.

This phase is specifically for integrated application verification.

Use:

- React frontend.
- FastAPI backend.
- Mock repositories.
- Seeded mock users.
- Seeded mock batches.
- Seeded mock inspection records.
- Deterministic mock AI provider.

**Do not bypass the backend by creating frontend-only simulations.**

The frontend must communicate with FastAPI through HTTP.

## 4.1 Required scenario: Engineer accepts prediction

1. Start backend in mock mode.
2. Start frontend.
3. Select Priya as Quality Engineer.
4. Select a batch.
5. Upload a sample image.
6. Request AI analysis.
7. Receive deterministic mock prediction.
8. Display prediction and confidence.
9. Accept the prediction.
10. Submit the inspection.
11. Verify the response.
12. Verify the inspection appears in history.
13. Verify dashboard metrics update.

## 4.2 Required scenario: Engineer overrides prediction

1. Select Priya.
2. Upload another image.
3. Receive AI prediction.
4. Select a different final defect category.
5. Submit inspection.
6. Verify original AI prediction remains unchanged.
7. Verify final classification is human-selected.
8. Verify `was_overridden = true`.
9. Verify dashboard acceptance rate updates.
10. Verify defect breakdown updates.

## 4.3 Required scenario: No Defect

1. Receive a No Defect prediction.
2. Accept it.
3. Submit inspection.
4. Verify it is counted as Passed.
5. Verify it contributes to AI acceptance rate.

## 4.4 Required scenario: Production Supervisor

1. Select Rahul.
2. Open dashboard.
3. Open inspection history.
4. Verify read-only access.
5. Verify engineer-only actions are hidden.
6. Attempt engineer-only API operations directly.
7. Verify backend returns HTTP 403.

## 4.5 Required scenario: Error handling

Test:

- Unsupported image.
- Oversized image.
- Invalid file content.
- AI provider error.
- Missing batch.
- Invalid defect category.
- Invalid analysis identifier.
- Duplicate submission where applicable.
- Backend unavailable.

The application must display useful errors and must not silently create incorrect inspection records.

## 4.6 Verification evidence

Run the complete relevant test suites.

Perform browser-based manual verification where available.

Fix discovered issues.

Create a verification report at:

`docs/MOCK_FLOW_VERIFICATION.md`

Include:

- Scenario.
- Expected behavior.
- Actual behavior.
- Pass/fail.
- Evidence or test reference.
- Outstanding issue.

Do not mark the mock flow complete until all required scenarios pass.

## Phase 4 approval gate

Present:

1. Scenario-by-scenario pass/fail table.
2. Test command outputs.
3. Screenshots or evidence where available.
4. Bugs found and fixed.
5. Outstanding issues.
6. Exact manual verification instructions.
7. Updated checklist.

Ask me to run the application and manually verify the complete workflow.

**Wait for my explicit confirmation that the mock application works before starting Phase 5.**

---

# PHASE 5 — PLUGGABLE POSTGRESQL DATABASE INTEGRATION

## Objective

Introduce PostgreSQL as a persistent repository implementation without changing the business services, API contracts, or React application.

The existing mock mode must continue working.

## 5.1 Architecture principle

Both mock and PostgreSQL repositories must implement the same contracts.

Business services must not know whether the data is coming from mock storage or PostgreSQL.

Select the implementation using explicit configuration:

`APP_MODE=mock`

or:

`APP_MODE=database`

When database mode is selected, a database connection failure must produce a clear error.

Never silently fall back to mock data.

The frontend must not need to change when switching repository implementations.

## 5.2 Database design

Use PostgreSQL and SQLAlchemy 2.x.

Use Alembic for migrations.

Design tables for:

### Users

- ID.
- Name.
- Role.
- Created timestamp.

### Batches

- ID.
- Batch number.
- Product name.
- Production line.
- Created timestamp.

### Inspections

- ID.
- Batch reference.
- Inspector reference.
- Image reference.
- Original AI prediction.
- AI confidence.
- AI provider/model.
- Final human-confirmed defect.
- Override flag.
- Comments.
- Inspection timestamp.

Introduce a separate AI prediction/analysis table if it improves traceability and pending-analysis lifecycle management.

Document the design decision.

## 5.3 Database best practices

Use:

- UUID primary keys where appropriate.
- Foreign keys.
- Unique constraints.
- Check constraints.
- Appropriate indexes.
- Timezone-aware timestamps.
- UTC storage.
- Explicit transactions.
- Safe database session lifecycle.
- Appropriate relationships.
- Pagination.
- Efficient query patterns.

Avoid N+1 queries.

Use SQL aggregation for dashboard metrics.

Do not store image binaries in PostgreSQL.

Store image references only.

Do not put SQLAlchemy queries in API route handlers.

## 5.4 Migrations and scripts

Create:

- Alembic configuration.
- Initial migration.
- Database initialization instructions.
- Repeatable seed script.
- Explicit reset script.
- Database health check.

The seed script must be idempotent.

Running it repeatedly must not create duplicate demo users, batches, or inspection records.

The reset script must be explicitly documented as destructive.

Never execute destructive reset operations automatically.

## 5.5 Local PostgreSQL setup

Assume PostgreSQL is installed and running locally.

Document:

1. Creating the database.
2. Creating/configuring the database user.
3. Granting required permissions.
4. Configuring the connection string.
5. Running migrations.
6. Seeding demo data.
7. Starting the backend in database mode.
8. Verifying persistence.
9. Resetting demo data.

Use environment variables for database credentials.

Do not commit real credentials.

## 5.6 PostgreSQL repository implementation

Implement PostgreSQL versions of:

- User repository.
- Batch repository.
- Inspection repository.
- Pending AI analysis repository, if applicable.

Ensure they match the mock repository contracts.

Do not duplicate business logic.

Use dependency injection to select the correct repository implementation.

## 5.7 Database verification

Test:

- PostgreSQL connection.
- Initial migration.
- Repeatable seed execution.
- User retrieval.
- Batch retrieval.
- AI prediction lifecycle.
- Inspection creation.
- Inspection persistence after backend restart.
- Inspection filtering.
- Pagination.
- Dashboard aggregates.
- Authorization.
- Transaction rollback.
- Database failure behavior.

Run equivalent business-level tests against both repository implementations where practical.

## 5.8 Phase 5 verification

Confirm:

- Mock mode still works.
- PostgreSQL mode works.
- Switching modes requires configuration only.
- Business services are not database-specific.
- Frontend does not need modification.
- Inspection records persist across backend restarts.
- Migrations work.
- Seed scripts work.
- Tests pass.

## Phase 5 approval gate

Present:

1. Database architecture.
2. Repository abstraction.
3. Entity relationship overview.
4. Migration details.
5. Seed/reset instructions.
6. Local PostgreSQL setup.
7. Database test results.
8. Evidence of persistence after restart.
9. Mock mode regression results.
10. Updated checklist.

Ask me to verify PostgreSQL mode.

Do not declare final completion until I have confirmed the database implementation works.

---

# F — FORMAT AND COLLABORATION PROTOCOL

## 1. Approval gates are mandatory

Maintain these five phases in:

`docs/IMPLEMENTATION_PLAN.md`

| Phase | Description | Initial status |
|---|---|---|
| 1 | Project structure setup | NOT_STARTED |
| 2 | Build backend API | NOT_STARTED |
| 3 | Build React and integrate with backend | NOT_STARTED |
| 4 | Verify complete mock flow | NOT_STARTED |
| 5 | Pluggable PostgreSQL integration | NOT_STARTED |

Use these statuses:

- `NOT_STARTED`
- `IN_PROGRESS`
- `READY_FOR_REVIEW`
- `APPROVED`
- `BLOCKED`
- `REJECTED`
- `COMPLETED`

A phase must be `READY_FOR_REVIEW` before asking me to review it.

Only I can approve a phase.

Do not mark user approval or manual verification complete yourself.

Do not proceed to the next phase without explicit approval.

## 2. Maintain a detailed implementation checklist

Create and continuously update:

`docs/IMPLEMENTATION_PLAN.md`

Include:

- Overall progress.
- Current phase.
- Phase status.
- Task checklist.
- Dependencies.
- Verification evidence.
- Technical decisions.
- Open questions.
- User approval history.

Every task must contain:

- Task ID.
- Description.
- Status.
- Dependencies.
- Verification method.
- Actual verification result.
- Whether my input is required.

Example:

```markdown
## Phase 1 — Project Structure Setup

- [x] Inspect existing repository
- [x] Create frontend structure
- [x] Create backend structure
- [x] Configure dependencies
- [x] Configure linting and formatting
- [x] Configure environment files
- [x] Verify frontend build
- [x] Verify backend startup
- [ ] User manual verification
- [ ] User approval

Phase status: READY_FOR_REVIEW
```

Do not mark a task complete simply because files have been generated.

A task is complete only when its verification criteria pass.

## 3. Maintain user dependencies separately

Create:

`docs/USER_INPUT.md`

List only decisions or dependencies that genuinely require my input.

Potential examples:

- AI provider API key.
- AI provider/model selection, if not configured.
- External sample-image licensing decision.
- Any unresolved business-critical requirement.

For every dependency explain:

- What is required.
- Why it is required.
- Which phase depends on it.
- Whether it blocks current work.
- Exact action I need to take.

Continue independent work while waiting for external credentials.

If the AI API key is unavailable, continue using the mock AI provider.

Do not claim real AI integration has been verified until a real provider request has been tested successfully.

## 4. Required review report after each phase

At the end of every phase, provide:

### A. Phase summary

What was implemented.

### B. Files changed

Important files created or modified.

### C. Architecture decisions

Important decisions and reasons.

### D. Verification results

Commands executed and actual outcomes.

Do not report commands as passed if they were not executed.

### E. Manual verification instructions

Give me exact commands, URLs, and steps to verify the phase.

### F. Outstanding issues

List incomplete items and blockers.

### G. Updated checklist

Show task statuses and dependencies.

### H. Approval request

Ask one direct question:

"Have you verified this phase and approved proceeding to the next phase?"

Then stop.

## 5. Handling feedback and corrections

If I report an issue:

1. Understand the issue.
2. Reproduce it if possible.
3. Identify the root cause.
4. Fix it.
5. Add or update a regression test.
6. Re-run relevant checks.
7. Present the result.
8. Ask for approval again when appropriate.

Do not restart unaffected work.

Do not proceed to the next phase while the current phase remains rejected or unapproved.

## 6. Documentation requirements

Maintain documentation as the application evolves.

### Root README.md

Write it for a developer who has never seen the repository.

Include:

1. Project overview.
2. Business problem.
3. Key features.
4. User roles and permissions.
5. Inspection workflow.
6. Defect taxonomy.
7. Architecture overview.
8. Technology stack.
9. Monorepo structure.
10. Database design.
11. API endpoint summary.
12. AI provider architecture.
13. AI model/provider selection.
14. AI cost considerations.
15. Image storage strategy.
16. Mock mode.
17. PostgreSQL mode.
18. Environment variables.
19. Prerequisites.
20. Local installation.
21. Frontend startup.
22. Backend startup.
23. Database setup.
24. Alembic migrations.
25. Seed scripts.
26. Database reset procedure.
27. AI API key setup.
28. Test commands.
29. Lint and formatting commands.
30. Security/dependency scan commands.
31. Pre-commit installation and usage.
32. Architecture decisions and trade-offs.
33. Known limitations.
34. Future improvements.
35. Troubleshooting.

Provide two verified setup paths.

### Path A — Quick demo

- No PostgreSQL required.
- No real AI API key required.
- Mock repository.
- Deterministic mock AI.
- Real React frontend.
- Real FastAPI backend.
- Complete inspection workflow.
- Explain that mock changes are not permanently persisted.

### Path B — Persistent application

- Locally installed PostgreSQL.
- Database creation.
- Environment configuration.
- Alembic migrations.
- Seed scripts.
- Real AI provider configuration.
- Persistent inspections.
- Dashboard backed by PostgreSQL.

Only document commands that have actually been verified.

### Additional documentation

Create where appropriate:

- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/MOCK_FLOW_VERIFICATION.md`

Avoid duplicating the README unnecessarily.

---

# C — CONSTRAINTS AND ENGINEERING GUARDRAILS

## 1. React best practices

- Use TypeScript strict mode.
- Avoid `any`.
- Use functional components and hooks.
- Keep components focused.
- Use feature-oriented folder organization.
- Use TanStack Query for server state.
- Use React Hook Form for forms.
- Use Zod for frontend validation.
- Use a centralized API client.
- Avoid API calls in presentation components.
- Avoid unnecessary global state.
- Avoid duplicated server state.
- Avoid unnecessary `useEffect`.
- Use stable keys.
- Handle asynchronous loading and errors.
- Keep API contracts typed.
- Ensure responsive and accessible UI.
- Do not suppress lint or TypeScript errors without a justified reason.

## 2. FastAPI best practices

- Use Python type hints.
- Use Pydantic request/response schemas.
- Use dependency injection.
- Keep routes thin.
- Separate business services from repositories.
- Centralize error handling.
- Use appropriate HTTP status codes.
- Validate all external inputs.
- Do not expose internal stack traces.
- Use consistent API response contracts.
- Document endpoints through OpenAPI.
- Implement backend authorization.
- Avoid synchronous blocking operations inside async routes when they could block the event loop.
- Manage database sessions safely.

## 3. Database best practices

- Use SQLAlchemy 2.x.
- Use Alembic.
- Use explicit transactions.
- Use foreign keys.
- Add appropriate indexes.
- Use database constraints.
- Use UTC timestamps.
- Avoid N+1 queries.
- Use pagination.
- Use SQL aggregation for dashboard metrics.
- Store image references, not binary image data.
- Make seed scripts repeatable.
- Never run destructive database reset automatically.

## 4. AI best practices

- Keep API keys on the backend.
- Use a provider abstraction.
- Validate model responses.
- Restrict categories to the exact five values.
- Handle malformed responses.
- Handle timeouts and provider errors.
- Never silently classify failed predictions as No Defect.
- Never invent confidence scores.
- Never overwrite original AI prediction.
- Preserve model/provider metadata.
- Do not expose chain-of-thought.
- Document model limitations and cost considerations.
- Use a mock provider for deterministic tests.

## 5. Security

- Never commit `.env` files or credentials.
- Include `.env.example` with placeholders only.
- Enforce authorization on the backend.
- Do not trust browser-supplied roles.
- Do not trust client-supplied override flags.
- Do not trust client-supplied AI predictions.
- Validate uploaded files.
- Limit file size.
- Use safe generated filenames.
- Prevent path traversal.
- Use ORM parameterized queries.
- Avoid unsafe SQL interpolation.
- Configure CORS narrowly for local development.
- Do not expose sensitive provider errors.
- Document the limitations of demo-user selection.

## 6. Testing

### Backend

- Pytest.
- Business logic tests.
- API integration tests.
- Authorization tests.
- AI provider tests.
- File validation tests.
- Repository tests.
- Dashboard calculation tests.

### Frontend

- Vitest.
- React Testing Library.
- Component tests.
- User workflow tests.
- API integration behavior tests.

### End-to-end

Use a small Playwright suite if practical and if it can be implemented without expanding the assignment unnecessarily.

Do not make automated tests depend on paid AI calls.

Tests must be deterministic.

## 7. Pre-commit hooks

The assignment explicitly requires a pre-commit hook.

Configure it to run:

### Backend

- Ruff lint.
- Ruff formatting check.
- Pytest.
- Python dependency/security scan.

### Frontend

- ESLint.
- Prettier check.
- TypeScript type check.
- Vitest.

### Repository

- Secret scanning.
- Trailing whitespace checks.
- Basic configuration checks.

Use appropriate tooling such as:

- pre-commit.
- Ruff.
- pytest.
- pip-audit.
- ESLint.
- Prettier.
- TypeScript compiler.
- Vitest.
- npm audit or equivalent.
- detect-secrets or equivalent.

The hook must genuinely execute its advertised checks.

Do not create placeholder hooks.

Do not silently skip checks.

Keep pre-commit reasonably fast. If an expensive scan or full suite is unsuitable for every commit, document its separate verification command and do not falsely claim it runs in the hook.

Document installation and usage in the README.

## 8. Scope discipline

This is a focused 2–3 day take-home assignment.

Prioritize:

1. Correct business workflow.
2. Correct API behavior.
3. Human-in-the-loop AI inspection.
4. Server-side authorization.
5. Accurate inspection persistence.
6. Correct dashboard calculations.
7. Clean React integration.
8. Testability.
9. Documentation.
10. Developer quality checks.

Do not add features that are not requested.

Do not overengineer.

Do not add full authentication.

Do not build batch-management CRUD.

Do not train a custom AI model.

Do not introduce unnecessary infrastructure.

---

# DEFINITION OF DONE

The project is complete only when all five phases have been implemented, verified, and approved.

Final acceptance criteria:

- [ ] Monorepo structure is established.
- [ ] Frontend starts and builds.
- [ ] FastAPI backend starts.
- [ ] Backend APIs work.
- [ ] React integrates with FastAPI.
- [ ] Mock mode works without PostgreSQL.
- [ ] Mock mode works without a real AI API key.
- [ ] Quality Engineer can complete an inspection.
- [ ] AI prediction is displayed before submission.
- [ ] Engineer can accept or override prediction.
- [ ] Original AI prediction is preserved.
- [ ] Final classification is persisted in the selected repository.
- [ ] Override flag is calculated server-side.
- [ ] Supervisor has read-only access.
- [ ] Supervisor restrictions are enforced by the backend.
- [ ] Inspection history works.
- [ ] Defect filtering and pagination work.
- [ ] Dashboard metrics follow the exact formulas.
- [ ] Image validation and storage work.
- [ ] PostgreSQL mode works.
- [ ] Alembic migrations work.
- [ ] Seed scripts work repeatedly without duplicates.
- [ ] Data persists after backend restart in database mode.
- [ ] Mock mode still works after PostgreSQL integration.
- [ ] Backend tests pass.
- [ ] Frontend tests pass.
- [ ] TypeScript checks pass.
- [ ] Lint and formatting checks pass.
- [ ] Security/dependency scans have been run.
- [ ] Pre-commit hooks are configured and verified.
- [ ] README provides accurate setup instructions.
- [ ] No secrets are committed.
- [ ] Known limitations are documented.
- [ ] All five phases have explicit user approval.

---

# FINAL DELIVERY REPORT

At final delivery, provide:

1. Project summary.
2. Final architecture.
3. Repository structure.
4. Five-phase completion checklist.
5. User approval history.
6. Features implemented.
7. API endpoint summary.
8. Database design.
9. Mock mode setup.
10. PostgreSQL mode setup.
11. AI provider setup.
12. Commands to start frontend and backend.
13. Commands to run tests.
14. Commands to run lint and security checks.
15. Pre-commit installation instructions.
16. Actual test and scan results.
17. Remaining blockers or dependencies on me.
18. Known limitations.
19. Most important files to review.

Use this completion table:

| Area | Status | Verification |
|---|---|---|
| Project structure | | |
| Backend API | | |
| React frontend | | |
| API integration | | |
| Mock flow | | |
| PostgreSQL integration | | |
| AI provider | | |
| Role authorization | | |
| Dashboard | | |
| Tests | | |
| Security checks | | |
| Pre-commit hooks | | |
| README | | |

Do not claim completion for unverified items.

---

# STARTING INSTRUCTION

Start with Phase 1 only.

1. Inspect the existing repository.
2. Identify existing work and conventions.
3. Create `docs/IMPLEMENTATION_PLAN.md`.
4. Create `docs/USER_INPUT.md`.
5. Establish the monorepo structure.
6. Initialize frontend and backend foundations.
7. Create initial documentation.
8. Run Phase 1 verification.
9. Update the checklist with actual results.
10. Present the Phase 1 review report.
11. Ask me for explicit approval.

**Do not begin Phase 2 until I have reviewed and approved Phase 1.**