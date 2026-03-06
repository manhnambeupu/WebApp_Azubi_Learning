# Copilot instructions for Azubi Webapp

## Source-of-truth documents
- `Azubi_BRD_v1.1.md` is the business source of truth.
- `azubi-project-plan.md` is the technical source of truth (architecture, module layout, API contracts, infra flow).
- `.antigravityrules` requires checking both docs before making changes and flagging conflicts first.

If a user request conflicts with BRD or project plan decisions, surface the conflict before implementation.

## Current repository state
- The repository currently contains planning documents; implementation folders in the project plan (`apps/frontend`, `apps/backend`) may not be scaffolded yet.
- When adding code, align with the planned modular monolith boundaries: `auth`, `users`, `categories`, `lessons`, `questions`, `submissions`, `files`, and shared `common`.

## Build, test, and lint commands (documented in `azubi-project-plan.md`)
Commands below are defined in CI and Docker plan sections and assume planned app folders exist.

### Backend
- Install dependencies: `cd apps/backend && npm ci`
- Run backend tests: `cd apps/backend && npm run test`
- Run backend e2e tests: `cd apps/backend && npm run test:e2e`
- Run a single backend test file (Jest): `cd apps/backend && npm run test -- <path-to-test-file>`
- Run a single backend e2e file (Jest): `cd apps/backend && npm run test:e2e -- <path-to-e2e-file>`

### Frontend
- Install dependencies: `cd apps/frontend && npm ci`
- Type-check frontend: `cd apps/frontend && npm run type-check`
- Lint frontend: `cd apps/frontend && npm run lint`

### Build / container workflow
- Build production images: `docker compose -f docker-compose.prod.yml build`
- Dev service commands used by Docker compose:
  - Backend: `npm run start:dev`
  - Frontend: `npm run dev`

## MCP server recommendation for this project
- For web UI validation and end-to-end browser flows, use a Playwright MCP server.
- Copilot CLI local config (`~/.copilot/mcp-config.json`) should include:
  ```json
  {
    "mcpServers": {
      "playwright": {
        "type": "local",
        "command": "npx",
        "tools": ["*"],
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
  ```
- Interactive setup alternative: run `/mcp add` and add the same server details.

## High-level architecture
- Target architecture is a **modular monolith**:
  - Frontend: Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query.
  - Backend: NestJS + Prisma + PostgreSQL + JWT auth/refresh flow + role guards.
  - File storage: MinIO (S3-compatible) for lesson images and lesson attachment files.
- API segmentation is role-based:
  - Auth routes: `/api/auth/*`
  - Admin routes: `/api/admin/*`
  - Student routes: `/api/student/*`
- Auth/session handling from plan:
  - Access token kept in frontend memory store (not localStorage).
  - Refresh token in HttpOnly cookie.
- Data model for attempts:
  - Each submit creates a new `lesson_attempt` with increasing `attempt_number`.
  - Per-question answers are stored in `submissions` linked by `attempt_id`.

## Key conventions and domain rules
- Completion status is computed from the **first attempt only** (`attempt_number = 1`) and does not reset on retakes.
- Student retakes are unlimited; latest attempt is for result display, not completion state.
- Do not return question/answer `explanation` fields before submit.
- Enforce question integrity: at least 2 answers and at least 1 correct answer.
- Student quiz mode is single-choice (one selected answer per question).
- Category deletion must be blocked when lessons still reference that category.
- Lesson deletion is cascading for related files/questions/answers/attempts/submissions.
- Student self-registration is out of scope; Admin creates Student accounts.
- Student lesson list is currently non-paginated by product decision.
- Upload constraints: `.docx` (max 20MB), lesson images `.jpg/.png` (max 5MB).

## Code style conventions from project plan
- Files/folders: kebab-case
- Components/classes: PascalCase
- Variables/functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- DB columns: snake_case

## Environment file handling
- Commit `.env.example` only.
- Never commit real `.env` values.
