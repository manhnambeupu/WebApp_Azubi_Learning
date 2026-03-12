# Kế hoạch Tổ Chức Màu Sắc & UI cho Azubi Webapp

## 1. Có nên dùng thêm thư viện bên ngoài không?
**Câu trả lời là: KHÔNG NÊN.**
Dự án của bạn hiện tại đã sử dụng **Next.js**, **Tailwind CSS**, và **shadcn/ui**. Đây là một Stack cực kỳ mạnh mẽ, linh hoạt và đang là tiêu chuẩn của ngành (industry standard). Việc cài thêm các thư viện UI khác (như Bootstrap, Material UI, Ant Design) sẽ làm:
- Nặng dự án (bundle size tăng).
- Gây xung đột CSS (giữa Tailwind và các CSS thuần của thư viện khác).
- Phá vỡ tính nhất quán (UI Inconsistency).

Bạn chỉ nên sử dụng thêm **Framer Motion** nếu thật sự cần các hiệu ứng animation phức tạp, còn lại Tailwind CSS và shadcn/ui hoàn toàn đủ để build giao diện ở mức độ "Enterprise".

## 2. Chiến lược Tổ Chức Màu Sắc
Đối với một hệ thống E-Learning và Thi cử/Làm bài tập, màu sắc cần phục vụ mục đích **Tập trung, Khích lệ, và Định hướng trạng thái**.

### Bảng màu cốt lõi (Core Palette)
* **Primary Color (Màu chủ đạo):** Nên chọn màu **Xanh Tím (Indigo)** hoặc **Xanh Dương (Blue)**. Tone màu này tạo cảm giác chuyên nghiệp, thông minh, tĩnh tâm – rất phù hợp với giáo dục / bài kiểm tra. (Ví dụ: `indigo-600` cho button, `indigo-50/100` cho background).
* **Success Color (Màu thành công / Đúng):** **Xanh Lá Cây (Emerald/Green)**. Đại diện cho lựa chọn đúng, bài tập hoàn thành thành công.
* **Danger/Error Color (Màu thất bại / Sai):** **Đỏ / Hồng Đậm (Rose/Red)**. Dùng khi chọn sai đáp án, xóa dữ liệu, khóa tài khoản.
* **Warning/Pending Color (Màu cảnh báo / Đang chờ):** **Vàng cam (Amber/Yellow)**. Dùng cho các câu Tự luận chưa được tự động chấm điểm, hoặc trạng thái "Đang làm bài".
* **Background & Surface (Nền):** Sử dụng dải màu **Slate** hoặc **Zinc** để tạo giao diện sạch sẽ (clean interface). 
  - Nền trang (Background): `slate-50` hoặc `slate-100`.
  - Nền khối (Card/Container): `white` tạo độ tương phản.
  - Chữ (Text): `slate-900` cho text chính, `slate-500` cho text phụ.

### Phân rã cho Admin UI vs Student UI
* **Admin UI:** Cần sự **Gọn gàng, Dày đặc dữ liệu (Dense), và Phân cấp rõ ràng**. 
  - Sidebar nền tối (`slate-950`) chữ trắng.
  - Bảng dữ liệu (Table) có `hover:bg-slate-50`, xen kẽ màu nền cho dễ đọc.
  - Các nút hành động (Thêm/Sửa/Xóa) dùng màu sắc Primary, Secondary, Destructive chuẩn của shadcn.
* **Student UI:** Cần sự **Thoáng đãng, Ít phân tâm, Thân thiện và Tập trung vào nội dung học**.
  - Background tổng thể màu xám cực nhạt (`bg-slate-50`), nội dung bài học/bài thi nằm gọn trong các Card trắng (`bg-white`) có bo góc lớn (`rounded-xl` hoặc `rounded-2xl`) kèm `shadow-sm`.
  - Nút bấm to hơn, typography rõ ràng, khoảng cách dòng (leading) rộng rãi để chống mỏi mắt khi đọc dài.
  - Màu trạng thái xanh/đỏ thể hiện rõ ràng ngay khi báo điểm.

---

## 3. Các Prompt cho GitHub Copilot
Để Copilot xử lý mà không bị quá tải context, ta chia nhỏ công việc thành **4 Prompts**. Bạn hãy copy lần lượt từng prompt đưa cho Copilot chạy.

### 📋 Prompt 30: System Color Palette & Globals (Cài đặt hệ thống màu)
```text
❯ Nhiệm vụ: Cập nhật hệ thống màu sắc (Color Palette) toàn cục cho ứng dụng sử dụng Tailwind CSS + shadcn/ui để tối ưu cho hệ thống E-Learning.

HIỆN TẠI:
Các màu trong `apps/frontend/app/globals.css` đang thiết lập mặc định (đen/trắng).

YÊU CẦU DÀNH CHO COPILOT:
1. Mở file `apps/frontend/app/globals.css`.
2. Hãy cấu hình lại các biến CSS trong `:root` theo chuẩn màu E-learning chuyên nghiệp:
   - Primary: Chuyển sang tone màu Indigo hiện đại (ví dụ, đổi sang giá trị HSL của màu Tailwind `indigo-600` là `243 75% 59%`). Đảm bảo `primary-foreground` là trắng.
   - Background: Chuyển sang tone màu nhẹ của Slate (`bg-slate-50`: HSL `210 40% 98%`).
   - Card/Popover: Đưa về màu trắng tinh (HSL `0 0% 100%`).
   - Muted: Nhấn nhá một xíu slate (`210 40% 96.1%`).
   - Destructive: Sử dụng tone Rose (`346 87% 43%`).
   - Giữ nguyên cấu trúc biến CSS của shadcn.
3. Nếu app có hỗ trợ chế độ dark mode (`.dark`), hãy chỉnh tone primary tệp với màu sáng hơn chút để nổi bật trên nền tối.
4. Mở file `tailwind.config.ts`, đảm bảo cấu trúc màu khớp hoàn toàn. (Không cần cài thêm thư viện nào).

Verify:
- Mở web browser, toàn bộ App phải chuyển sang tone màu Primary mới (Indigo/Blue chuyên nghiệp). Nền web chuyển sang xám nhạt (Slate 50) nhẹ nhàng thay vì trắng toát.
```

