# Azubi Webapp — Codebase Map (Codegraph)

> **Purpose:** Single source of truth for AI agents. Auto-generated from source code audit 2026-06-05.
> Replace `Azubi_BRD_v1.1.md` and `azubi-project-plan.md` (both deprecated).
---
## * Agent Workflows
## 1.1 GitNexus-first Workflow (MANDATORY)
- Trước mọi tác vụ sửa code (không phải docs-only), Copilot **bắt buộc** chạy GitNexus theo thứ tự:
  1. `gitnexus_query({query: "<feature/bug target>"})`
  2. `gitnexus_context({name: "<primary symbol>"})`
  3. `gitnexus_impact({target: "<primary symbol>", direction: "upstream"})`
- Nếu MCP `gitnexus` chưa sẵn sàng hoặc index bị stale, **không được code ngay**. Phải khôi phục context trước:
  - `/mcp reload`
  - `/mcp show gitnexus`
  - `npx -y gitnexus@1.3.10 status`
  - `npx -y gitnexus@1.3.10 analyze --force` (nếu stale)
- Trước khi hoàn tất bất kỳ thay đổi code nào, bắt buộc chạy `gitnexus_detect_changes({scope: "all"})` và tóm tắt blast radius.
- Chỉ được bỏ qua workflow GitNexus ở trên với tác vụ **docs-only** hoặc task không đụng mã nguồn.
## 1.2 OpenSpace-first Memory Loop (MANDATORY)
- Trước mọi tác vụ non-doc, Copilot/Gemini/Antigravity/Claude phải gọi OpenSpace trước để tái sử dụng kinh nghiệm:
  - **AUTO-RUN mỗi lần chạy:** với mỗi user request không phải docs-only, tool call đầu tiên bắt buộc là `search_skills(query: "<task>", source: "all", auto_import: true)`.
  - Không được bắt đầu sửa code/chạy test trước bước `search_skills`.
  - Nếu task có nhiều bước hoặc có sửa code, bắt buộc chạy `execute_task(task: "<user request>", search_scope: "all")` ngay sau bước tìm skill phù hợp.
  - Chỉ được bỏ qua OpenSpace khi task docs-only và phải nêu rõ lý do bỏ qua trong phần trả lời.
  1. `search_skills(query: "<task>", source: "all", auto_import: true)`
  2. Với tác vụ nhiều bước, ưu tiên `execute_task(task: "<user request>", search_scope: "all")`
- Sau khi thực thi:
  - Nếu có `evolved_skills[].upload_ready=true`, phải quyết định `visibility` và gọi `upload_skill(skill_dir, visibility)`.
  - Nếu skill lỗi, gọi `fix_skill(skill_dir, direction)` rồi retry 1 lần.
- Bắt buộc dùng đúng binary MCP từ venv của project:
  - `.claude/skills/openspace/venv/bin/openspace-mcp`
- Để tránh lỗi GUI/X11 trên môi trường headless, đặt backend mặc định:
  - `OPENSPACE_BACKEND_SCOPE=shell,mcp,web,system`
## 1.3 Context7-first Dependency Intelligence (MANDATORY)
- Áp dụng cho mọi task non-doc liên quan thư viện/framework/API docs, setup/config, và nâng cấp version.
- Trước khi code, phải truy vấn Context7 theo thứ tự:
  1. `npx --yes ctx7 library "<library-name>" "<goal + current version/context>"`
  2. `npx --yes ctx7 docs "<library-id>" "<API/setup/migration question>"`
  3. Khi nâng cấp version, bắt buộc chạy `./scripts/context7-workflow.sh audit <library-id> <current-version> <target-version>`
- Chính sách chọn phiên bản: **latest compatible > latest available**.
  - Không nâng cấp major mới nhất chỉ vì "mới nhất".
  - Luôn kiểm tra breaking changes, peer dependency ranges, và runtime/engine constraints.
  - Nếu phát hiện xung đột, giữ/pin phiên bản tương thích và nêu rõ lý do trong phần summary.
- Nếu Context7 tạm thời không truy cập được:
  - Tạm dừng các thay đổi version có rủi ro.
  - Fallback sang docs/changelog chính thức + lockfile hiện tại.
  - Ghi rõ đã dùng fallback trong phản hồi.
