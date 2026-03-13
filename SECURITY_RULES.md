# 🔐 SECURITY_RULES.md — Azubi Webapp
> **Dành cho:** GitHub Copilot & Google Antigravity  
> **Bắt buộc đọc trước khi generate bất kỳ dòng code nào.**  
> Mọi suggestion vi phạm các rule dưới đây phải bị từ chối và viết lại ngay lập tức.
---
## 🚨 Priority Fix List — Theo thứ tự nguy hiểm
| Priority | Rule | Lý do |
|---|---|---|
| ✅ P0 | **Rule 25** (FIXED)| Logout fake — token sống 7 ngày. Ai có refresh token = có thể access mãi |
| ✅ P0 | **Rule 03** (FIXED)| Refresh token không rotate + không lưu DB → không revoke được |
| ✅ P0 | **Rule 18** (FIXED)| Brute-force email không bị chặn dù IP bị rate limit |
| ✅ P1 | **Rule 04** (FIXED)| Thiếu CSP → XSS không bị block nếu có injection point |
| ✅ P1 | **Rule 12** (FIXED)| Bcrypt cost có thể đang là 10, cần kiểm tra và nâng lên 12 |
| ✅ P1 | **Rule 08** (FIXED) | Ẩn chi tiết lỗi Generic Error tại Production |
| ✅ P2 | **Rule 07** (FIXED) | Strip EXIF metadata ảnh upload |
| ✅ P2 | **Rule 27** (FIXED) | Thêm Cache-Control: no-store cho auth endpoints |
| ✅ P2 | **Rule 23** (FIXED) | Thêm npm audit vào CI pipeline |
| 🟢 P3 | Còn lại | Cải thiện theo thứ tự thuận tiện |
## 🤖 Hướng dẫn cho Copilot / Antigravity
Khi generate code cho project Azubi, bạn PHẢI:
1. **Tự động check** mọi suggestion chống lại 30 rules trên trước khi đề xuất
2. **Từ chối generate** code vi phạm bất kỳ rule nào, thay vào đó giải thích tại sao và đề xuất cách đúng
3. **Ưu tiên fix P0** (Rules 25, 03, 18) trước khi implement bất kỳ feature nào mới
4. **Không bao giờ** gợi ý `localStorage` cho token storage dù bất kỳ lý do gì
5. **Luôn thêm** backend validation kể cả khi đã có frontend validation
6. **Nhắc nhở** nếu bất kỳ thay đổi nào có thể phá vỡ security model hiện tại
> **Cuối cùng:** Security không phải feature — nó là nền tảng. Một lỗ hổng bảo mật có thể phá hủy toàn bộ effort phát triển.
---
## 📋 30 SECURITY RULES — BẮT BUỘC TUÂN THỦ
---
### RULE 01 — Không lưu sensitive data trong localStorage
**Severity: CRITICAL**
```
❌ TUYỆT ĐỐI KHÔNG làm:
localStorage.setItem('accessToken', token)
localStorage.setItem('user', JSON.stringify(user))
sessionStorage.setItem('token', token)

✅ PHẢI làm:
- Access token → Zustand store (in-memory, mất khi refresh tab)
- Refresh token → HttpOnly cookie (set từ server, path=/api/auth)
- User info → Zustand store
```
**Kiểm tra trong project:** `apps/frontend/stores/auth-store.ts` — accessToken phải là `string | null` trong memory, không persist.
---

### RULE 02 — Tắt directory listing trên Nginx
**Severity: MEDIUM**
```nginx
# ❌ SAI
autoindex on;
# ✅ ĐÚNG — không khai báo hoặc tường minh tắt
autoindex off;
```
**Kiểm tra:** `docker/nginx/nginx.conf` — không được có `autoindex on`.  
**Lưu ý thêm:** MinIO console (port 9001) phải bị block trong production, không expose ra ngoài.
---

