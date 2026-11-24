# Architecture

## Current foundation

This is a single repository with independently runnable frontend and backend applications. The React + TypeScript client is served by Vite. FastAPI exposes a versioned `/api/v1` health route. Each application owns its dependency configuration and checks.

## Planned application architecture

The backend will separate API routes, schemas, services, repository contracts/implementations, AI provider contracts, and configuration. Mock repositories and a deterministic AI provider will support the quick demo. PostgreSQL repositories will later implement the same contracts, with SQLAlchemy 2.x and Alembic. The React client will communicate through a centralized API client and typed feature modules.

## Trust and workflow boundaries

The intended workflow preserves an AI analysis separately from final human submission. Server-side user lookup determines role; the browser cannot grant itself a role or fabricate model output. Image files will use generated safe names behind a storage abstraction. These behaviors are planned and are not implemented in Phase 1.

## Current assumptions and limitations

- Local development only; no deployment or container infrastructure.
- Demo-user selection is not production authentication.
- Phase 1 includes no business API beyond health, no database integration, and no real AI provider.
- PostgreSQL is the planned persistent store; mock mode is the planned no-setup path.
