# Copilot Instructions — Azubi Webapp

> **Mục đích:** File này cung cấp toàn bộ context về project để Copilot hiểu mà KHÔNG cần đọc lại từng dòng code.
> Cập nhật lần cuối: Phase 5 hoàn thành (19 prompts).

---

## 1. Source-of-Truth Documents

- `Azubi_BRD_v1.1.md` — Business Requirements Document (yêu cầu nghiệp vụ từ BA)
- `azubi-project-plan.md` — Technical Design & Architecture (kế hoạch triển khai từ SE)
- `.antigravityrules` — Quy tắc buộc đối chiếu BRD + Project Plan trước khi thay đổi

**Quy tắc:** Nếu yêu cầu mâu thuẫn với BRD hoặc Project Plan → cảnh báo trước khi implement.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Nginx (SSL)                      │
│              :80 → redirect :443                     │
│      /api/* → backend:3001  |  /* → frontend:3000    │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
    ┌──────────┴──────────┐  ┌───────┴──────────┐
    │   NestJS Backend    │  │  Next.js Frontend │
    │   (apps/backend)    │  │  (apps/frontend)  │
    │                     │  │                   │
    │  Prisma → PostgreSQL│  │  shadcn/ui        │
    │  MinIO  → S3 files  │  │  TanStack Query   │
    │  JWT    → Auth      │  │  Zustand (auth)   │
    └─────────────────────┘  └───────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + shadcn/ui + Zustand + TanStack Query |
| Backend | NestJS + TypeScript + Prisma ORM |
| Database | PostgreSQL 16 |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (access in memory) + Refresh Token (HttpOnly cookie) |
| API Docs | Swagger/OpenAPI at `/api/docs` (non-production only) |
| DevOps | Docker Compose + Nginx reverse proxy + SSL |

---

## 3. Project Structure

```
Azubi_Webapp/
├── apps/
│   ├── backend/                  # NestJS API server
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 7 models (see §4)
│   │   │   └── seed.ts           # Admin seeder
│   │   └── src/
│   │       ├── main.ts           # Bootstrap: helmet, CORS, Swagger, throttler
│   │       ├── app.module.ts     # Root module: imports all feature modules + ThrottlerModule
│   │       ├── app.controller.ts # GET /api/health
│   │       ├── auth/             # Login, logout, refresh, me
│   │       ├── users/            # Admin CRUD students
│   │       ├── categories/       # Admin CRUD categories
│   │       ├── lessons/          # Admin CRUD lessons + file upload
│   │       ├── questions/        # Admin CRUD questions+answers (nested under lessons)
│   │       ├── student-lessons/  # Student: lesson list, detail, file download
│   │       ├── submissions/      # Student: quiz submit, attempt history
│   │       ├── files/            # MinIO service wrapper
│   │       ├── prisma/           # PrismaService (global module)
│   │       └── common/
│   │           ├── decorators/   # @CurrentUser(), @Roles()
│   │           ├── guards/       # JwtAuthGuard, RolesGuard
│   │           ├── filters/      # HttpExceptionFilter (Prisma errors + 5xx logging)
│   │           └── interceptors/ # LoggingInterceptor (dev only)
│   │
│   └── frontend/                 # Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/login/     # Login page
│       │   ├── (admin)/admin/    # Admin pages (RoleProtectedLayout ADMIN)
│       │   │   ├── dashboard/    # Lesson list (admin) → redirect target after login
│       │   │   ├── lessons/      # New + [id]/edit lesson pages
│       │   │   ├── categories/   # Category management
│       │   │   └── students/     # Student management
│       │   └── (student)/student/# Student pages (RoleProtectedLayout STUDENT)
│       │       └── lessons/      # Lesson list + [id] detail (quiz + history)
│       ├── components/
│       │   ├── admin/            # AdminSidebar, CreateStudentDialog
│       │   ├── student/          # StudentNav, LessonCard, QuizForm, QuizResult, AttemptHistory
│       │   ├── auth/             # RoleProtectedLayout
│       │   ├── categories/       # CategoryFormDialog
│       │   ├── lessons/          # LessonForm, LessonFilesManager, MarkdownEditor
│       │   ├── questions/        # QuestionList, QuestionFormDialog
│       │   ├── providers/        # QueryProvider (TanStack Query)
│       │   └── ui/               # shadcn components
│       ├── hooks/                # Custom React Query hooks
│       │   ├── use-categories.ts
│       │   ├── use-lessons.ts
│       │   ├── use-questions.ts
│       │   ├── use-student-lessons.ts
│       │   ├── use-submissions.ts
│       │   ├── use-students.ts
│       │   └── use-toast.ts
│       ├── stores/auth-store.ts  # Zustand store (user, accessToken, actions)
│       ├── lib/
│       │   ├── api.ts            # Axios instance with interceptors + token refresh
│       │   ├── api-error.ts      # Error message extractor
│       │   ├── auth.ts           # useAuth hook (login, logout, checkAuth)
│       │   └── utils.ts          # cn() helper
│       └── types/index.ts        # All frontend TypeScript types
│
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf            # Production: TLS 1.2/1.3, security headers, gzip, websocket
│   │   ├── generate-ssl.sh       # Self-signed cert generator
│   │   └── ssl/                  # .pem files (gitignored)
│   └── postgres/init.sql         # uuid-ossp extension
│
├── docker-compose.yml            # Dev: postgres + minio + backend + frontend
├── docker-compose.prod.yml       # Prod: + nginx + healthchecks + service_healthy deps
├── .env.example                  # Dev env template
├── .env.production.example       # Prod env template
└── .github/workflows/ci.yml      # CI: backend test + frontend build + deploy
```

---

## 4. Database Schema (Prisma)

7 models, all UUIDs, snake_case DB columns:

```
User (users)
├── id, email (unique), password (bcrypt), fullName, role (ADMIN|STUDENT), createdAt
└── → LessonAttempt[]

Category (categories)
├── id, name (unique)
└── → Lesson[]

Lesson (lessons)
├── id, title, summary, contentMd, imageUrl?, categoryId (FK), createdAt, updatedAt
├── → Category
├── → LessonFile[] (onDelete: Cascade)
├── → Question[] (onDelete: Cascade)
└── → LessonAttempt[]

LessonFile (lesson_files)
├── id, lessonId (FK, cascade), fileName, fileUrl, uploadedAt
└── → Lesson

Question (questions)
├── id, lessonId (FK, cascade), text, explanation?, orderIndex
├── → Answer[] (onDelete: Cascade)
└── → Submission[]

Answer (answers)
├── id, questionId (FK, cascade), text, isCorrect, explanation?
└── → Submission[]

LessonAttempt (lesson_attempts)
├── id, userId (FK), lessonId (FK), attemptNumber, score?, correctCount?, submittedAt
├── @@unique([userId, lessonId, attemptNumber])
└── → Submission[] (onDelete: Cascade)

Submission (submissions)
├── id, attemptId (FK, cascade), questionId (FK), answerId (FK), isCorrect
```

---

## 5. API Routes — Complete Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login → accessToken + refreshToken cookie. Rate limited: 5/60s |
| POST | `/auth/logout` | Public | Clear refreshToken cookie |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| GET | `/auth/me` | Bearer | Get current user info |

### Admin — Categories (`/api/admin/categories`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/categories` | Admin | List all categories (include lessonCount) |
| GET | `/admin/categories/:id` | Admin | Get category by ID |
| POST | `/admin/categories` | Admin | Create category `{ name }` |
| PATCH | `/admin/categories/:id` | Admin | Update category `{ name }` |
| DELETE | `/admin/categories/:id` | Admin | Delete (blocked if has lessons — BR-06) |

### Admin — Lessons (`/api/admin/lessons`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/lessons?categoryId=` | Admin | List lessons (optional filter) |
| GET | `/admin/lessons/:id` | Admin | Lesson detail + files + questions |
| POST | `/admin/lessons` | Admin | Create lesson (multipart, optional image) |
| PATCH | `/admin/lessons/:id` | Admin | Update lesson (multipart, optional image) |
| DELETE | `/admin/lessons/:id` | Admin | Delete cascade |
| POST | `/admin/lessons/:id/files` | Admin | Upload .docx file |
| DELETE | `/admin/lessons/:id/files/:fileId` | Admin | Delete file |
| GET | `/admin/lessons/:id/files/:fileId/download` | Admin | Signed download URL |

### Admin — Questions (`/api/admin/lessons/:lessonId/questions`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:lessonId/questions` | Admin | List questions + answers |
| POST | `/:lessonId/questions` | Admin | Create question + answers (BR-03: min 2 answers, min 1 correct) |
| PATCH | `/:lessonId/questions/:id` | Admin | Update question, replace answers |
| DELETE | `/:lessonId/questions/:id` | Admin | Delete question cascade |
| PATCH | `/:lessonId/questions/reorder` | Admin | Reorder `{ questionIds: string[] }` |

### Admin — Students (`/api/admin/students`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/students` | Admin | List all students |
| POST | `/admin/students` | Admin | Create `{ email, password, fullName }` |
| DELETE | `/admin/students/:id` | Admin | Delete student + cascade attempts |

### Student — Lessons (`/api/student/lessons`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/student/lessons` | Student | Lesson list + `isCompleted` (BR-01) |
| GET | `/student/lessons/:id` | Student | Detail: content, files, questions (NO explanation/isCorrect — BR-02) |
| GET | `/student/lessons/:id/files/:fileId/download` | Student | Signed download URL |

### Student — Quiz (`/api/student/lessons/:lessonId/attempts`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/:lessonId/attempts` | Student | Submit quiz → returns result + explanations (BR-02) |
| GET | `/:lessonId/attempts` | Student | Attempt history (ordered by attemptNumber desc) |
| GET | `/:lessonId/attempts/latest` | Student | Latest attempt detail |
| GET | `/:lessonId/attempts/:attemptId` | Student | Specific attempt detail |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Health check → `{ status: 'ok', timestamp }` |

---

## 6. Business Rules — Quan trọng

| Rule | Mô tả | Nơi áp dụng |
|---|---|---|
| **BR-01** | `isCompleted` = có LessonAttempt với `attemptNumber = 1`. Không thay đổi dù làm lại. | `student-lessons.service`, `submissions.service` |
| **BR-02** | TRƯỚC nộp bài: KHÔNG trả `explanation`, `isCorrect` cho student. SAU nộp: trả đầy đủ. | `student-lessons.service` (sanitize), `submissions.service` (full response) |
| **BR-03** | Mỗi question phải có ≥ 2 answers và ≥ 1 correct answer. | `questions.service` (backend validate), `QuestionFormDialog` (frontend validate) |
| **BR-05** | Single-choice quiz — mỗi câu chỉ chọn 1 answer (radio button). | `submissions.service` (validate), `QuizForm` (RadioGroup) |
| **BR-06** | Không cho delete category nếu còn lessons reference. | `categories.service` |

---

## 7. Security & Middleware (Phase 5)

### main.ts Pipeline
```
cookieParser → helmet → CORS (CORS_ORIGIN env) → globalPrefix('api')
→ HttpExceptionFilter → LoggingInterceptor → ValidationPipe
→ Swagger (non-prod only) → listen(BACKEND_PORT)
```

### Global Guards (via app.module APP_GUARD)
- `ThrottlerGuard` — 100 req/60s global
- Auth route `@Throttle({ default: { limit: 5, ttl: 60000 } })` — chống brute-force

### HttpExceptionFilter
- Prisma P2002 → 409 "Dữ liệu đã tồn tại."
- Prisma P2025 → 404 "Không tìm thấy dữ liệu."
- Prisma P2003 → 409 "Dữ liệu liên quan không tồn tại."
- 5xx → `console.error(exception)` (only server errors)

### Auth Flow
```
Login → access token (in-memory Zustand) + refresh token (HttpOnly cookie, path=/api/auth)
→ API requests: Bearer token in Authorization header
→ Token expired? → Axios interceptor auto-calls /auth/refresh → retry original request
→ Refresh failed? → Logout + redirect to /login
```

---

## 8. Frontend State & Data Flow

### Auth State (`stores/auth-store.ts`)
```ts
{ user: User | null, accessToken: string | null, isAuthenticated: boolean }
// Actions: setAuth(user, token), clearAuth(), setToken(token)
```

### API Layer (`lib/api.ts`)
- Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL`
- Request interceptor: attach `Authorization: Bearer <token>`
- Response interceptor: on 401 → try refresh → retry, else logout

### React Query Hooks Pattern
```
hooks/use-categories.ts  → useGetCategories(), useCreateCategory(), useUpdateCategory(), useDeleteCategory()
hooks/use-lessons.ts     → useGetLessons(), useGetLessonDetail(), useCreateLesson(), useUpdateLesson(), useDeleteLesson()
hooks/use-questions.ts   → useGetQuestions(), useCreateQuestion(), useUpdateQuestion(), useDeleteQuestion(), useReorderQuestions()
hooks/use-students.ts    → useGetStudents(), useCreateStudent(), useDeleteStudent()
hooks/use-student-lessons.ts → useGetStudentLessons(), useGetStudentLessonDetail()
hooks/use-submissions.ts → useSubmitQuiz(), useGetAttemptHistory(), useGetAttemptDetail(), useGetLatestAttempt()
```
Mỗi mutation hook invalidates related query keys để auto-refresh UI.

### Frontend Types (`types/index.ts`)
- **Admin types:** `Category`, `LessonListItem`, `LessonDetail`, `QuestionDetail`, `AnswerDetail`, `Student`
- **Student types:** `StudentLessonListItem`, `StudentLessonDetail`, `StudentQuestion`, `StudentAnswer` (NO isCorrect/explanation — BR-02)
- **Quiz types:** `SubmitQuizPayload`, `QuizResult`, `QuizResultQuestion`, `QuizResultAnswer`, `AttemptHistoryItem`

---

## 9. File Upload (MinIO)

### MinIO Buckets
| Bucket | Policy | Used for |
|---|---|---|
| `lesson-images` | Public read | Lesson cover images (jpg/png, max 5MB) |
| `lesson-files` | Private | Lesson attachments (.docx only, max 20MB, signed URL download) |

### MinioService Methods
```ts
uploadFile(bucket, objectName, buffer, mimetype)  → URL
deleteFile(bucket, objectName)
getPresignedUrl(bucket, objectName, expiry=3600)   → signed URL (private files)
getPublicUrl(bucket, objectName)                    → direct URL (public bucket)
```

---

## 10. Docker & Deployment

### Dev
```bash
docker compose up              # postgres + minio + backend + frontend
# backend: http://localhost:3001, frontend: http://localhost:3000
# MinIO console: http://localhost:9001
```

### Production
```bash
./docker/nginx/generate-ssl.sh  # Generate self-signed SSL certs
cp .env.production.example .env # Configure production env
docker compose -f docker-compose.prod.yml up -d
# All traffic through Nginx: :80 → :443 → SSL
# /api/* → backend, /* → frontend
```

### Nginx Features (Production)
- TLS 1.2/1.3, ssl_prefer_server_ciphers
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- Gzip compression
- WebSocket proxy support
- 20MB client upload limit

### Health Checks
- Postgres: `pg_isready`
- Backend: `GET /api/health` → `{ status: 'ok' }`
- Dependency chain: postgres(healthy) → backend(healthy) → frontend

---

## 11. Testing

### Coverage (as of Phase 5)
| Metric | Value |
|---|---|
| Statements | 93.04% |
| Branches | 71.68% |
| Functions | 96.57% |
| Lines | 92.46% |

### Test Files
Every service and controller has `.spec.ts` files. Common utilities (filter, guard, interceptor) also tested.

### Coverage Exclusions (jest config in `package.json`)
```
coveragePathIgnorePatterns: [".module.ts", "main.ts", ".dto.ts", "prisma.service.ts"]
```

### Commands
```bash
cd apps/backend
npm run test          # Run all tests
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests

cd apps/frontend
npm run type-check    # TypeScript check
npm run lint          # ESLint
npm run build         # Production build
```

---

## 12. Environment Variables

### Required (.env.example)
```env
DB_USER=azubi_user
DB_PASSWORD=azubi_pass
DB_NAME=azubi_db
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
MINIO_USER=minio_user
MINIO_PASSWORD=minio_password
MINIO_ENDPOINT=localhost      # 'minio' inside Docker
MINIO_PORT=9000
BACKEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
CORS_ORIGIN=http://localhost:3000
```

### Production additions (.env.production.example)
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=/api       # Through Nginx proxy
```

---

## 13. Code Style Conventions

| Scope | Convention |
|---|---|
| Files/folders | kebab-case |
| Components/classes | PascalCase |
| Variables/functions | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| DB columns | snake_case (via Prisma `@map`) |
| Backend modules | Feature-based: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts` |
| Frontend hooks | `use-{entity}.ts` with React Query |
| Frontend types | Centralized in `types/index.ts` |

---

## 14. Key Patterns to Follow

### Backend (NestJS)
- **Module pattern:** Module imports PrismaModule, provides Service, registers Controller
- **Guard pattern:** `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` at controller level
- **DTO validation:** `class-validator` decorators + `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- **Swagger:** `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` on all controllers; `@ApiProperty` on all DTOs
- **Error handling:** Throw NestJS `HttpException` subclasses; Prisma errors auto-caught by filter
- **Nested routes:** Questions under lessons `admin/lessons/:lessonId/questions`

### Frontend (Next.js)
- **Route groups:** `(auth)` for login, `(admin)` for admin, `(student)` for student
- **Role protection:** `RoleProtectedLayout` component checks `useAuthStore` role
- **Data fetching:** Custom hooks wrapping `useQuery`/`useMutation` from TanStack Query
- **State management:** Zustand for auth only; React Query for all server state
- **UI components:** shadcn/ui primitives + custom composed components
- **Markdown rendering:** `react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-sanitize`

---

## 15. Constraints — Copilot MUST NOT violate these rules (What NOT to Do) 

- ❌ Don't expose `explanation` or `isCorrect` in student lesson detail API (BR-02)
- ❌ Don't allow category deletion when lessons reference it (BR-06)
- ❌ Don't use localStorage for access tokens (use Zustand in-memory)
- ❌ Don't allow multi-choice answers — quiz is single-choice only (BR-05)
- ❌ Don't reset completion status on retakes — first attempt determines completion (BR-01)
- ❌ Don't enable Swagger in production (`NODE_ENV=production`)
- ❌ Don't skip validation on DTO fields — always use `class-validator` decorators
- ❌ Don't create module files without importing into `app.module.ts`



## 16. Hạn chế hiện tại 14:30,11/03/2026

- ❌ trên một browser khi http://localhost:3000 admin đăng nhập vào trước mà sau đó, chạy thêm tab http://localhost:3000 sinh viên đăng nhập vào thì bên admin bị nhận diện là sai role không thể thực hiện các chức năng của admin nữa(lúc này browser ở trang admin vẫn giữ nguyên không bị đăng xuất ra hay gì cả). Vấn đề này nên giải quyết như nào ?
- ❌ lỗi khi tải ảnh "ZeroTrust_Goal.jpg" Validation failed (current file type is image/jpeg, expected type is /^image\/(jpg|jpeg|png)$/) , bạn có thể kiểm tra ảnh ở đây trong file ZeroTrust_Goal.jpg trong Project tôi thấy nó vẫn đúng kiểu jpg mà. và trong terminal thì tôi vẫn thấy hiện " azubi_backend   | PATCH /api/admin/lessons/db40ee40-6f1a-43ee-913d-1f440f9b3817 200 2ms" 