### RULE 03 — Rotate refresh token sau mỗi lần dùng
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Đã implement (Fixed via Prompt 48)**
```
❌ Hiện tại: refresh token không được lưu DB → không thể revoke
✅ Phải implement:
1. Thêm field refreshTokenHash vào User model (Prisma)
2. Mỗi lần /auth/refresh → tạo token MỚI + lưu hash mới vào DB + xóa hash cũ
3. Logout → set refreshTokenHash = null trong DB
```
```prisma
// apps/backend/prisma/schema.prisma — THÊM VÀO User model
model User {
  // ... fields hiện tại
  refreshTokenHash String?   // bcrypt hash của refresh token hiện tại
  lockedUntil      DateTime? // cho Rule 18 - account lockout
  failedLoginCount Int       @default(0) // cho Rule 18
}
```
```ts
// apps/backend/auth/auth.service.ts
async refresh(userId: string, refreshToken: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user?.refreshTokenHash) throw new UnauthorizedException();

  // Rule 26: dùng bcrypt.compare (constant-time)
  const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isValid) throw new UnauthorizedException();

  // Tạo cặp token MỚI
  const newRefreshToken = this.generateRefreshToken(userId);
  const newHash = await bcrypt.hash(newRefreshToken, 12);

  // Lưu hash mới, invalidate cũ
  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: newHash }
  });

  return { accessToken: this.generateAccessToken(userId), newRefreshToken };
}
```

---
### RULE 04 — Bắt buộc Content-Security-Policy trên mọi trang
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Đã implement (Fixed via Prompt 49)**
```nginx
# docker/nginx/nginx.conf — THÊM VÀO server block
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-$csp_nonce';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  frame-ancestors 'none';
" always;
```
```ts
// apps/backend/main.ts — helmet CSP config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    }
  }
}));
```

---
### RULE 05 — Luôn validate ở server, KHÔNG tin frontend
**Severity: CRITICAL**  
**Đây là lỗi phổ biến nhất trong Vibe Coding**
```
Nguyên tắc bất di bất dịch:
Frontend validation = UX (giúp người dùng)
Backend validation = Security (bắt buộc)
Kể cả khi frontend đã validate rồi → backend PHẢI validate lại.
```
```ts
// apps/backend/questions/dto/create-question.dto.ts
export class CreateQuestionDto {
  @IsString() @IsNotEmpty()
  text: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Phải có ít nhất 2 answers (BR-03)' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}
// apps/backend/questions/questions.service.ts — validate trong service
const hasCorrect = dto.answers.some(a => a.isCorrect);
if (!hasCorrect) throw new BadRequestException('Phải có ít nhất 1 đáp án đúng (BR-03)');
```
```ts
// apps/backend/submissions/submissions.service.ts — BR-05 validate ở backend
const answersPerQuestion = new Map<string, number>();
for (const answer of dto.answers) {
  const count = (answersPerQuestion.get(answer.questionId) ?? 0) + 1;
  if (count > 1) throw new BadRequestException('Single-choice: chỉ được chọn 1 đáp án mỗi câu (BR-05)');
  answersPerQuestion.set(answer.questionId, count);
}
```

---
### RULE 06 — X-Frame-Options: DENY chống clickjacking
**Severity: MEDIUM**  
**Trạng thái hiện tại: ✅ Đã có trong Nginx — kiểm tra đủ `always` flag chưa**
```nginx
# docker/nginx/nginx.conf
add_header X-Frame-Options "DENY" always;  # 'always' quan trọng — áp dụng cả response lỗi
```

```ts
// apps/backend/main.ts — helmet tự set nhưng kiểm tra lại
app.use(helmet({
  frameguard: { action: 'deny' }
}));
```

---

### RULE 07 — Strip metadata từ file upload trước khi lưu
**Severity: MEDIUM**  
**Trạng thái hiện tại: ⚠️ Chưa có bước sanitize**

