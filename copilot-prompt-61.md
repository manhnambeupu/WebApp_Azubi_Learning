❯ ## 📋 Prompt 61: Sửa lỗi 500 Internal Server Error (Lỗi Proxy Next.js trong Docker)

  ```text
  ❯ Nhiệm vụ: Xử lý lỗi 500 khi frontend gọi API trên Codespaces. Vấn đề nằm ở thiết lập Proxy (Rewrites) của Next.js hiện tại: nó đang trỏ về `http://localhost:3001`. Vì Next.js đang chạy *bên trong* container Docker `azubi_frontend`, việc gọi `localhost:3001` nghĩa là nó đang tự gọi lại chính nó (nơi không có backend nào ở cổng 3001), dẫn đến sập kết nối (500).

  YÊU CẦU DÀNH CHO COPILOT THỰC THI (ÁP DỤNG LOCAL/CODESPACES):

  1. Mở file `apps/frontend/next.config.mjs`.
  2. Tìm khối `rewrites()` mà chúng ta đã thêm ở Prompt 59.
  3. Sửa phần `destination` từ `http://localhost:3001/api/:path*` thành đường dẫn nội bộ của Docker Compose là `http://backend:3001/api/:path*`.
     Cụ thể file sẽ thành thế này:
     ```javascript
     /** @type {import('next').NextConfig} */
     const nextConfig = {
       output: 'standalone',
       async rewrites() {
         return [
           {
             source: '/api/:path*',
             destination: 'http://backend:3001/api/:path*',
           },
         ];
       },
     };

     export default nextConfig;
     ```

  SAU KHI LƯU: Bạn chỉ cần khởi động lại container bằng lệnh `docker compose up -d --build frontend`. Bây giờ Proxy sẽ gọi đúng vào cổng 3001 của container `backend` ảo hoá bên cạnh nó, và dữ liệu sẽ thông suốt!
  ```
