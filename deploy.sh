#!/bin/bash

echo "🚀 Bắt đầu quá trình Deploy Azubi Webapp (Zero Trust Architecture)..."

# 1. Kiểm tra môi trường Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Lỗi: Docker chưa được cài đặt hoặc chưa chạy trên máy chủ này!"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Lỗi: Docker Compose Plugin chưa được cài đặt!"
    exit 1
fi

# 2. Kiểm tra file cấu hình .env
if [ ! -f ".env" ]; then
    echo "❌ Lỗi: Không tìm thấy file '.env'!"
    echo "💡 Hướng dẫn:"
    echo "   Vui lòng copy file .env.production.example thành .env:"
    echo "   cp .env.production.example .env"
    echo "   Sau đó điền đầy đủ các thông số an toàn, ĐẶC BIỆT chú ý điền 'CLOUDFLARE_TOKEN'."
    exit 1
fi

# 3. Dọn dẹp máy chủ (Prune) để giải phóng dung lượng ổ cứng
echo "🧹 Đang dọn dẹp các image lơ lửng, container rác..."
docker system prune -f

# 4. Triển khai hệ thống
echo "🏗️ Đang build và khởi chạy hệ thống (với docker-compose.prod.yml)..."
docker compose -f docker-compose.prod.yml up -d --build

# 5. Thông báo kết quả
if [ $? -eq 0 ]; then
    echo "✅ Quá trình Deploy hoàn tất!"
    echo "🌐 Các Container đang chạy ảo không mở port. Bạn hãy truy cập vào Cloudflare Zero Trust Dashboard để thiết lập Public Hostname trỏ về 'http://nginx:80'."
else
    echo "❌ Bị lỗi trong quá trình khởi tạo container. Vui lòng kiểm tra lại log."
fi
