# User Input and External Dependencies

Only list decisions or credentials needed to unblock implementation. Nothing blocks mock backend development or the next frontend phase.

| Requirement | Why needed | Phase | Blocking now? | User action |
|---|---|---|---|---|
| AI provider/model and backend API key | Required to configure and test a real vision integration; Phase 2 currently provides a contract boundary and deterministic mock. | 3–4 | No for mock flow; yes for live-provider verification | Choose a provider/model and configure its key locally when real integration is scheduled. Do not send the key in chat or commit it. |
| Local PostgreSQL connection details | Needed to run persistent mode and verify migrations/persistence. | 5 | No | Install/run PostgreSQL locally and provide a local connection string through `.env`. |

No sample images are included. Later samples can be original illustrative assets to avoid external licensing dependencies.