### 📋 Prompt 31: Admin UI Refinement (Tối ưu Giao diện Admin)
```text
❯ Nhiệm vụ: Tối ưu UI cho phần Admin nhằm tạo bảng điều khiển (Dashboard) gọn gàng, rõ ràng, dễ thao tác CRUD, chuẩn Enterprise.

YÊU CẦU DÀNH CHO COPILOT:
1. Mở các Layout và Component chính của Admin (`apps/frontend/app/admin/layout.tsx`, danh sách Lesson/Category...).
2. Cập nhật Sidebar (nếu có): Thêm background tối (`bg-slate-950`) với chữ xám/trắng cho các menu, khi hover có highlight (`bg-slate-800 text-white`). 
3. Layout phần thân (Main Content): Để nền `bg-slate-50`, phần nội dung bảng/thêm mới nằm gọn trong thẻ Card (`bg-white rounded-lg shadow-sm border`). 
4. Bảng biểu (Tables/DataGrid): Cập nhật style cho bảng (thêm thẻ Table của shadcn hoặc style tương tự), header có nền xám nhẹ (`bg-slate-100/50`), hover các dòng mượt mà.
5. Buttons: Đảm bảo các nút "Thêm mới" là `variant="default"` (Primary Indigo), các nút Sửa là `variant="outline"`, nút Xóa là `variant="destructive"`.
6. Giữ tính nhất quán về margin/padding (`p-6` cho card, `space-y-4` cho forms).

Verify:
- Trang Admin trở nên tách bạch, thanh điều hướng riêng biệt, phần nội dung quản lý sáng sủa, bảng biểu rộng rãi và trực quan.
```

### 📋 Prompt 32: Student UI Refinement (Tối ưu Giao diện Học sinh)
```text
❯ Nhiệm vụ: Tối ưu UI cho học sinh (Student View) tập trung vào bài giảng và bài làm quiz, ưu tiên sự tập trung, chống mỏi mắt và phản hồi tốt.

YÊU CẦU DÀNH CHO COPILOT:
1. Mở Layout Student (`apps/frontend/app/student/layout.tsx`) và các trang danh sách/bài học (`apps/frontend/components/student/...`).
2. Layout tổng thể học sinh: Sidebar sáng màu (`bg-white`), Header rõ ràng. Khu vực nội dung bài học dùng `max-w-4xl mx-auto` để giới hạn độ rộng đọc text (chống mỏi mắt).
3. Thẻ Bài học (Lesson Cards): Tăng bo góc `rounded-xl`, hover có hiệu ứng nổi lên (`transition-transform hover:-translate-y-1 hover:shadow-md`). 
4. Giao diện bài test (Quiz Form): Các câu trả lời (`<Label>`) khi hover cần có nền xám sáng (`hover:bg-slate-50`), thêm hiệu ứng chuyển mượt `transition-colors`.
5. Thanh tiến độ (Progress Bar): Tô điểm rõ ràng, sử dụng màu Primary của hệ thống.
6. Kết quả bài test (Quiz Result): Đảm bảo các feedback màu (Đúng = Emerald, Sai = Rose) hiển thị rõ rệt không bị chìm nghỉm, bo góc mềm mại.

Verify:
- Giao diện Student trông "Friendly" hơn rất nhiều. Các thẻ (Cards) nổi nổi, màu sắc bắt mắt và rất tập trung vào bài học.
```

### 📋 Prompt 33: Typography & Interactive States (Hoàn thiện Trải nghiệm UX)
```text
❯ Nhiệm vụ: Cải thiện Typography và các trạng thái tương tác (Hover, Focus, Active, Disabled) cho toàn bộ web app.

YÊU CẦU DÀNH CHO COPILOT:
1. Mở tệp CSS gốc (`globals.css`) và các Typography classes dùng trong hệ thống.
2. Form Input & Focus: Đảm bảo tất cả Input, Select, Textarea, Button khi focus đều hiện vòng ring rực rỡ (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`), giúp người học dùng bàn phím dễ dàng.
3. Nội dung Markdown (`.student-markdown`): 
   - Tối ưu khoảng cách dòng (`leading-relaxed` hoặc `leading-loose`).
   - Tùy chỉnh màu text cho dễ đọc thay vì đen kịt (`text-slate-800` hoặc `text-foreground/90`).
   - Khối Code (Blockquote, Pre): Backgound tinh tế, bo góc mềm, có icon nếu được.
4. Nút bấm Disabled: Tăng độ xám, cursor `not-allowed`, opacity giảm (`opacity-50`) trên tất cả các form (khi đang submit dữ liệu).
5. Animations: Phủ thêm global class `transition-all duration-200` vào các components tương tác nhiều (cards, list items).

Verify:
- Cảm giác khi click chuột, dùng phím Tab chuyển qua lại các ô input rất trơn tru, chữ trong bài học đọc êm mắt hơn.
```