## 1.4 Luôn chạy Caveman để tiết kiệm token 
- Respond terse like smart caveman. All technical substance stay. Only fluff die.
- Rules:
    Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
    Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
    Pattern: [thing] [action] [reason]. [next step].
    Not: "Sure! I'd be happy to help you with that."
    Yes: "Bug in auth middleware. Fix:"
- Switch level: /caveman lite|full|ultra|wenyan Stop: "stop caveman" or "normal mode"
- Auto-Clarity: drop caveman for security warnings, irreversible actions, user confused. Resume after.
- Boundaries: code/commits/PRs written normal.
### GitNexus (code intelligence)
Before modifying any symbol: `gitnexus_impact` → check blast radius → proceed if safe.
Before committing: `gitnexus_detect_changes` → verify scope.
### OpenSpace (skill memory)
Before non-doc tasks: `search_skills` → reuse prior experience.
After execution: upload evolved skills if `upload_ready=true`.
### Context7 (dependency intelligence)
Before using libraries: `ctx7 library` + `ctx7 docs` → verify API compatibility.
Version policy: latest compatible > latest available.

---

## 1. Project Identity

- **Domain:** azubivn.de — E-learning for Vietnamese Ausbildung workers in Germany
- **Phase 1 (current):** 100% FREE content, donations only (Buy Me A Coffee / Ko-fi). No paywall.
- **Phase 2 (future, ~3 years):** UG company formation → Premium subscriptions after co-founder gets Niederlassungserlaubnis
- **Legal:** German law (DSGVO/GDPR compliant). Impressum + Datenschutzerklärung required for .de domain.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Nginx (SSL/TLS)                    │
│           :80 → 301 :443 (production)                │
│    /api/* → backend:3001  |  /* → frontend:3000      │
└───────────────┬─────────────────────┬────────────────┘
                │                     │
    ┌───────────┴──────────┐  ┌──────┴───────────┐
    │   NestJS Backend     │  │  Next.js Frontend │
    │   apps/backend/      │  │  apps/frontend/   │
    │                      │  │                   │
    │  Prisma → PostgreSQL │  │  shadcn/ui+Radix  │
    │  MinIO  → S3 files   │  │  TanStack Query   │
    │  JWT    → Auth       │  │  Zustand (auth)   │
    │  Google GenAI → AI   │  │  Tailwind CSS 3   │
    │  Nodemailer → Email  │  │  Recharts         │
    │  @nestjs/schedule    │  │  react-hook-form  │
    └──────────────────────┘  └──────────────────┘
```

| Service | Dev URL | Purpose |
|---|---|---|
| Frontend | localhost:3000 | Next.js 15 App Router |
| Backend API | localhost:3001 | NestJS REST API |
| Swagger Docs | localhost:3001/api/docs | API docs (non-prod only) |
| PostgreSQL | localhost:5432 | Database |
| MinIO Console | localhost:9001 | File storage UI |

---

## 3. Tech Stack (Actual Versions)

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React 18 + TypeScript + Tailwind CSS 3 + shadcn/ui (Radix) |
| State | Zustand 5 (auth only) + TanStack Query 5 (server state) |
| Forms | react-hook-form 7 + zod 4 |
| Charts | Recharts 3 |
| DnD | @dnd-kit (drag-and-drop for question reordering) |
| Markdown | @uiw/react-md-editor + react-markdown + remark-gfm + rehype-highlight/sanitize |
| Backend | NestJS 11 + TypeScript + Prisma 5 ORM |
| AI | @google/genai (Gemini) — AI Tutor feature |
| Email | nodemailer 8 — Bulk email to students |
| Auth | passport-jwt + passport-google-oauth20 + passport-facebook |
| Security | helmet 8 + @nestjs/throttler 6 + bcrypt 6 (cost 12) |
| Image | sharp 0.34 (resize/strip EXIF/WebP) + browser-image-compression |
| Storage | MinIO 8 (S3-compatible) |
| Database | PostgreSQL 16 |
| DevOps | Docker Compose + Nginx reverse proxy + Cloudflare Tunnel |
| Scheduling | @nestjs/schedule 6 (cron cleanup jobs) |

---

## 4. Database Schema (12 models)

```
User (users)
├── id, email (unique), password?, fullName, role (ADMIN|STUDENT)
├── authProvider?, providerId?            ← OAuth (Google/Facebook)
├── refreshTokenHash?                     ← Server-side token revocation
├── failedLoginCount, lockedUntil?        ← Brute-force protection
├── @@unique([authProvider, providerId])
├── → LessonAttempt[], StudentLessonAccess[], ActivitySession[], AiChatHistory[]

Category (categories)
├── id, name (unique)
├── → Lesson[]

Lesson (lessons)
├── id, title, summary, contentMd, imageUrl?, isPrivate, categoryId (FK)
├── createdAt, updatedAt
├── → Category, LessonFile[], Question[], LessonAttempt[]
├── → StudentLessonAccess[], ActivitySession[], AiChatHistory[]

LessonFile (lesson_files)
├── id, lessonId (FK, cascade), fileName, fileUrl, uploadedAt

Question (questions)
├── id, lessonId (FK, cascade), text, explanation?, imageUrl?
├── isPrivate, type (QuestionType enum), orderIndex
├── → Answer[] (cascade), Submission[]

Answer (answers)
├── id, questionId (FK, cascade), text, isCorrect, explanation?
├── orderIndex?, matchText?               ← For ORDERING/MATCHING types

LessonAttempt (lesson_attempts)
├── id, userId (FK), lessonId (FK), attemptNumber, score?, correctCount?
├── @@unique([userId, lessonId, attemptNumber])

Submission (submissions)
├── id, attemptId (FK, cascade), questionId (FK), answerId (FK)
├── orderIndex?, matchText?, isCorrect

StudentLessonAccess (student_lesson_access)
├── id, userId (FK, cascade), lessonId (FK, cascade), grantedAt
├── @@unique([userId, lessonId])           ← Private lesson access control

ActivitySession (activity_sessions)
├── id, userId, lessonId, startedAt, endedAt?, lastHeartbeatAt
├── activeDurationSeconds, idleDurationSeconds, sessionType (LESSON_VIEW|QUIZ_ATTEMPT)

AiChatHistory (ai_chat_histories)
├── id, studentId, lessonId, role (USER|AI), content, createdAt
```

### Enums
```
Role: ADMIN | STUDENT
QuestionType: SINGLE_CHOICE | MULTIPLE_CHOICE | ESSAY | IMAGE_ESSAY | ORDERING | MATCHING
SessionType: LESSON_VIEW | QUIZ_ATTEMPT
ChatRole: USER | AI
```

---

## 5. Backend Modules (NestJS)

### Module Graph (`app.module.ts`)
```
AppModule
├── PrismaModule (global)
├── ThrottlerModule (100 req/60s global)
├── ScheduleModule (cron jobs)
├── AuthModule
├── ActivityModule
├── AnalyticsModule
├── CategoriesModule
├── EmailsModule
├── LessonsModule
├── QuestionsModule
├── SubmissionsModule
├── StudentLessonsModule
└── AiTutorModule
```

### Bootstrap Pipeline (`main.ts`)
```
cookieParser → helmet(CSP) → CORS(multi-origin) → globalPrefix('api')
→ HttpExceptionFilter → LoggingInterceptor → ValidationPipe(whitelist+transform)
→ Swagger (non-prod only) → listen(BACKEND_PORT)
```

---

## 6. API Routes — Complete Reference

### Auth (`/api/auth`) — AuthController
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public | Rate: 5/60s. Account lockout after 5 fails (15min) |
| POST | `/auth/logout` | Cookie | Revokes refreshTokenHash in DB |
| POST | `/auth/refresh` | Cookie | Token rotation (new refresh token each time) |
| GET | `/auth/me` | Bearer | Current user info |
| GET | `/auth/google` | Public | Google OAuth redirect |
| GET | `/auth/google/callback` | OAuth | → redirect to frontend `/auth/oauth-callback` |
| GET | `/auth/facebook` | Public | Facebook OAuth redirect |
| GET | `/auth/facebook/callback` | OAuth | → redirect to frontend `/auth/oauth-callback` |

### Admin — Categories (`/api/admin/categories`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Admin | List all (include lessonCount) |
| GET | `/:id` | Admin | Detail |
| POST | `/` | Admin | Create `{ name }` |
| PATCH | `/:id` | Admin | Update |
| DELETE | `/:id` | Admin | Blocked if has lessons (BR-06) |

### Admin — Lessons (`/api/admin/lessons`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?categoryId=` | Admin | List (optional filter) |
| GET | `/:id` | Admin | Detail + files + questions |
| POST | `/` | Admin | Create (multipart, optional image). Fields: `isPrivate` |
| PATCH | `/:id` | Admin | Update (multipart) |
| DELETE | `/:id` | Admin | Cascade delete |
| GET | `/:id/access` | Admin | List students with access to private lesson |
| POST | `/:id/access` | Admin | Grant access by email `{ email }` |
| DELETE | `/:id/access/:userId` | Admin | Revoke access |
| POST | `/:id/files` | Admin | Upload .docx/.pdf (max 20MB) |
| DELETE | `/:id/files/:fileId` | Admin | Delete file |
| GET | `/:id/files/:fileId/download` | Admin | Presigned download URL |
| POST | `/upload-markdown-image` | Admin | Upload image for MD content → returns dimensions+URL |

### Admin — Questions (`/api/admin/lessons/:lessonId/questions`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Admin | List + answers |
| GET | `/:id` | Admin | Detail |
| POST | `/` | Admin | Create + answers (min 2 answers, min 1 correct) |
| PATCH | `/:id` | Admin | Update, replace answers |
| DELETE | `/:id` | Admin | Cascade delete |
| PATCH | `/reorder` | Admin | `{ questionIds: string[] }` |

### Admin — Questions Image Upload (`/api/admin/questions`)
| POST | `/upload-image` | Admin | Upload question image (max 5MB) |

### Admin — Students (`/api/admin/students`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Admin | List all students |
| POST | `/` | Admin | Create `{ email, password, fullName }` |
| DELETE | `/:id` | Admin | Delete + cascade |

### Admin — Analytics (`/api/admin/analytics`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/overview` | Admin | Dashboard overview stats |
| GET | `/students` | Admin | Per-student analytics summary |
| GET | `/students/:id` | Admin | Detailed student analytics |
| DELETE | `/students/:id` | Admin | Delete student's activity sessions |

### Admin — Emails (`/api/admin/emails`)
| POST | `/send-bulk` | Admin | `{ subject, markdownContent, targetEmails: "ALL"|string[] }` → 202 Accepted |

### AI Tutor (`/api/ai-tutor`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/chat` | Student | Create chat message. Rate: 5/60s per user |
| GET | `/history/student/:lessonId` | Student | Personal chat history per lesson |
| DELETE | `/history/student/:lessonId` | Student | Clear own history |
| SSE | `/stream/:lessonId?chatId=&message=` | Student | Stream AI response via SSE. Rate limited |
| GET | `/history?studentName=&lessonTitle=&limit=` | Admin | Browse all chat histories |
| DELETE | `/history/:id` | Admin | Delete single history record |

### Student — Lessons (`/api/student/lessons`)
| GET | `/` | Student | List + `isCompleted` flag. Respects `isPrivate` + `StudentLessonAccess` |
| GET | `/:id` | Student | Detail (NO explanation/isCorrect before submission — BR-02) |
| GET | `/:id/files/:fileId/download` | Student | Presigned URL |

### Student — Quiz (`/api/student/lessons/:lessonId/attempts`)
| POST | `/` | Student | Submit quiz → returns full results + explanations |
| GET | `/` | Student | Attempt history (desc by attemptNumber) |
| GET | `/latest` | Student | Latest attempt detail |
| GET | `/:attemptId` | Student | Specific attempt detail |

### Student — Activity (`/api/student/analytics/session`)
| POST | `/` | Student | Start tracking session |
| POST | `/heartbeat` | Student | Heartbeat update |
| POST | `/end` | Student | End session |

### System
| GET | `/health` | Public | `{ status: 'ok', timestamp }` |

---

## 7. Frontend Structure

### Route Groups
```
app/
├── page.tsx                           ← Landing page (public)
├── layout.tsx                         ← Root layout (fonts, metadata, providers)
├── robots.ts, sitemap.ts              ← SEO
├── (auth)/
│   ├── login/                         ← Login page
│   └── auth/                          ← OAuth callback handler
├── (admin)/admin/
│   ├── dashboard/                     ← Lesson management table
│   ├── lessons/                       ← Create/Edit lessons
│   ├── categories/                    ← Category CRUD
│   ├── students/                      ← Student management
│   ├── analytics/                     ← Analytics dashboard (Recharts)
│   ├── ai-tutor/                      ← AI chat history management
│   └── emails/                        ← Bulk email sender
├── (student)/student/
│   └── lessons/                       ← Lesson list + [id] detail (quiz/history)
└── (legal)/
    ├── impressum/                     ← Legal: Impressum (German law)
    └── datenschutz/                   ← Legal: Privacy policy (DSGVO)
```

### Component Map
```
components/
├── admin/
│   ├── admin-sidebar.tsx              ← Navigation sidebar
│   ├── admin-lessons-table-fetcher.tsx ← Lessons table with filters
│   ├── create-student-dialog.tsx      ← Student creation modal
│   └── analytics/
│       ├── students-table.tsx         ← Analytics student list
│       └── student-detail-drawer.tsx  ← Per-student analytics drawer
├── student/
│   ├── student-nav.tsx                ← Top navigation bar
│   ├── student-footer.tsx             ← Footer with legal links
│   ├── lesson-card.tsx                ← Lesson grid card
│   ├── student-lessons-list-fetcher.tsx ← Lesson list with Suspense
│   ├── student-lesson-counter-badge.tsx
│   ├── quiz-form.tsx                  ← Quiz taking UI (32KB — all 6 question types)
│   ├── quiz-result.tsx                ← Quiz result display
│   ├── attempt-history.tsx            ← Past attempts list
│   ├── donation-banner.tsx            ← Donation CTA
│   └── lessons/
│       └── ai-chat-widget.tsx         ← AI tutor chat (SSE streaming)
├── auth/
│   ├── role-protected-layout.tsx      ← Role-based route guard
│   └── inactivity-provider.tsx        ← Auto-logout on inactivity
├── categories/
│   └── CategoryFormDialog (inline)
├── lessons/
│   ├── lesson-form.tsx                ← Create/Edit form (Markdown editor)
│   ├── lesson-files-manager.tsx       ← File upload/delete
│   ├── markdown-editor.tsx            ← MD editor with image upload
│   └── AccessManagementDialog.tsx     ← Private lesson access control
├── questions/
│   ├── question-form-dialog.tsx       ← Question CRUD (all 6 types, 34KB)
│   └── question-list.tsx              ← Draggable question list
├── seo/
│   └── json-ld.tsx                    ← Structured data (Schema.org)
├── providers/
│   └── QueryProvider                  ← TanStack Query provider
└── ui/                                ← 24 shadcn/ui components
```

### Hooks (React Query)
```
hooks/
├── use-categories.ts      → CRUD hooks for categories
├── use-lessons.ts         → CRUD + file upload + markdown image + access management
├── use-questions.ts       → CRUD + reorder + image upload
├── use-students.ts        → CRUD + password reset
├── use-student-lessons.ts → Student lesson list + detail
├── use-submissions.ts     → Submit quiz + attempt history + detail
├── use-activity-tracker.ts → Session start/heartbeat/end
├── use-ai-tutor.ts        → Chat + history + stream
├── use-emails.ts          → Bulk email send
└── use-toast.ts           → Toast notifications
```

### State & Data Flow
```
Auth: Zustand store (in-memory only, NO localStorage)
  → { user, accessToken, isAuthenticated, setAuth, clearAuth, setAccessToken }

API: Axios instance (lib/api.ts)
  → Request interceptor: attach Bearer token
  → Response interceptor: on 401 → refresh token → retry, else logout
  → Session role conflict detection (lib/auth-session.ts)

Server State: TanStack Query
  → Each mutation invalidates related query keys → auto-refresh UI
```

---

## 8. Business Rules

| Rule | Description | Enforced At |
|---|---|---|
| **BR-01** | `isCompleted` = has LessonAttempt with attemptNumber=1. Never resets on retakes. | student-lessons.service, submissions.service |
| **BR-02** | BEFORE submit: hide `explanation`, `isCorrect`. AFTER submit: show all. | student-lessons.service (sanitize), submissions.service (full) |
| **BR-03** | Each question ≥ 2 answers, ≥ 1 correct. | questions.service + QuestionFormDialog |
| **BR-05** | Single-choice = 1 answer per question (radio). Multiple-choice = partial scoring. | submissions.service + QuizForm |
| **BR-06** | Cannot delete category if lessons reference it. | categories.service |
| **BR-07** | Private lessons only visible to students with `StudentLessonAccess` grant. | student-lessons.service |
| **BR-08** | Partial scoring: MULTIPLE_CHOICE gives proportional credit but 0 if any wrong answer selected. | submissions.service |
| **BR-09** | ESSAY/IMAGE_ESSAY: no auto-scoring. Reference answer shown after submission. | submissions.service |

---

## 9. Security Posture

All 30 rules in `SECURITY_RULES.md`. Key implementations:

| Area | Implementation |
|---|---|
| Token storage | Access token in Zustand (memory). Refresh in HttpOnly cookie. |
| Token rotation | New refresh token on every `/auth/refresh`. Hash stored in DB. |
| Logout | Server-side revocation: `refreshTokenHash = null` |
| Brute-force | `failedLoginCount` + `lockedUntil` (15min after 5 fails) |
| Rate limiting | Global 100/60s + Auth 5/60s + AI Tutor 5/60s per user |
| CSP | helmet + nginx headers |
| Password | bcrypt cost 12 |
| Image upload | sharp: strip EXIF, resize ≤1280px, convert WebP q80 |
| File upload | Max 5MB images, 20MB docs. MIME validation. |
| Error handling | Generic messages in production, detailed logs server-side |
| OAuth | Google + Facebook via Passport strategies |

---

## 10. File Upload (MinIO)

| Bucket | Policy | Used For | Max Size |
|---|---|---|---|
| `lesson-images` | Public read | Lesson covers, question images, markdown images | 5MB |
| `lesson-files` | Private | .docx/.pdf attachments (presigned URL download) | 20MB |

Image pipeline: Frontend compress → Backend sharp(strip EXIF, resize, WebP) → MinIO

---

## 11. Docker & Deployment

```bash
# Dev
docker compose up  # postgres + minio + backend + frontend

# Production
docker compose -f docker-compose.prod.yml up -d
# Adds: nginx (SSL), healthchecks, service dependency chain
# postgres(healthy) → backend(healthy) → frontend → nginx
```

---

## 12. Environment Variables

See `.env` (dev) and `.env.production.example` (prod). Key vars:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- `MINIO_USER`, `MINIO_PASSWORD`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_PUBLIC_URL`
- `BACKEND_PORT`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
- `NODE_ENV` — controls Swagger visibility, error detail, cookie secure flag

---

## 13. Code Conventions

| Scope | Convention |
|---|---|
| Files/folders | kebab-case |
| Components/classes | PascalCase |
| Variables/functions | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| DB columns | snake_case (via Prisma `@map`) |
| Backend modules | `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts` |
| Frontend hooks | `use-{entity}.ts` with TanStack Query |
| Frontend types | `types/index.ts` (centralized) |
| Guards | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` at controller level |
| Validation | `class-validator` decorators + `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) |

---

## 14. Constraints — MUST NOT Violate

- ❌ Don't expose `explanation`/`isCorrect` in student lesson detail (BR-02)
- ❌ Don't delete categories with lessons (BR-06)
- ❌ Don't use localStorage for tokens (use Zustand in-memory)
- ❌ Don't enable Swagger in production
- ❌ Don't skip backend validation even if frontend validates
- ❌ Don't integrate payment gateways in Phase 1 (visa restriction)
- ❌ Don't create modules without importing into `app.module.ts`
- ❌ Don't use bcrypt cost < 12
- ❌ Don't return stack traces in production responses

---


### Security Checklist
Before generating code:
- [ ] Tokens NOT in localStorage?
- [ ] Backend validates all client input?
- [ ] Errors don't leak internals in production?
- [ ] Private files use presigned URLs?
- [ ] Password hash uses bcrypt cost ≥ 12?
- [ ] No payment integration in Phase 1?