```ts
// apps/backend/lessons/lessons.service.ts — khi upload ảnh
import sharp from 'sharp';

// ❌ SAI — upload thẳng buffer chưa sanitize
await this.minioService.uploadFile('lesson-images', name, buffer, mimetype);

// ✅ ĐÚNG — strip EXIF trước khi upload
const sanitizedBuffer = await sharp(buffer)
  .rotate()           // tự động rotate theo EXIF rồi xóa metadata
  .toBuffer();
await this.minioService.uploadFile('lesson-images', name, sanitizedBuffer, mimetype);
```

**Lưu ý:** File `.docx` cũng nên được scan virus/malware trước khi lưu trong production.

---

### RULE 08 — Không expose stack traces trong production
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Filter đã implement — kiểm tra kỹ hơn**

```ts
// apps/backend/common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';

    // ✅ Log ở server — OK
    if (!(exception instanceof HttpException)) {
      console.error('[SERVER ERROR]', exception); // chỉ log, không trả về client
    }

    // ❌ TUYỆT ĐỐI KHÔNG trả về client
    // response.json({ stack: exception.stack })    // SAI
    // response.json({ detail: exception.message }) // SAI nếu là Prisma error raw

    // ✅ Chỉ trả message generic
    response.json({
      statusCode,
      message: isProduction ? sanitizedMessage : message,
      // KHÔNG có: stack, detail, query, code
    });
  }
}
```

---

### RULE 09 — Presigned URLs có thời hạn ngắn cho file riêng tư
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Đã implement đúng — KHÔNG được thay đổi**

```ts
// apps/backend/files/minio.service.ts
// ✅ ĐÚNG — private bucket dùng presigned URL
getPresignedUrl(bucket: string, objectName: string, expiry = 3600) // max 1 giờ

// ❌ TUYỆT ĐỐI KHÔNG làm với private bucket
getPublicUrl('lesson-files', objectName) // SAI! lesson-files là PRIVATE

// Bucket policy phải đúng:
// lesson-images → public read (ảnh bìa bài học — OK)
// lesson-files  → PRIVATE, chỉ access qua presigned URL
```

---

### RULE 10 — CSRF protection
**Severity: MEDIUM**

```
Project dùng JWT Bearer token trong Authorization header
→ Browser không tự gửi custom header → CSRF-safe theo thiết kế

TUY NHIÊN: /auth/refresh dùng HttpOnly cookie → có nguy cơ CSRF
```

```ts
// apps/backend/auth/auth.controller.ts — thêm CSRF check cho refresh endpoint
@Post('refresh')
async refresh(@Req() req: Request, @Res() res: Response) {
  // Kiểm tra Origin header khớp với CORS_ORIGIN
  const origin = req.headers['origin'];
  if (origin && origin !== process.env.CORS_ORIGIN) {
    throw new ForbiddenException('Invalid origin');
  }
  // ...
}
```

---

### RULE 11 — Tắt autocomplete trên form nhạy cảm
**Severity: LOW**

```tsx
// apps/frontend/app/(auth)/login/page.tsx
<Input
  type="password"
  autoComplete="current-password"  // ✅ hint cho password manager, không leak
/>

// apps/frontend/components/admin/CreateStudentDialog.tsx
<Input
  type="password"
  autoComplete="new-password"  // ✅ phân biệt với current password
/>

// ❌ Không dùng autoComplete="off" cho toàn form — phá UX
// Chỉ set trên field nhạy cảm
```

---

### RULE 12 — Bcrypt cost factor ≥ 12
**Severity: HIGH**  
**Trạng thái hiện tại: ✅[ĐÃ FIX]**

```ts
// apps/backend/auth/auth.service.ts
// ❌ SAI — cost 10 không đủ mạnh (crack được trong vài giờ)
const hash = await bcrypt.hash(password, 10);

// ✅ ĐÚNG — cost 12 minimum
const hash = await bcrypt.hash(password, 12);

// apps/backend/prisma/seed.ts — admin seed cũng phải dùng cost 12
const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
```

