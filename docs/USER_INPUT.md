# User Input and External Dependencies

Only list decisions or credentials needed to unblock implementation. Nothing currently blocks Phase 1.

| Requirement | Why needed | Phase | Blocking now? | User action |
|---|---|---|---|---|
| AI provider/model and backend API key | Required only to exercise real vision analysis; the deterministic mock provider supports development without credentials. | 2–4 | No | Choose a provider/model and configure its key locally when requested. Do not send the key in chat or commit it. |
| Local PostgreSQL connection details | Needed to run persistent mode and verify migrations/persistence. | 5 | No | Install/run PostgreSQL locally and provide a local connection string through `.env`. |

No sample images are included in Phase 1. Later samples can be original illustrative assets to avoid external licensing dependencies.
