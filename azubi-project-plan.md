# 🏨 Azubi Hospitality — Project Plan & Architecture

> **Phiên bản:** 1.1 | **Ngày:** 06/03/2026  
> **Loại tài liệu:** Technical Design & Project Plan  
> **Cập nhật:** Đồng bộ với BRD v1.1 — sửa logic hoàn thành, thêm module Category, Admin tạo Student

---

## 1. Tổng quan dự án

Webapp phục vụ học viên ngành nhà hàng khách sạn (Azubi), gồm hai vai trò chính:
- **Admin:** Quản lý bài học, danh mục, câu hỏi, tài nguyên đính kèm; tạo tài khoản Student.
- **Student:** Xem và hoàn thành bài tập (được làm lại nhiều lần), theo dõi tiến độ.

---

## 2. Kiến trúc tổng thể — Monolith hay Microservice?

### ✅ Lựa chọn: Modular Monolith

**Lý do:**
- Team nhỏ, scope nhỏ → microservice sẽ over-engineer, tốn infra cost.
- Monolith vẫn tách module rõ ràng theo domain → dễ refactor sang microservice về sau nếu cần.
- Giảm độ phức tạp của CI/CD, networking, distributed tracing ở giai đoạn đầu.

**Nguyên tắc:** Tách module theo domain ngay từ đầu (Auth, Users, Categories, Lessons, Questions, Submissions, Files). Mỗi module có folder riêng, không phụ thuộc chéo trực tiếp — chỉ giao tiếp qua service layer.

---

## 3. Tech Stack

### 3.1 Frontend

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR/SSG tốt, file-based routing, SEO |
| Language | **TypeScript** | Type safety, tránh bug runtime |
| Styling | **Tailwind CSS** | Nhanh, nhất quán, dễ maintain |
| UI Component | **shadcn/ui** | Accessible, headless, dễ customize |
| State Management | **Zustand** | Nhẹ hơn Redux, đủ dùng cho scope này |
| Server State | **TanStack Query (React Query)** | Caching, invalidation, loading state |
| Form | **React Hook Form + Zod** | Validation client-side mạnh, type-safe |
| Rich Text / Markdown Editor | **@uiw/react-md-editor** | Cho admin soạn nội dung bài học bằng Markdown |
| Markdown Renderer | **react-markdown + rehype-highlight** | Render nội dung bài học ra HTML đẹp |
| HTTP Client | **Axios** hoặc native `fetch` với wrapper |

### 3.2 Backend

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Runtime | **Node.js** | Đồng ngôn ngữ TS với Frontend, ecosystem lớn |
| Framework | **NestJS** | Modular, DI (Dependency Injection), cấu trúc rõ ràng |
| Language | **TypeScript** | Toàn bộ project dùng chung TS |
| ORM | **Prisma** | Type-safe queries, migration dễ, schema-first |
| Database | **PostgreSQL** | Relational, mạnh với query phức tạp, mature |
| File Storage | **MinIO** (self-hosted, S3-compatible) | Lưu Word files, ảnh bài học; dễ migrate sang AWS S3 |
| Auth | **JWT (Access + Refresh Token)** với **Passport.js** | Stateless, chuẩn công nghiệp |
| Validation | **class-validator + class-transformer** | Tích hợp tốt với NestJS |
| API Docs | **Swagger (OpenAPI)** via `@nestjs/swagger` | Auto-gen từ decorator, chuẩn |
| Testing | **Jest + Supertest** | Unit & Integration test |

### 3.3 Infra & DevOps

| Hạng mục | Lựa chọn |
|---|---|
| Containerization | **Docker + Docker Compose** |
| Reverse Proxy | **Nginx** |
| CI/CD | **GitHub Actions** |
| Môi trường | dev / staging / production |

---

## 4. Database Design (Entity Relationship)