---

### RULE 13 — Giữ dependencies tối thiểu
**Severity: MEDIUM**

```bash
# Chạy định kỳ để detect package không dùng
cd apps/backend && npx depcheck
cd apps/frontend && npx depcheck

# Mỗi package bạn thêm vào = thêm attack surface
# Trước khi npm install <package>:
# 1. Có thực sự cần không?
# 2. Package đó có được maintain không? (kiểm tra last publish date)
# 3. npm audit sau khi install
```

---

### RULE 14 — Subresource Integrity cho external scripts
**Severity: MEDIUM**

```tsx
// ❌ SAI — không có integrity hash
<script src="https://cdn.example.com/lib.js"></script>

// ✅ ĐÚNG — có SRI hash
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-abc123..."
  crossOrigin="anonymous"
></script>

// Next.js App Router: kiểm tra app/layout.tsx
// Nếu dùng CDN bên ngoài → phải có integrity attribute
// Generate hash: https://www.srihash.org/
```

---

### RULE 15 — Không bao giờ log thông tin nhạy cảm
**Severity: CRITICAL**

```ts
// ❌ TUYỆT ĐỐI KHÔNG log những thứ này
console.log('User logged in:', { email, password })      // SAI
console.log('Token:', accessToken)                        // SAI
console.log('Request body:', req.body)                    // SAI nếu body có password
this.logger.debug(`Refresh token: ${refreshToken}`)       // SAI

// ✅ ĐÚNG — sanitize trước khi log
const safeBody = { ...req.body };
delete safeBody.password;
delete safeBody.token;
console.log('Request:', safeBody);

// apps/backend/common/interceptors/logging.interceptor.ts
// Phải filter các field: password, token, refreshToken, authorization
const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'authorization'];
```

---

### RULE 16 — Bắt buộc HTTPS, redirect HTTP → HTTPS
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Đã có — KHÔNG được xóa**

```nginx
# docker/nginx/nginx.conf — BẮT BUỘC giữ nguyên
server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;  # Redirect tất cả HTTP sang HTTPS
}

# ✅ Đã có trong project — đừng bao giờ xóa block này
```

---

### RULE 17 — Database credentials riêng cho mỗi môi trường
**Severity: CRITICAL**

```
# .env (Development) — dùng password đơn giản OK
DB_PASSWORD=azubi_pass_dev
JWT_SECRET=dev_secret_not_for_production

# .env.production — PHẢI khác hoàn toàn, strong random password
DB_PASSWORD=xK9#mP2@qR7$nL4!vB  # Random 20+ chars
JWT_SECRET=<random 64 bytes hex>
JWT_REFRESH_SECRET=<random 64 bytes hex khác>
MINIO_PASSWORD=<random strong password>

# Tạo strong secret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```
# .gitignore — KIỂM TRA có các dòng này không
.env
.env.production
*.pem
docker/nginx/ssl/
```

---

### RULE 18 — Account lockout sau N lần login thất bại
**Severity: HIGH**  
**Trạng thái hiện tại: ✅ Đã implement (Fixed via Prompt 48)**

```prisma
// apps/backend/prisma/schema.prisma — thêm vào User model
model User {
  // fields hiện tại...
  failedLoginCount Int       @default(0)
  lockedUntil      DateTime?
}
```

```ts
// apps/backend/auth/auth.service.ts
async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });

  // Kiểm tra tài khoản bị khóa
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new UnauthorizedException(`Tài khoản bị khóa. Thử lại sau ${minutesLeft} phút.`);
  }

  const isValidPassword = user && await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    if (user) {
      const failedCount = user.failedLoginCount + 1;
      const shouldLock = failedCount >= 5;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000) // khóa 15 phút
            : undefined,
        }
      });
    }
    throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
  }

  // Login thành công → reset counter
  await this.prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null }
  });
}
```

---

### RULE 19 — Validate Content-Type header trên API request
**Severity: MEDIUM**

```ts
// apps/backend/main.ts hoặc middleware riêng
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'] ?? '';
    const isJson = contentType.includes('application/json');
    const isMultipart = contentType.includes('multipart/form-data');

    if (!isJson && !isMultipart) {
      return res.status(415).json({
        statusCode: 415,
        message: 'Unsupported Media Type'
      });
    }
  }
  next();
});
```

---

### RULE 20 — Không dùng MD5 hoặc SHA1
**Severity: HIGH**

```ts
// ❌ TUYỆT ĐỐI KHÔNG dùng
import { createHash } from 'crypto';
createHash('md5').update(data).digest('hex')   // SAI
createHash('sha1').update(data).digest('hex')  // SAI

