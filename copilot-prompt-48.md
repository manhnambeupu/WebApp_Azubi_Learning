❯ ## 📋 Prompt 48: P0 Security - Khắc phục Logout giả & Chặn Brute-force

  ```text
  ❯ Nhiệm vụ: Hệ thống dự án đang bị 2 lỗ hổng P0 cực kỳ nguy hiểm đã được audit trong file SECURITY_RULES.md.
  1. Logout giả mạo (Rule 25 + 03): Refresh token hiện tại không lưu ở Database nên server không hủy được phiên làm việc khi user logout. Hậu quả là token vẫn sống 7 ngày.
  2. Brute-force account (Rule 18): Hệ thống không khóa tài khoản khi hacker dò password liên tục.

  YÊU CẦU DÀNH CHO COPILOT THỰC THI NGAY LẬP TỨC:

  1. Cập nhật Prisma Schema (`apps/backend/prisma/schema.prisma`):
     - Mở model `User`, bổ sung 3 thuộc tính sau:
       ```prisma
       refreshTokenHash String?
       failedLoginCount Int       @default(0)
       lockedUntil      DateTime?
       ```
     - Sau khi thêm, mở terminal ở thư mục `apps/backend` chạy lệnh: `npx prisma migrate dev --name p0_security_auth`

  2. Cập nhật Auth Service (`apps/backend/src/auth/auth.service.ts`):
     - **Trong hàm `login`**: 
       * Kiểm tra nếu `lockedUntil` > thời gian hiện tại thì ném ra `UnauthorizedException('Tài khoản bị khóa. Thử lại sau X phút.')`.
       * Nếu sai password, tăng `failedLoginCount` lên 1. Nếu `failedLoginCount >= 5`, set `lockedUntil` thành 15 phút sau.
       * Nếu đúng password, reset `failedLoginCount = 0` và `lockedUntil = null`.
       * Sinh token (Access + Refresh). Sinh ra cặp mới thì BẮT BUỘC phải dùng `bcrypt.hash(newRefreshToken, 12)` và lưu hash vào field `refreshTokenHash` trong DB của user đó.
     - **Trong hàm `refresh`**:
       * Truy vấn User. Nếu `user.refreshTokenHash` là null, ném `UnauthorizedException()`.
       * Dùng `bcrypt.compare` để đối chiếu refresh token gửi lên với hash trong DB.
       * Nếu đúng, Sinh ra cặp Access + Refresh mới, hash refresh token mới (cost 12), lưu vào DB, trả về client.
     - **Tạo hàm `logout` (hoặc sửa ở controller)**:
       * Cập nhật `refreshTokenHash: null` trong DB cho UserId đó.
       * Clear cookie refreshToken ở client (thuộc tính httpOnly, sameSite, path). (Việc clear cookie thông thường đã có ở AuthController, bạn chỉ cần gọi Prisma set null hash).
  
  Lưu ý: Bạn không được quên `await bcrypt.hash(..., 12)` với tham số cost là 12 (đáp ứng Rule 12).
  ```