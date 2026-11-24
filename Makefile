.PHONY: frontend-dev frontend-check backend-dev backend-check

frontend-dev:
	cd frontend && npm run dev

frontend-check:
	cd frontend && npm run typecheck && npm run lint && npm run test -- --run && npm run build

backend-dev:
	cd backend && uvicorn app.main:app --reload

backend-check:
	cd backend && ruff check . && ruff format --check . && pytest