// ✅ ĐÚNG — tùy mục đích
// Password hashing → bcrypt (cost 12+) hoặc argon2
// Data integrity/checksum → SHA-256 minimum
// Token generation → crypto.randomBytes(32).toString('hex')

createHash('sha256').update(data).digest('hex')  // OK cho checksum
await bcrypt.hash(password, 12)                   // OK cho password
crypto.randomBytes(32).toString('hex')            // OK cho token generation
```

---

### RULE 21 — Least privilege cho credentials
**Severity: MEDIUM**

```
Áp dụng trong project này:

MinIO (trong docker-compose.yml):
- MINIO_USER + MINIO_PASSWORD → chỉ dùng cho app, không dùng làm admin console login
- MinIO console trong production → phải đặt sau VPN hoặc IP whitelist

PostgreSQL:
- DB user chỉ có quyền: SELECT, INSERT, UPDATE, DELETE trên schema azubi
- KHÔNG có quyền: CREATE DATABASE, DROP, pg_dump trực tiếp từ app

JWT payload:
- Chỉ include: { sub: userId, role, iat, exp }
- KHÔNG include: password hash, email, sensitive PII
```

---

### RULE 22 — Nonces cho inline scripts trong CSP
**Severity: MEDIUM**

```ts
// apps/frontend/middleware.ts — generate nonce cho mỗi request
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    object-src 'none';
  `.replace(/\n/g, '');

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce); // pass nonce to layout
  return response;
}

// ❌ TUYỆT ĐỐI KHÔNG dùng trong CSP
// script-src 'unsafe-inline'  → vô hiệu hóa toàn bộ XSS protection
// script-src 'unsafe-eval'    → cho phép eval() → nguy hiểm
```

---

### RULE 23 — Quét dependency vulnerabilities định kỳ
**Severity: HIGH**

```yaml
# .github/workflows/ci.yml — THÊM step này vào CI pipeline
- name: Security Audit — Backend
  run: cd apps/backend && npm audit --audit-level=high

- name: Security Audit — Frontend
  run: cd apps/frontend && npm audit --audit-level=high
```

```
# Thêm file .github/dependabot.yml vào project
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/apps/frontend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

### RULE 24 — Tắt HTTP methods không cần thiết
**Severity: LOW**

```nginx
# docker/nginx/nginx.conf
# Chặn TRACE (dùng để debug — hacker có thể dùng để đọc header)
if ($request_method = TRACE) {
  return 405;
}

# Chỉ whitelist method cần thiết
if ($request_method !~ ^(GET|POST|PATCH|DELETE|OPTIONS|HEAD)$) {
  return 405;
}
```

```ts
// apps/backend/main.ts — CORS chỉ whitelist method cần dùng
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  // PUT, TRACE không được enable
});
```

---

### RULE 25 — Logout phải hủy token ở server
**Severity: CRITICAL**  
**Trạng thái hiện tại: ✅ Đã implement (Fixed via Prompt 48 P0 Security - Khắc phục Logout giả & Chặn Brute-force)**

```ts
// ❌ Hiện tại — logout chỉ clear cookie client-side
// Refresh token vẫn hợp lệ trong 7 ngày sau khi logout

