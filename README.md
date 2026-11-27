# AI-Assisted Defect Classifier

Web app and API for analyzing manufacturing inspection images and recording an inspector's review. The frontend calls the same API in both backend modes. The default AI provider is deterministic mock AI; connecting PostgreSQL does not enable a real vision model.

## Prerequisites

- Git
- Node.js 20 or newer and npm
- Python 3.11 or newer
- PostgreSQL only if using database mode

## 1. Clone the project

```powershell
git clone <repository-url>
cd "AI- Assisted Defect Classifier"
```

Replace `<repository-url>` with the repository URL. Run the commands below from the repository root unless a command says to change directories. Start the backend and frontend in separate terminals and keep both running.

## 2. Install dependencies

Run these commands once after cloning. Keep the backend virtual environment active for the commit-hook setup below:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
cd ..
cd frontend
npm ci
cd ..
```

On macOS/Linux, activate the environment with `source .venv/bin/activate` instead. If PowerShell prevents activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal and activate again.

## 3. Run with mock data (no PostgreSQL required)

Mock mode is the default. It uses in-memory users, batches, and inspection records. Changes are lost when the backend process stops. Images are saved locally.

### Terminal 1: backend

If `.env` is absent, the backend defaults to mock persistence and mock AI. If you want an explicit local configuration, copy the example environment file from the repository root:

```powershell
Copy-Item .env.example .env
```

If `.env` exists, ensure it has `APP_MODE=mock` and `AI_PROVIDER=mock`. In a backend terminal, activate the environment and start the API:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

On macOS/Linux, use `source .venv/bin/activate` instead.

### Terminal 2: frontend

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>). The frontend's default API URL is `http://127.0.0.1:8000/api/v1`. The API health check is <http://127.0.0.1:8000/api/v1/health>; interactive API docs are at <http://127.0.0.1:8000/docs>.

## 4. Install the commit checks

The Python `pre-commit` framework blocks commits unless frontend and backend tests, dependency audits, formatting, lint, and type checks pass. Dependency audits contact public vulnerability databases, so network outages or audit findings can block a commit.

Backend tests run with `APP_ENV=test`, `APP_MODE=mock`, and `AI_PROVIDER=mock`, so they do not depend on local `.env` credentials, database settings, or live AI calls.

Open another terminal, activate the backend virtual environment, return to the repository root, and install and verify the hook:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
cd ..
python -m pre_commit install
Test-Path .git/hooks/pre-commit
python -m pre_commit run --all-files
```

`Test-Path` should return `True`. Git runs the full gate before every commit. Reinstall it with `python -m pre_commit install` if the hook file is removed. Do not use `git commit --no-verify` if you need the checks enforced.

## 5. Run with PostgreSQL (persistent application data, optional)

Stop the mock backend before switching modes. In database mode, the backend requires a reachable PostgreSQL server and will fail to start if it cannot connect. The PostgreSQL database service must be running before migration, seeding, or starting the API. The default local connection uses host `localhost`, port `5432`, database `quality_inspection`, and role `quality_app`.

### 1. Start PostgreSQL and create the database and role

Install PostgreSQL if needed and start its service using your operating system's service manager. Connect to the local server as a PostgreSQL administrator (for example, with `psql -U postgres -h localhost -p 5432`) and create a role and database. Choose your own local password:

```sql
CREATE ROLE quality_app LOGIN PASSWORD 'choose-a-local-password';
CREATE DATABASE quality_inspection OWNER quality_app;
```

Run these statements only when the role/database do not already exist. If you use different names, host, or port, use those values in `DATABASE_URL` below.

### 2. Configure the backend

From the repository root, create the ignored local environment file and edit it:

```powershell
Copy-Item .env.example .env
```

Set at least these values in `.env`:

```dotenv
APP_MODE=database
DATABASE_URL=postgresql+psycopg://quality_app:YOUR_PASSWORD@localhost:5432/quality_inspection
AI_PROVIDER=mock
```

Replace `YOUR_PASSWORD` with the role password. URL-encode reserved characters in the password (for example, `@` becomes `%40`). Keep `.env` private; it is excluded by `.gitignore`. Do not put database credentials in frontend environment files.

### 3. Create tables and seed initial data

In a backend terminal, activate the environment and run the Alembic migrations and seed script. The migration creates the `users`, `batches`, and `inspections` application tables (plus Alembic's migration-version bookkeeping table). The seed adds/updates two demo users and three demo batches. It is safe to rerun and does not delete inspection data.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m alembic upgrade head
python -m scripts.seed
```