```
┌──────────────┐       ┌──────────────┐       ┌───────────────┐
│    users     │       │   lessons    │       │   categories  │
│──────────────│       │──────────────│       │───────────────│
│ id (PK)      │       │ id (PK)      │       │ id (PK)       │
│ email        │       │ title        │  ───► │ name          │
│ password     │       │ summary      │       └───────────────┘
│ full_name    │       │ content_md   │ ← Trường Markdown
│ role (enum)  │       │ category_id  │
│ created_at   │       │ image_url    │
└──────────────┘       │ created_at   │
        │              │ updated_at   │
        │              └──────────────┘
        │                     │ 1
        │                     │
        │              N ┌────▼─────────┐
        │          ┌─────│  questions   │
        │          │     │──────────────│
        │          │     │ id (PK)      │
        │          │     │ lesson_id    │
        │          │     │ text         │
        │          │     │ explanation  │ ← Giải thích tổng cho câu hỏi
        │          │     │ order_index  │
        │          │     └──────────────┘
        │          │            │ 1
        │          │            │
        │          │     N ┌────▼─────────┐
        │          │       │   answers    │
        │          │       │──────────────│
        │          │       │ id (PK)      │
        │          │       │ question_id  │
        │          │       │ text         │
        │          │       │ is_correct   │
        │          │       │ explanation  │ ← Giải thích riêng từng đáp án
        │          │       └──────────────┘
        │          │
        │ N        │
┌───────▼────────┐ │     ┌──────────────┐
│lesson_attempts │ │     │lesson_files  │
│────────────────│ │     │──────────────│
│ id (PK)        │ │     │ id (PK)      │
│ user_id (FK)   │ │     │ lesson_id    │
│ lesson_id (FK) │ │     │ file_url     │
│ attempt_number │ │     │ file_name    │
│ score          │ │     │ uploaded_at  │
│ correct_count  │ │     └──────────────┘
│ submitted_at   │ │
└───────┬────────┘ └── (lesson liên kết questions)
        │ 1
        │
  N ┌───▼──────────┐
    │  submissions │
    │──────────────│
    │ id (PK)      │
    │ attempt_id   │ ← FK → lesson_attempts
    │ question_id  │
    │ answer_id    │
    │ is_correct   │
    └──────────────┘
```

### Quyết định thiết kế quan trọng:

**Q: Nội dung bài học có nên là một trường DB không?**  
✅ **Có** — Lưu dưới dạng `content_md TEXT` trong bảng `lessons`. Markdown dài bao nhiêu cũng được, không cần file hệ thống riêng. Admin dùng Markdown Editor trên UI để soạn và preview trực tiếp.

**Q: Giải thích câu hỏi nên ở đâu?**  
✅ **Backend lưu, Frontend render** — Mỗi `answer` có trường `explanation` (giải thích riêng). Mỗi `question` có trường `explanation` tổng. Khi học viên submit xong, backend trả về đầy đủ `answers` kèm `explanation` → Frontend hiển thị. Logic không bị hardcode ở client.

**Q: Trạng thái hoàn thành bài học? *(Cập nhật v1.1)***  
✅ **Theo lần nộp ĐẦU TIÊN (`attempt_number = 1`)** — Bài học được coi là "Đã hoàn thành" khi student đã nộp lần đầu tiên với đủ số câu hỏi. Trạng thái này **không thay đổi** dù student làm lại bao nhiêu lần. Tính toán động, không lưu `is_completed` riêng.

**Q: Làm bài nhiều lần xử lý thế nào? *(Cập nhật v1.1)***  
✅ **Mỗi lần nộp tạo một `lesson_attempt` mới** với `attempt_number` tăng dần (bắt đầu từ 1). Toàn bộ lịch sử được giữ lại. UI hiển thị kết quả lần nộp gần nhất để xem lại, nhưng trạng thái "hoàn thành" chỉ dựa vào lần đầu.

**Cập nhật mô hình dữ liệu (bổ sung v1.1):**
- Bảng `lesson_attempts` (`id`, `user_id`, `lesson_id`, `attempt_number`, `submitted_at`, `score`, `correct_count`).
- Bảng `submissions` dùng khóa ngoại `attempt_id` để gom đáp án theo từng lần nộp.
- Index `(user_id, lesson_id, attempt_number)` để truy vấn nhanh lần nộp đầu tiên và mới nhất.

**Validation rules (BRD BR-03):**
- Mỗi câu hỏi phải có **ít nhất 2 đáp án** và **ít nhất 1 đáp án `is_correct = TRUE`**. Backend từ chối lưu nếu vi phạm.

**Xóa danh mục (BRD BR-06):**
- Admin **không thể xóa** Category đang được gán cho Lesson. Hiển thị cảnh báo yêu cầu chuyển bài học sang danh mục khác trước.