// ✅ Phải implement — server-side token revocation
// apps/backend/auth/auth.service.ts
async logout(userId: string, res: Response) {
  // 1. Xóa hash ở server → token cũ không còn dùng được
  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null }  // invalidate server-side
  });

  // 2. Xóa cookie ở client
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/api/auth',
  });
}

// apps/backend/auth/auth.controller.ts
@Post('logout')
@UseGuards(JwtAuthGuard) // PHẢI authenticate để biết userId
async logout(@CurrentUser() user: User, @Res() res: Response) {
  await this.authService.logout(user.id, res);
  return res.json({ message: 'Logged out successfully' });
}
```

---

### RULE 26 — Constant-time comparison khi validate token
**Severity: MEDIUM**

```ts
// ❌ SAI — timing attack vulnerable
if (token === storedToken) { ... }
if (hash === computedHash) { ... }

// ✅ ĐÚNG — bcrypt.compare tự dùng constant-time internally
const isValid = await bcrypt.compare(rawToken, storedHash);

// Hoặc dùng crypto.timingSafeEqual nếu so sánh buffer
import { timingSafeEqual } from 'crypto';
const a = Buffer.from(token);
const b = Buffer.from(storedToken);
if (a.length === b.length && timingSafeEqual(a, b)) { ... }
```

---

### RULE 27 — Không cache response API nhạy cảm
**Severity: MEDIUM**

```ts
// apps/backend/auth/auth.controller.ts
@Get('me')
@Header('Cache-Control', 'no-store, no-cache, must-revalidate')
@Header('Pragma', 'no-cache')
async getMe(@CurrentUser() user: User) { ... }

@Post('login')
@Header('Cache-Control', 'no-store')
async login(...) { ... }
```

```nginx
# docker/nginx/nginx.conf — không cache /api/* responses
location /api/ {
  proxy_pass http://backend:3001;
  proxy_no_cache 1;
  proxy_cache_bypass 1;
  add_header Cache-Control "no-store" always;
}
```

---

### RULE 28 — Referrer-Policy: strict-origin
**Severity: LOW**  
**Trạng thái hiện tại: ✅ Đã có trong Nginx — KHÔNG được xóa**

```nginx
# docker/nginx/nginx.conf — đã có, giữ nguyên
add_header Referrer-Policy "strict-origin" always;

# Giải thích:
# strict-origin → chỉ gửi domain, không gửi path/query
# Ngăn URL nội bộ (có thể chứa token trong query string) bị leak sang bên thứ 3
```

---

### RULE 29 — Validate password complexity ở server
**Severity: MEDIUM**

```ts
// apps/backend/users/dto/create-student.dto.ts
import { IsString, MinLength, Matches } from 'class-validator';

export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'Mật khẩu phải có chữ thường, chữ hoa, và số' }
  )
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}

// ❌ KHÔNG chỉ validate ở frontend với regex trong React
// Backend PHẢI validate lại dù frontend đã check
```

---

### RULE 30 — Quét Docker images trước khi deploy
**Severity: HIGH**

```yaml
# .github/workflows/ci.yml — THÊM trước bước deploy
- name: Scan Docker Image — Backend
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'azubi-backend:${{ github.sha }}'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail CI nếu có vulnerability CRITICAL/HIGH

- name: Scan Docker Image — Frontend
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'azubi-frontend:${{ github.sha }}'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

```dockerfile
# apps/backend/Dockerfile và apps/frontend/Dockerfile
# ❌ SAI — unpinned, sẽ tự update và có thể có vulnerability mới
FROM node:latest
FROM node:20-alpine

# ✅ ĐÚNG — pin version cụ thể, biết chính xác image nào đang chạy
FROM node:20.11.0-alpine3.19
```

---

