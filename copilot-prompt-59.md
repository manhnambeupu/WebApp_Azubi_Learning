❯ ## 📋 Prompt 59: Khắc phục lỗi "Login failed" (Lỗi gọi API từ Frontend trên Codespaces)

  ```text
  ❯ Nhiệm vụ: Xử lý lỗi "Login failed. Please check your credentials and try again." trên Codespaces. Lỗi này KHÔNG phải do mật khẩu sai, mà do trình duyệt web của Codespaces không thể kết nối trực tiếp đến `http://localhost:3001` (Backend). Giải pháp chuyên nghiệp là sử dụng tính năng Rewrites (Proxy) của Next.js để định tuyến (route) toàn bộ các lệnh gọi `/api` từ Frontend tới Backend một cách mượt mà.

  YÊU CẦU DÀNH CHO COPILOT THỰC THI (ÁP DỤNG LOCAL/CODESPACES):

  1. Mở file `apps/frontend/next.config.mjs`:
     - Thêm cấu hình `rewrites` để điều hướng `/api` tới backend:
       ```javascript
       /** @type {import('next').NextConfig} */
       const nextConfig = {
         output: 'standalone',
         async rewrites() {
           return [
             {
               source: '/api/:path*',
               destination: 'http://localhost:3001/api/:path*'
             }
           ]
         }
       };

       export default nextConfig;
       ```

  2. Mở file `apps/frontend/lib/api.ts`:
     - Tìm dòng cấu hình `baseURL` đang là `process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"`.
     - Sửa lại bằng đường dẫn tương đối để nó tự động dùng chung domain của trình duyệt (Next.js proxy sẽ lo phần còn lại):
       ```typescript
       const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";
       ```

  3. Mở file `apps/frontend/src/app/login/page.tsx` (Hoặc đường dẫn tương ứng của trang login, ví dụ `apps/frontend/app/(auth)/login/page.tsx`):
     - Không cần thay đổi gì cả, lỗi sẽ tự biến mất.

  SAU KHI LƯU: Trình duyệt sẽ tự động gọi API tới `/api/auth/login` và Next.js sẽ chuyển nó ngầm giấu vào `http://localhost:3001/api/auth/login` xuyên qua mạng Docker nội bộ. Việc đăng nhập của Admin và Student sẽ thành công 100%!
  ```
