# User Input and External Dependencies

Only list decisions or credentials needed to unblock implementation. Nothing blocks mock backend development or the next frontend phase.

| Requirement | Why needed | Phase | Blocking now? | User action |
|---|---|---|---|---|
| AI provider/model and backend API key | Required to implement and test a real vision adapter; Phase 2 currently provides only a contract boundary and deterministic mock. | Proposed Phase 6 (after Phase 5; plan amendment pending) | No for mock or PostgreSQL work; yes for real-provider implementation and verification | Approve the proposed phase, choose a provider/model, and configure its key locally. Do not send the key in chat or commit it. |
| Local PostgreSQL connection details | Needed to run persistent mode. | 5 | No | Configured by the owner in the ignored root `.env` on 2026-11-25; do not commit or share the password. |

No sample images are included. Later samples can be original illustrative assets to avoid external licensing dependencies.
