❯ ## 📋 Prompt 60: Xóa bỏ xung đột CORS trong Docker Compose

  ```text
  ❯ Nhiệm vụ: Khắc phục lỗi CORS "Same Origin" trên Codespaces. Lỗi xảy ra do mặc dù chúng ta đã cài đặt Next.js Proxy (Rewrites), nhưng file `docker-compose.yml` lại đang chèn cứng (hard-code) biến môi trường `NEXT_PUBLIC_API_URL: http://localhost:3001/api` vào container Frontend. Biến này đè lên cấu hình cục bộ, ép trình duyệt phải gọi thẳng sang cổng 3001 gây lỗi bảo mật CORS.

  YÊU CẦU DÀNH CHO COPILOT THỰC THI (ÁP DỤNG LOCAL/CODESPACES):

  1. Mở file `docker-compose.yml`.
  2. Tìm đến service `frontend:`.
  3. Xoá dòng chứa `NEXT_PUBLIC_API_URL`. Nếu service `frontend:` chỉ có mỗi biến này trong phần `environment:`, thì xóa luôn cả chữ `environment:` đi cho gọn. Cụ thể, thay đổi từ:
     ```yaml
     frontend:
       build:
         context: ./apps/frontend
         dockerfile: Dockerfile.dev
       container_name: azubi_frontend
       environment:
         NEXT_PUBLIC_API_URL: http://localhost:3001/api
       ports:
         - "3000:3000"
     ```
     Thành:
     ```yaml
     frontend:
       build:
         context: ./apps/frontend
         dockerfile: Dockerfile.dev
       container_name: azubi_frontend
       ports:
         - "3000:3000"
     ```

  4. Mở file `apps/frontend/lib/api.ts`:
     - Kiểm tra lại hàm cấu hình baseURL. Đảm bảo nó ưu tiên dùng `/api` làm giá trị mặc định cho proxy hoạt động, bằng cách đổi thành:
       ```typescript
       // Nếu có NEXT_PUBLIC_API_URL thì dùng (cho lúc build tĩnh), KHÔNG CÓ thì dùng "/api" (để chạy proxy)
       const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";
       ```

  SAU KHI LƯU: Bạn chỉ cần khởi động lại container bằng lệnh `docker compose up -d --build frontend`. Lệnh gọi API lúc này sẽ ở dạng tương đối (chỉ hiện `/api/auth/login` trên tab Network) và tự động lọt qua Proxy Next.js tới Backend mà không dính CORS!
  ```