---

## 5. API Design (RESTful)

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Categories (Admin) *(Mới — v1.1)*
```
GET    /api/admin/categories            → Danh sách tất cả danh mục
POST   /api/admin/categories            → Tạo danh mục mới
PATCH  /api/admin/categories/:id        → Đổi tên danh mục
DELETE /api/admin/categories/:id        → Xóa (từ chối nếu có Lesson đang gán — BR-06)
```

### Students (Admin) *(Mới — v1.1)*
```
GET    /api/admin/students               → Danh sách tất cả Student
POST   /api/admin/students               → Tạo tài khoản Student (email + password)
DELETE /api/admin/students/:id           → Xóa tài khoản Student (cân nhắc)
```

### Lessons (Admin)
```
GET    /api/admin/lessons              → Danh sách (kèm question count, file list)
POST   /api/admin/lessons              → Tạo mới
GET    /api/admin/lessons/:id          → Chi tiết (kèm content_md, questions)
PATCH  /api/admin/lessons/:id          → Cập nhật
DELETE /api/admin/lessons/:id          → Xóa (cascade: files, questions, answers, attempts, submissions)
POST   /api/admin/lessons/:id/image    → Upload ảnh bài học
POST   /api/admin/lessons/:id/files    → Upload file Word đính kèm
DELETE /api/admin/lessons/:id/files/:fileId
```

### Questions & Answers (Admin)
```
POST   /api/admin/lessons/:id/questions
PATCH  /api/admin/questions/:id
DELETE /api/admin/questions/:id          → Cascade: answers + submissions liên quan
POST   /api/admin/questions/:id/answers
PATCH  /api/admin/answers/:id
DELETE /api/admin/answers/:id
```
> **Validation (BR-03):** Khi lưu câu hỏi, backend kiểm tra ≥ 2 đáp án và ≥ 1 đáp án đúng. Từ chối nếu vi phạm.

### Student
```
GET    /api/student/lessons                       → Danh sách + trạng thái completed (theo attempt đầu tiên — BR-01)
GET    /api/student/lessons/:id                   → Chi tiết bài học (KHÔNG trả explanation — BR-02)
POST   /api/student/lessons/:id/attempts          → Nộp bài (tạo attempt mới, tăng attempt_number)
GET    /api/student/lessons/:id/attempts           → Lịch sử tất cả lần nộp
GET    /api/student/lessons/:id/attempts/latest    → Kết quả + giải thích lần nộp mới nhất
GET    /api/student/lessons/:id/attempts/:attemptId → Kết quả + giải thích 1 lần nộp cụ thể
```

---

## 6. Cấu trúc thư mục dự án

```
azubi-app/
├── apps/
│   ├── frontend/                  # Next.js App
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (student)/
│   │   │   │   ├── lessons/
│   │   │   │   └── lessons/[id]/
│   │   │   └── (admin)/
│   │   │       ├── dashboard/
│   │   │       ├── lessons/[id]/edit/
│   │   │       ├── categories/           # Quản lý danh mục (v1.1)
│   │   │       └── students/             # Quản lý tài khoản Student (v1.1)
│   │   ├── components/
│   │   │   ├── ui/                # shadcn components
│   │   │   ├── lessons/
│   │   │   ├── questions/
│   │   │   ├── categories/        # Category components (v1.1)
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios instance
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── types/
│   │
│   └── backend/                   # NestJS App
│       ├── src/
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── jwt.strategy.ts
│       │   │   └── guards/
│       │   ├── lessons/
│       │   │   ├── lessons.module.ts
│       │   │   ├── lessons.service.ts
│       │   │   ├── lessons.controller.ts
│       │   │   └── dto/
│       │   ├── questions/
│       │   ├── categories/               # CRUD danh mục (v1.1)
│       │   │   ├── categories.module.ts
│       │   │   ├── categories.service.ts
│       │   │   ├── categories.controller.ts
│       │   │   └── dto/
│       │   ├── users/                    # Admin quản lý Student (v1.1)
│       │   │   ├── users.module.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.controller.ts
│       │   │   └── dto/
│       │   ├── submissions/
│       │   ├── files/
│       │   │   └── minio.service.ts
│       │   ├── prisma/
│       │   │   └── prisma.service.ts
│       │   └── common/
│       │       ├── decorators/    # @Roles(), @CurrentUser()
│       │       ├── guards/        # RolesGuard, JwtAuthGuard
│       │       ├── interceptors/  # LoggingInterceptor, TransformInterceptor
│       │       └── filters/       # GlobalExceptionFilter
│       ├── prisma/
│       │   └── schema.prisma
│       └── test/
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
│
├── docker-compose.yml             # Dev environment
├── docker-compose.prod.yml        # Production
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 7. Docker Configuration

### docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: azubi_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: azubi_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console UI
    volumes:
      - minio_data:/data

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.dev
    container_name: azubi_backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_USER}
      MINIO_SECRET_KEY: ${MINIO_PASSWORD}
    ports:
      - "3001:3001"
    volumes:
      - ./apps/backend:/app
      - /app/node_modules       # Avoid overwriting node_modules
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run start:dev

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.dev
    container_name: azubi_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    command: npm run dev

volumes:
  postgres_data:
  minio_data:
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Không expose port ra ngoài trong production

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      MINIO_ENDPOINT: minio
    depends_on:
      - postgres
      - minio

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: /api   # Qua Nginx proxy
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro   # SSL certificates
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  minio_data:
```

