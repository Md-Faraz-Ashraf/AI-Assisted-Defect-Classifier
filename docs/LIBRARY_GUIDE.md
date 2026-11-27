# Frontend and Backend Library Guide

## Frontend

### Application libraries

| Library                    | Usage                                               |
| -------------------------- | --------------------------------------------------- |
| React                      | Builds the user interface.                          |
| React DOM                  | Renders React in the browser.                       |
| React Router               | Handles pages and navigation.                       |
| TanStack Query             | Fetches and caches backend data; manages mutations. |
| React Hook Form            | Manages form values and validation state.           |
| Zod                        | Defines and validates form data.                    |
| `@hookform/resolvers`      | Connects Zod validation to React Hook Form.         |
| Recharts                   | Renders the dashboard chart.                        |
| Radix UI                   | Provides accessible UI primitives and interactions. |
| `class-variance-authority` | Defines UI component style variants.                |
| `cn`                       | Combines CSS class names.                           |
| Lucide React               | Provides interface icons.                           |
| Sonner                     | Displays toast notifications.                       |
| Geist Variable             | Provides the application font.                      |
| `tw-animate-css`           | Provides CSS animation utilities.                   |

shadcn/ui is copied source code that we customize in the project; it is not a runtime package.

### Frontend development and test libraries

| Library                    | Usage                                                        |
| -------------------------- | ------------------------------------------------------------ |
| Vite                       | Runs the development server and builds the frontend.         |
| `@vitejs/plugin-react`     | Adds React support and Fast Refresh to Vite.                 |
| Tailwind CSS               | Provides utility classes and styling.                        |
| `@tailwindcss/vite`        | Integrates Tailwind CSS with Vite.                           |
| TypeScript                 | Adds static typing and type checks.                          |
| Vitest                     | Runs frontend tests.                                         |
| `jsdom`                    | Provides a browser-like environment for tests.               |
| Testing Library React      | Renders components and queries their UI in tests.            |
| Testing Library User Event | Simulates user interactions in tests.                        |
| Testing Library Jest DOM   | Adds DOM assertions for tests.                               |
| ESLint and plugins         | Lint JavaScript and TypeScript, including React Hooks rules. |
| Prettier                   | Formats frontend code and checks formatting.                 |
| React, DOM, and Node types | Provide TypeScript declarations.                             |

## Backend

### Application libraries

| Library             | Usage                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| FastAPI             | Defines HTTP routes, request handling, and API documentation.           |
| Uvicorn             | Runs the FastAPI application.                                           |
| Pydantic            | Defines and validates API data and AI output.                           |
| `pydantic-settings` | Loads application settings from environment variables and `.env`.       |
| `python-multipart`  | Parses uploaded image requests.                                         |
| Pillow              | Validates and reads uploaded image files.                               |
| SQLAlchemy          | Maps application models to database tables and queries.                 |
| Alembic             | Applies database schema migrations.                                     |
| Psycopg             | Connects SQLAlchemy to PostgreSQL.                                      |
| Google Gen AI SDK   | Calls the configured Gemini vision model.                               |
| AnyIO               | Runs blocking image and file operations outside async request handling. |
| HTTPX               | Handles HTTP timeout types and supports the API test client.            |

### Backend development and test libraries

| Library    | Usage                                                |
| ---------- | ---------------------------------------------------- |
| pytest     | Runs backend tests.                                  |
| Ruff       | Lints and formats Python code.                       |
| Mypy       | Checks Python types.                                 |
| pip-audit  | Scans Python dependencies for known vulnerabilities. |
| pre-commit | Installs and runs the quality gate before commits.   |
| Setuptools | Builds and installs the backend Python project.      |
