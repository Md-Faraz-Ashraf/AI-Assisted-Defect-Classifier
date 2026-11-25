# User Input and External Dependencies

Only list decisions or credentials needed to unblock implementation. Nothing blocks mock backend development or the next frontend phase.

| Requirement | Why needed | Phase | Blocking now? | User action |
|---|---|---|---|---|
| Gemini provider/model and backend API key | Needed for live vision analysis. | 6 | No for mock or PostgreSQL work; configured by owner for live API verification | Owner selected `gemini-3.5-flash-lite` and configured the local `.env` / `.env.example`. Keep the key in the ignored `.env`; never share or commit it. |
| Local PostgreSQL connection details | Needed to run persistent mode. | 5 | No | Configured by the owner in the ignored root `.env` on 2026-11-25; do not commit or share the password. |

No sample images are included. Later samples can be original illustrative assets to avoid external licensing dependencies.
