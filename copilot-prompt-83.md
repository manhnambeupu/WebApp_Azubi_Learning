❯ ## 📋 Prompt 83: Phase 11.4 - Fix Lỗi Mất Bộ Đếm Bài Học (Lesson Counter)

  ```text
  ❯ Tình trạng: Sau khi áp dụng React Suspense (Prompt 80), file `page.tsx` đã bị mất quyền truy cập vào mảng dữ liệu `lessons` (vì dữ liệu đã được chuyển xuống component con `StudentLessonsListFetcher`). Hậu quả là Copilot đã hard-code dòng chữ "Đang đồng bộ lộ trình" thay vì hiển thị số lượng bài học thực tế.

  YÊU CẦU DÀNH CHO COPILOT THỰC THI CHUẨN XÁC:

  1. Tạo mới một Client Component: `apps/frontend/components/student/student-lesson-counter-badge.tsx`
  2. Nội dung Component này:
     - Khai báo `"use client";`
     - Import và gọi Hook: `const { data, isLoading } = useGetStudentLessons();`
     - Render ra cái Badge hiển thị số lượng. Nếu `isLoading` thì trả về dòng chữ "Đang đồng bộ lộ trình". Nếu có `data` thì trả về dòng chữ "Đang có {data.length} bài học". Nhớ giữ nguyên style CSS tuyệt đẹp cũ (border-accent/40, bg-accent/15, và viền shadow glow).
     (Lưu ý: Việc gọi `useGetStudentLessons()` ở đây hoàn toàn không tốn thêm request mạng nào vì React Query sẽ dùng chung Cache với danh sách bên dưới).
  3. Mở file `apps/frontend/app/(student)/student/lessons/page.tsx`:
     - Xóa khối `<div className="inline-flex items-center gap-2 rounded-full border border-accent/40..."> ... Đang đồng bộ lộ trình </div>` bị fix cứng.
     - Import và sử dụng Component `<StudentLessonCounterBadge />` mới tạo vào đúng vị trí đó.
  ```