Alembic creates the tables; the seed command only populates the initial demo users and batches. Run both commands against the intended database after confirming `.env` is set to `APP_MODE=database` and the PostgreSQL service is running.

### 4. Start the API and frontend

Keep the backend terminal in `backend` and start the API:

```powershell
uvicorn app.main:app --reload
```

In a second terminal, from the repository root, start the frontend:

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173>. Confirm <http://127.0.0.1:8000/api/v1/health> reports `{"status":"ok"}`. The demo user and batch lists should include Priya, Rahul, and BATCH-001 through BATCH-003. Submitted inspections persist in PostgreSQL and remain available after restarting the backend.

### Reset database data (destructive)

This command deletes all inspection, batch, and user rows. It is not part of normal setup, migration, or seeding. Run only when you intend to clear that data, then reseed:

```powershell
cd backend
python -m scripts.reset_database --confirm RESET-QUALITY-INSPECTION-DATA
python -m scripts.seed
```

## 6. Use Gemini for image analysis (optional)

The backend can send uploaded images to Google's Gemini API. The configured model is `gemini-3.5-flash-lite`; the API key stays on the backend. Configure these values in the repository root `.env`:

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-3.5-flash-lite
AI_TIMEOUT_SECONDS=30
```

Restart the backend after changing `.env`. Keep `AI_PROVIDER=mock` to use deterministic mock predictions without an API key. Gemini is independent of `APP_MODE`, so it can be used with either in-memory or PostgreSQL persistence. The backend rejects unsupported categories, malformed output, and out-of-range confidence; provider failures do not silently become `No Defect`.

When Gemini is enabled, uploaded inspection images and associated batch/product context are sent to Google's Gemini API for analysis. Use images you are permitted to share with that service.

## Switching modes

Set `APP_MODE=mock` or `APP_MODE=database` in the repository root `.env`, then restart the backend. If `.env` is absent, backend defaults to mock mode. Both modes use the same API models and endpoints. Mock mode keeps application records in process memory; database mode stores them in PostgreSQL. Uploaded image files are stored locally in `backend/var/images` when using the commands above; this path is ignored by Git. Image files are not stored inside PostgreSQL.

## Configuration reference

| Variable                | Default                        | Purpose                                                                                 |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| `APP_MODE`              | `mock`                         | Backend persistence: `mock` or `database`.                                              |
| `DATABASE_URL`          | Local example URL              | PostgreSQL connection used by migrations, seed, and database mode.                      |
| `AI_PROVIDER`           | `mock`                         | AI adapter: `mock` or `gemini`.                                                         |
| `AI_API_KEY`            | unset                          | Gemini API key; required when `AI_PROVIDER=gemini`.                                     |
| `LLM_MODEL`             | `gemini-3.5-flash-lite`        | Gemini model identifier.                                                                |
| `AI_TIMEOUT_SECONDS`    | `30`                           | Maximum time allowed for a Gemini analysis request.                                     |
| `API_HOST` / `API_PORT` | `127.0.0.1` / `8000`           | Backend bind address and port.                                                          |
| `FRONTEND_ORIGIN`       | `http://localhost:5173`        | Allowed browser origin for API requests.                                                |
| `IMAGE_STORAGE_PATH`    | `./var/images`                 | Local image storage path, relative to backend working directory.                        |
| `VITE_API_BASE_URL`     | `http://127.0.0.1:8000/api/v1` | Optional frontend API base URL; set in `frontend/.env.local` if the API runs elsewhere. |

## Checks

Backend checks (from `backend`, with its virtual environment active):

```powershell
ruff check .
mypy app
pytest
```

Frontend checks (from `frontend`):

```powershell
npm run typecheck
npm run lint
npm test -- --run
npm run build
```
