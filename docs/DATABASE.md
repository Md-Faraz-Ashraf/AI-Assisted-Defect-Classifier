# PostgreSQL database mode

The API supports two explicit modes:

- `APP_MODE=mock` (default): in-memory users, batches, pending analyses, and inspections. No PostgreSQL server is required.
- `APP_MODE=database`: SQLAlchemy 2.x repositories backed by PostgreSQL. Startup verifies the connection and fails clearly if it cannot connect; it never falls back to mock data.

The frontend and business service/API contracts are the same in both modes. Uploaded image bytes stay in local filesystem storage; PostgreSQL stores generated image references only.

## Schema

| Table | Columns | Purpose |
|---|---|---|
| `users` | `id`, `name`, `role`, `created_at` | Demo user identifiers, names, and constrained roles. |
| `batches` | `id`, `batch_number`, `product_name`, `production_line`, `created_at` | Batch/product/production-line context; batch number is unique. |
| `inspections` | `id`, `status`, `batch_id`, `inspector_id`, `image_ref`, `original_ai_prediction`, `ai_confidence`, `ai_provider`, `ai_model`, `analyzed_at`, `final_defect_type`, `was_overridden`, `comments`, `inspected_at` | One row per analyzed image; starts `UNREVIEWED`, then becomes `REVIEWED` when the inspector submits a decision. |
| `alembic_version` | `version_num` | Applied migration revision (Alembic bookkeeping, not an application table). |

The application schema has three tables: `users`, `batches`, and `inspections`. An inspection UUID is also the `analysis_id` returned by prediction, so submission updates the same row rather than creating another row. Status transitions once from `UNREVIEWED` to `REVIEWED`; while unreviewed, final category, override, comments, and inspection time are null. A reviewed row requires its final category and inspection time, and the database verifies `was_overridden`. Seeded user/batch IDs remain stable human-readable keys to preserve the API contract. Foreign keys, category/role/confidence checks, uniqueness for batch numbers, and query indexes enforce integrity. Inspection listing is filtered and paginated in SQL. Dashboard counts and accepted totals include only `REVIEWED` rows and use SQL aggregation.

## Local PostgreSQL setup (PowerShell)

Install and start PostgreSQL locally. In a `psql` session as a database administrator, create a dedicated role and database (choose a local password):

```sql
CREATE ROLE quality_app LOGIN PASSWORD 'choose-a-local-password';
CREATE DATABASE quality_inspection OWNER quality_app;
```

Copy the root `.env.example` to `.env` and set:

```dotenv
APP_MODE=database
DATABASE_URL=postgresql+psycopg://quality_app:YOUR_PASSWORD@localhost:5432/quality_inspection
```

URL-encode special characters in the password. Keep `.env` local and never commit credentials. Install backend dependencies and run migrations/seed from `backend`:

```powershell
python -m pip install -e ".[dev]"
python -m alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

Verify `http://127.0.0.1:8000/api/v1/health` returns `{"status":"ok"}` and the user/batch endpoints return Priya, Rahul, and the three seeded batches. Complete an inspection, restart the backend, and confirm it remains in history and dashboard totals. The seed command uses database merges and can be rerun without duplicating or deleting users, batches, or inspections.

## Explicitly destructive reset

The reset deletes all inspection, batch, and user rows. It does not run during startup or migration. Only run it deliberately, then reseed:

```powershell
python -m scripts.reset_database --confirm RESET-QUALITY-INSPECTION-DATA
python -m scripts.seed
```

## Mock mode regression

Leave `APP_MODE=mock` or unset it to run without PostgreSQL. Mock records are process-local and are lost on backend restart. The same deterministic AI provider and local image storage configuration are used independently of repository mode.

## Verification record

On 2026-11-25, the configured local PostgreSQL connection succeeded. Alembic applied revision `20261124_01`; the seed added 2 users and 3 batches. The user verified the database-mode workflow end to end. PostgreSQL contains 4 reviewed inspections; a newly constructed backend app instance returned all 4 through history and dashboard APIs. Phase 5 was approved by the user.