### Nginx Config (nginx.conf)

```nginx
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API requests → Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;  # Cho upload file
    }

    # Everything else → Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 8. Authentication & Authorization Flow

```
Login Request
    │
    ▼
POST /api/auth/login
    │ validate credentials
    ▼
Return: { access_token (15m), refresh_token (7d) }
    │
    ▼
Frontend lưu:
  - access_token  → memory (Zustand store) — KHÔNG localStorage
  - refresh_token → httpOnly Cookie (secure)
    │
    ▼
Mọi request kèm: Authorization: Bearer <access_token>
    │
    ▼
NestJS JwtAuthGuard + RolesGuard kiểm tra role
    │
    ├─ role: ADMIN  → được phép các route /api/admin/*
    └─ role: STUDENT → chỉ được các route /api/student/*
```

**Lý do không dùng localStorage cho access_token:** Chống XSS attack. Refresh token trong httpOnly Cookie chống CSRF (kết hợp SameSite=Strict).

---

## 9. Business Logic — Các quyết định thiết kế

### 9.1 Trạng thái hoàn thành bài học *(Cập nhật v1.1 — dùng lần nộp ĐẦU TIÊN)*

```typescript
// Backend service tính toán khi trả danh sách bài học cho student
// BRD BR-01: "Đã hoàn thành" = có attempt_number=1 với đủ số câu hỏi
async getLessonsWithProgress(userId: string) {
  const lessons = await this.prisma.lesson.findMany({
    include: { _count: { select: { questions: true } } }
  });

  // Lấy lần nộp ĐẦU TIÊN (attempt_number = 1) cho mỗi bài học
  const firstAttempts = await this.prisma.lessonAttempt.findMany({
    where: {
      userId,
      attemptNumber: 1,
      lessonId: { in: lessons.map(l => l.id) }
    },
    include: { _count: { select: { submissions: true } } }
  });

  // Lấy lần nộp MỚI NHẤT để hiển thị kết quả gần nhất trên UI
  const latestAttempts = await this.prisma.lessonAttempt.findMany({
    where: {
      userId,
      lessonId: { in: lessons.map(l => l.id) }
    },
    orderBy: { submittedAt: 'desc' },
    distinct: ['lessonId']
  });

  const firstByLesson = new Map(
    firstAttempts.map(a => [a.lessonId, a])
  );
  const latestByLesson = new Map(
    latestAttempts.map(a => [a.lessonId, a])
  );

  return lessons.map(lesson => ({
    ...lesson,
    // Hoàn thành = lần nộp đầu tiên có đủ submissions cho tất cả câu hỏi
    isCompleted:
      (firstByLesson.get(lesson.id)?._count.submissions ?? 0) ===
      lesson._count.questions,
    latestAttemptId: latestByLesson.get(lesson.id)?.id ?? null
  }));
}
```

### 9.2 Submit bài và nhận giải thích

Student gửi một lần tất cả câu trả lời → Backend tạo một `lesson_attempt` mới, lưu các `submissions` theo `attempt_id`, chấm điểm và trả về kết quả với explanation:

```typescript
// Response sau khi submit
{
  attemptId: "att_20260305_001",
  totalQuestions: 5,
  correctCount: 2.5, // Có thể ra điểm thập phân nếu Multiple Choice tính partial
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      text: "Câu hỏi...",
      explanation: "Giải thích tổng cho câu này...",
      yourAnswers: [ // Dùng mảng để hỗ trợ MULTIPLE_CHOICE (chọn nhiều đáp án)
         { id: "a2", text: "...", isCorrect: false }
      ],
      answers: [
        { id: "a1", text: "...", isCorrect: true, explanation: "Vì đây là..." },
        { id: "a2", text: "...", isCorrect: false, explanation: "Sai vì..." }
      ]
    }
  ]
}
```

Giải thích được lưu ở DB (backend) và chỉ trả về sau khi submit — không expose trước (BR-02). Student có thể làm nhiều lần; trạng thái "hoàn thành" dựa vào lần nộp đầu tiên (BR-01), nhưng UI hiển thị kết quả lần nộp gần nhất để xem lại.

### 9.3 Upload file

Dùng MinIO (S3-compatible):
- Ảnh bài học: bucket `lesson-images`, public-read
- File Word đính kèm: bucket `lesson-files`, private (signed URL khi download)

---

## 10. CI/CD — GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd apps/backend && npm ci
      - run: cd apps/backend && npm run test
      - run: cd apps/backend && npm run test:e2e

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd apps/frontend && npm ci
      - run: cd apps/frontend && npm run type-check
      - run: cd apps/frontend && npm run lint

  build-and-deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & push Docker images
        run: docker compose -f docker-compose.prod.yml build
      - name: Deploy to server
        run: |
          # SSH vào server và docker compose up -d
```

---

## 11. Chuẩn code & conventions

### Naming
- **Files/Folders:** kebab-case (`lesson-detail.tsx`, `lessons.service.ts`)
- **Components:** PascalCase (`LessonCard`, `QuestionForm`)
- **Variables/Functions:** camelCase
- **Constants:** SCREAMING_SNAKE_CASE
- **DB columns:** snake_case (Prisma convention)

### Git Flow
```
main          ← production only, protected branch
develop       ← integration branch
feature/xxx   ← feature branches (merge vào develop)
hotfix/xxx    ← từ main, merge vào cả main và develop
```

### Commit message (Conventional Commits)
```
feat: thêm tính năng upload ảnh bài học
fix: sửa lỗi tính toán trạng thái hoàn thành
refactor: tách QuestionForm thành component riêng
docs: cập nhật README
chore: upgrade dependencies
```

### Environment variables — không bao giờ commit `.env`
```
.env.example   ← commit lên git (chỉ key, không có value)
.env           ← gitignore
.env.test      ← cho test
```

---

## 12. Lộ trình thực hiện (Phased Roadmap)

### Phase 1 — Foundation (2 tuần)
- [ ] Setup monorepo, Docker Compose dev environment
- [ ] Prisma schema + migrations (bao gồm `lesson_attempts` với `attempt_number`)
- [ ] NestJS: Auth module (login, JWT, refresh token, RBAC guard)
- [ ] NestJS: Users module — Admin tạo tài khoản Student *(v1.1)*
- [ ] Next.js: Login page, auth context, route protection
- [ ] CI pipeline cơ bản

### Phase 2 — Core Admin (2 tuần)
- [ ] CRUD Categories API + Admin UI quản lý danh mục *(v1.1)*
- [ ] CRUD Lessons API (NestJS) — cascade delete (BR-04)
- [ ] Upload ảnh & file Word (MinIO)
- [ ] Admin Dashboard UI: danh sách, tạo, sửa, xóa bài học
- [ ] Markdown Editor tích hợp vào form bài học
- [ ] Admin UI: quản lý tài khoản Student *(v1.1)*

### Phase 3 — Questions & Answers (1.5 tuần)
- [ ] CRUD Questions & Answers API (validate BR-03: ≥ 2 đáp án, ≥ 1 đúng)
- [ ] Admin UI: thêm/sửa/xóa câu hỏi và đáp án kèm explanation
- [ ] Reorder questions (drag-and-drop optional)

### Phase 4 — Student Experience (2 tuần)
- [ ] Student: danh sách bài học + trạng thái hoàn thành (theo lần nộp đầu tiên — BR-01) *(v1.1)*
- [ ] Student: trang chi tiết bài học (render Markdown + download files, ẩn explanation — BR-02)
- [ ] Student: làm bài tập, submit (tạo attempt mới với `attempt_number`), nhận kết quả + giải thích
- [ ] Student: xem lịch sử các lần nộp bài *(v1.1)*

### Phase 5 — Polish & Production (1 tuần)
- [ ] Error handling toàn diện (Global Exception Filter)
- [ ] Logging (Winston logger)
- [ ] Docker Compose production + Nginx SSL
- [ ] Swagger API docs hoàn chỉnh
- [ ] Testing coverage ≥ 70%

### Phase 6 — Câu hỏi Tự luận & Trắc nghiệm Nhiều đáp án
- [x] Task 6.1: Database Schema & Backend DTOs (Prompt 25)
- [x] Task 6.2: Backend Scoring Logic (Prompt 26)
- [x] Task 6.3: Frontend Admin Question UI (Prompt 27)
- [x] Task 6.4: Frontend Student Quiz UI (Prompt 28)

### Phase 7 — Câu hỏi dạng Ảnh (IMAGE_ESSAY)
*Dạng câu hỏi có kèm ảnh đính kèm minh họa, sinh viên điền đáp án tự luận (không chấm điểm) và xem giải thích sau khi nộp.*
- [x] Task 7.1: Database Schema & Backend DTOs (Prompt 62)
- [x] Task 7.2: Backend - API xử lý upload ảnh câu hỏi (Prompt 63)
- [x] Task 7.3: Frontend Admin - Quản lý câu hỏi kèm ảnh (Prompt 64)
- [x] Task 7.4: Frontend Student - Giao diện làm bài có ảnh (Prompt 65)

### Phase 8 — Tối ưu hóa Ảnh Hệ thống toàn diện
*Tối ưu hóa hình ảnh tải lên để tiết kiệm dung lượng MinIO, tiết kiệm băng thông mạng và tăng tốc độ tải trang cho học viên dựa theo chiến lược Culling 3 tầng.*
- [x] Task 8.1: Backend - Tối ưu bằng sharp (Resize & WebP) (Prompt 69)
- [x] Task 8.2: Frontend - Nén ảnh lúc upload với browser-image-compression (Prompt 70)
- [x] Task 8.3: Frontend - Render tối ưu bằng next/image (Prompt 71)
- [x] Task 8.4: Frontend - Fix lỗi 500 Docker Bypassing Image Optimization (Prompt 72)

### Phase 9 — Tối ưu SEO, HTML Semantics & Accessibility (A11y)
*Nâng cấp bộ khung HTML của Next.js để Googlebot dễ dàng thu thập dữ liệu (Crawl & Index) và tăng trải nghiệm cho các công cụ hỗ trợ đọc màn hình.*
- [x] Task 9.1: Cấu trúc HTML Ngữ nghĩa (Semantic HTML) (Prompt 73)
- [x] Task 9.2: Tối ưu Metadata & Open Graph động (Prompt 74)
- [x] Task 9.3: Khả năng tiếp cận (Accessibility - a11y) (Prompt 75)

### Phase 10 — Hình Ảnh Phổ Quát Cho Mọi Loại Câu Hỏi
*Cho phép đính kèm ảnh minh họa vào tất cả các loại câu hỏi (Trắc nghiệm, Sắp xếp, Ghép đôi...) thay vì chỉ giới hạn ở Ảnh Tự luận. Kiến trúc Database và Backend đã hỗ trợ sẵn, chỉ cần mở khóa trên Admin UI.*
- [x] Task 10.1: Mở khóa Upload Ảnh cho mọi loại câu hỏi tại Admin (Prompt 76)

### Phase 11 — Tối ưu hóa Hiệu năng Frontend & Bundle Size (JS Optimization)
*Do chúng ta sử dụng Kokonut UI (cực nhiều animation) nên dung lượng Javascript (JS Bundle) tải về ban đầu sẽ khá nặng, gây chậm thời gian TTI (Time to Interactive). Ta cần tối ưu để giảm tải CPU và tăng tốc tải trang.*
- [ ] Task 11.1: Tối ưu hóa Framer Motion với LazyMotion (Prompt 79)
- [ ] Task 11.2: Lười Tải (Lazy Load / Dynamic Import) các Component Nặng (Prompt 80)
- [ ] Task 11.3: React Suspense & Tối ưu luồng dữ liệu (Prompt 81)

---

## 13. Checklist chuẩn production

- [ ] Rate limiting trên API (nestjs-throttler)
- [ ] Helmet.js cho security headers
- [ ] CORS config đúng origin
- [ ] Input validation trên toàn bộ DTO
- [ ] SQL injection: Prisma parameterized queries (đã tự xử lý)
- [ ] File upload: validate MIME type + giới hạn size
- [ ] Signed URLs cho file download (không expose MinIO trực tiếp)
- [ ] Sanitize Markdown trước khi render để chống XSS
- [ ] Database backup định kỳ
- [ ] Health check endpoint (`/api/health`)
- [ ] Graceful shutdown handling

---

## 14. Lịch sử cập nhật kế hoạch

### v1.0 (05/03/2026)
- Khởi tạo tài liệu. Mô hình `lesson_attempts`, tách namespace API `admin/student`, chuẩn hóa flow submit/result.

### v1.1 (06/03/2026) — Đồng bộ BRD v1.1
- **Sửa logic trạng thái hoàn thành:** từ "lần nộp mới nhất" → **"lần nộp đầu tiên" (`attempt_number = 1`)** theo BR-01.
- **Thêm module Category:** CRUD danh mục linh hoạt (CAT-01→04), business rule BR-06 (không xóa category đang dùng).
- **Thêm module Admin tạo Student:** API + UI cho Admin tạo tài khoản Student (AUTH-05). Không có tự đăng ký.
- **Bổ sung validation BR-03:** Mỗi câu hỏi ≥ 2 đáp án, ≥ 1 đáp án đúng.
- **Mở rộng API Student:** thêm endpoint lịch sử lần nộp, xem kết quả từng lần nộp cụ thể.
- **Cập nhật DB diagram:** `users.name` → `full_name`, `lessons` thêm `updated_at`, `lesson_files` thêm `uploaded_at`, `lesson_attempts` thêm `attempt_number`.
- **Cập nhật roadmap:** phản ánh các module mới vào Phase 1–4.

---

Ước tính RAM thực tế khi chạy:
ServiceRAM tiêu thụPostgreSQL~150–200 MBNestJS Backend~150–200 MBNext.js Frontend~200–300 MBMinIO~150–200 MBNginx~20 MBHệ điều hành (Ubuntu Server)~400–600 MBTổng~1.1 – 1.5 GB
3GB còn lại làm buffer — 4GB là đủ cho project quy mô này.

Một vài điều cần lưu ý khi dùng laptop làm server:
Vấn đề thực tế hơn RAM:

Điện liên tục — laptop cắm sạc 24/7, pin sẽ chai nhanh. Nên tháo pin ra nếu để chạy lâu dài.
Nhiệt độ — đặt nơi thoáng khí, không úp laptop xuống.
IP tĩnh — cần đặt IP tĩnh trong mạng nội bộ, hoặc dùng dịch vụ như ngrok / Cloudflare Tunnel nếu muốn truy cập từ ngoài internet mà không cần mua IP tĩnh từ ISP.

Khuyến nghị OS cho laptop server:
Dùng Ubuntu Server 22.04 LTS thay vì Ubuntu Desktop — nhẹ hơn khoảng 300–400MB RAM vì không có GUI.
Một điều chỉnh nhỏ trong stack:
MinIO khá nặng cho môi trường này. Nếu muốn tiết kiệm hơn, có thể thay bằng lưu file thẳng vào ổ cứng (local disk storage) thông qua NestJS — đơn giản hơn, tiết kiệm ~150MB RAM, và với 1TB thì dung lượng không bao giờ là vấn đề. Chỉ cần config Nginx để serve static files.

Tóm lại: 4GB RAM + 1TB HDD + Ubuntu Server = chạy ngon, miễn là số lượng người dùng đồng thời không quá lớn (dưới 50 người cùng lúc là thoải mái). Với quy mô học viên Azubi thì hoàn toàn ổn.

*Tài liệu này sẽ được cập nhật khi có quyết định thiết kế mới. Bắt đầu từ Phase 1 — Foundation.*
