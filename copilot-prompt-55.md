❯ ## 📋 Prompt 55: Tự động khởi tạo biến môi trường (.env) cho GitHub Codespaces

  ```text
  ❯ Nhiệm vụ: Khắc phục lỗi "Missing required environment variables" khi chạy `./dev-start.sh` trên Codespaces. Hiện tại file `.env` được copy từ `.env.example` nhưng các biến bắt buộc lại bị bỏ trống khiến database và bash script báo lỗi.

  YÊU CẦU DÀNH CHO COPILOT THỰC THI CHUẨN XÁC:

  1. Mở file `.devcontainer/devcontainer.json`.
  2. Tìm dòng `"postCreateCommand"` hiện tại của dự án.
  3. Thay thế dòng `"postCreateCommand"` bằng chùm lệnh sau (sử dụng `sed` để tự động điền các giá trị mẫu (dummy data) cho môi trường Dev ngay khi Codespaces vừa tạo xong):
     ```json
     "postCreateCommand": "cp .env.example .env && sed -i 's/^DB_USER=.*/DB_USER=postgres/' .env && sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=postgres/' .env && sed -i 's/^DB_NAME=.*/DB_NAME=azubi/' .env && sed -i 's/^JWT_SECRET=.*/JWT_SECRET=supersecretjwtkey123/' .env && sed -i 's/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=supersecretrefreshkey123/' .env && sed -i 's/^MINIO_USER=.*/MINIO_USER=admin/' .env && sed -i 's/^MINIO_PASSWORD=.*/MINIO_PASSWORD=admin123/' .env && npm install -g pnpm && npm ci --prefix apps/backend && npm ci --prefix apps/frontend"
     ```

  Lưu ý quan trọng: Lệnh trên là 1 chuỗi string dài nằm trên 1 dòng duy nhất để đúng chuẩn file JSON. Sau khi lưu file này, quá trình setup Codespaces sẽ tự động có 1 file `.env` hợp lệ để chạy `./dev-start.sh` mượt mà!
  ```
