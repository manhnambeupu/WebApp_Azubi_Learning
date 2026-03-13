# Business Requirements Document
## Azubi Hospitality — Webapp Bài Tập Học Viên

| | |
|---|---|
| **Dự án** | Hogaprüefung |
| **Phiên bản** | 1.1 — Cập nhật sau review Product Owner |
| **Ngày tạo** | Tháng 3, 2026 |
| **Trạng thái** | ✅ Confirmed — Đã xác nhận các quyết định nghiệp vụ cốt lõi |
| **Người yêu cầu** | Product Owner / Khách hàng |

---

## Lịch sử thay đổi

| Phiên bản | Ngày | Nội dung thay đổi |
|---|---|---|
| 1.0 | Tháng 3, 2026 | Khởi tạo tài liệu. |
| 1.1 | Tháng 3, 2026 | Cập nhật sau review PO: (1) Student được làm lại bài nhiều lần; (2) Admin tạo tài khoản Student; (3) Admin quản lý Category linh hoạt; (4) Tạm thời không phân trang danh sách bài học. Các quyết định này được phản ánh vào Section 2, 3, 5, 6. |

---

## Mục lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Actors & Use Cases](#2-actors--use-cases)
3. [Yêu Cầu Chức Năng](#3-yêu-cầu-chức-năng)
4. [Data Model](#4-data-model--mô-tả-thực-thể)
5. [Quy Tắc Nghiệp Vụ](#5-quy-tắc-nghiệp-vụ-business-rules)
6. [Yêu Cầu Phi Chức Năng](#6-yêu-cầu-phi-chức-năng)
7. [Quyết Định Đã Xác Nhận](#7-quyết-định-đã-xác-nhận)
8. [Bảng Thuật Ngữ](#8-bảng-thuật-ngữ)

---

## 1. Tổng Quan Dự Án

### 1.1 Mục tiêu

Xây dựng một web application cho phép học viên ngành Nhà hàng – Khách sạn (Azubi) thực hành bài tập trực tuyến. Hệ thống phân quyền rõ ràng giữa Admin và Student, hỗ trợ quản lý bài học, câu hỏi, đáp án và theo dõi tiến độ học tập của từng học viên.

### 1.2 Phạm vi (Scope)

**Trong phạm vi:**
- Quản lý tài khoản với hai vai trò: Admin và Student.
- Admin quản lý toàn bộ nội dung: bài học, danh mục, câu hỏi, đáp án, file đính kèm.
- Admin tạo và quản lý tài khoản Student.
- Student xem bài học, làm bài tập (có thể làm lại nhiều lần) và theo dõi trạng thái hoàn thành.

**Ngoài phạm vi (Out of scope):**
- Tự đăng ký tài khoản (Student không tự đăng ký, Admin tạo thay).
- Thanh toán, thông báo email, chat, ứng dụng di động.

### 1.3 Đối tượng sử dụng

| Vai trò | Mô tả | Quyền hạn chính |
|---|---|---|
| **Admin** | Người quản trị nội dung hệ thống | Toàn quyền CRUD bài học, danh mục, câu hỏi, đáp án, file; tạo tài khoản Student |
| **Student** | Học viên tham gia khóa học | Xem bài học, làm và làm lại bài tập, xem kết quả và giải thích |

---

## 2. Actors & Use Cases

### 2.1 Admin

- Đăng nhập vào hệ thống bằng tài khoản Admin.
- Xem Dashboard hiển thị danh sách toàn bộ bài học.
- Tạo bài học mới với đầy đủ thông tin (xem Mục 4 — Data Model).
- Chỉnh sửa thông tin một bài học đã có.
- Xóa bài học (có xác nhận trước khi thực hiện).
- Trong mỗi bài học: thêm, sửa, xóa câu hỏi và đáp án.
- Upload và xóa file Word (`.docx`) đính kèm theo bài học.
- Upload và thay đổi ảnh đại diện của bài học.
- **Quản lý danh mục (Category): thêm, sửa, xóa danh mục linh hoạt.**
- **Tạo tài khoản Student mới (cung cấp email và mật khẩu ban đầu).**

### 2.2 Student

- Đăng nhập vào hệ thống bằng tài khoản do Admin cấp.
- Xem danh sách bài học kèm trạng thái hoàn thành cá nhân.
- Xem chi tiết một bài học: nội dung, file đính kèm.
- Trả lời các câu hỏi trắc nghiệm trong bài học.
- Nộp bài và nhận kết quả kèm giải thích cho từng đáp án.
- **Làm lại bài đã hoàn thành nhiều lần. Kết quả mỗi lần được lưu riêng.**

---

## 3. Yêu Cầu Chức Năng

> **Ký hiệu độ ưu tiên:**
> - 🔴 **Must Have** — Bắt buộc có trong phiên bản đầu tiên.
> - 🟡 **Should Have** — Quan trọng, nên có nhưng có thể defer.
> - 🟢 **Nice to Have** — Có thì tốt, không có cũng được.

---

### 3.1 Xác thực & Phân quyền

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| AUTH-01 | Người dùng đăng nhập bằng email và mật khẩu. | 🔴 Must Have | |
| AUTH-02 | Hệ thống phân biệt hai vai trò Admin và Student. Mỗi vai trò chỉ truy cập được các trang thuộc quyền. | 🔴 Must Have | |
| AUTH-03 | Người dùng có thể đăng xuất khỏi hệ thống. | 🔴 Must Have | |
| AUTH-04 | Sau đăng nhập, Admin chuyển tới Dashboard; Student chuyển tới danh sách bài học. | 🔴 Must Have | |
| **AUTH-05** | **Admin tạo tài khoản Student mới bằng cách nhập email và mật khẩu ban đầu. Không có tính năng tự đăng ký.** | 🔴 Must Have | Quyết định PO v1.1 |

---

### 3.2 Quản lý Danh mục (Admin) *(Mới — v1.1)*

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| **CAT-01** | **Admin xem danh sách tất cả danh mục hiện có.** | 🔴 Must Have | Quyết định PO v1.1 |
| **CAT-02** | **Admin tạo danh mục mới.** | 🔴 Must Have | |
| **CAT-03** | **Admin đổi tên danh mục đã có.** | 🔴 Must Have | |
| **CAT-04** | **Admin xóa danh mục. Hệ thống cảnh báo nếu danh mục đang được gán cho bài học.** | 🟡 Should Have | Tránh xóa gây lỗi FK |

---

### 3.3 Quản lý Bài học (Admin)

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| LES-01 | Admin xem danh sách tất cả bài học trên Dashboard. Mỗi bài học có nút **Chỉnh sửa** và **Xóa**. | 🔴 Must Have | |
| LES-02 | Admin tạo bài học mới với đầy đủ thông tin (xem Mục 4). | 🔴 Must Have | |
| LES-03 | Admin chỉnh sửa toàn bộ thông tin bài học qua trang Edit Lesson. | 🔴 Must Have | |
| LES-04 | Admin xóa bài học. Hệ thống hiển thị hộp thoại xác nhận trước khi xóa. | 🔴 Must Have | Confirm dialog |
| LES-05 | Admin upload ảnh đại diện cho bài học (JPG, PNG). Ảnh mới thay thế ảnh cũ. | 🔴 Must Have | Tối đa 5MB |
| LES-06 | Admin upload một hoặc nhiều file Word (`.docx`) đính kèm theo bài học. | 🔴 Must Have | Tối đa 20MB/file |
| LES-07 | Admin xóa từng file Word đính kèm. | 🔴 Must Have | |
| LES-08 | Nội dung chi tiết bài học được soạn bằng **Markdown Editor** tích hợp trên trang Admin. | 🔴 Must Have | Lưu dạng TEXT trong DB |

---

### 3.4 Quản lý Câu hỏi & Đáp án (Admin)

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| QA-01 | Trên trang Edit Lesson, Admin xem danh sách tất cả câu hỏi của bài học đó. | 🔴 Must Have | |
| QA-02 | Admin thêm câu hỏi mới vào bài học, chọn loại câu hỏi (SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY). | 🔴 Must Have | |
| QA-03 | Admin sửa nội dung câu hỏi, loại câu hỏi và phần giải thích tổng của câu hỏi. | 🔴 Must Have | |
| QA-04 | Admin xóa câu hỏi. Tất cả đáp án liên quan bị xóa theo (cascade). | 🔴 Must Have | Cascade delete |
| QA-05 | Mỗi câu hỏi có nhiều đáp án. Admin thêm, sửa, xóa từng đáp án. (Với loại ESSAY, Admin tạo duy nhất 1 đáp án chứa text bài giải mẫu). | 🔴 Must Have | |
| QA-06 | Mỗi đáp án có: nội dung, đánh dấu đúng/sai, và giải thích riêng (lý do đúng hoặc sai). | 🔴 Must Have | |
| QA-07 | Validate loại câu hỏi: MULTIPLE_CHOICE cần $\ge$ 1 đáp án đúng. SINGLE_CHOICE cần 1 đáp án đúng duy nhất. | 🟡 Should Have | Validate khi lưu |

---

### 3.5 Student — Danh sách bài học

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| STU-01 | Student xem toàn bộ danh sách bài học sau khi đăng nhập (không phân trang). | 🔴 Must Have | Không pagination — PO v1.1 |
| STU-02 | Mỗi bài học hiển thị: ảnh đại diện, tiêu đề, mô tả ngắn, danh mục. | 🔴 Must Have | |
| STU-03 | Mỗi bài học hiển thị badge trạng thái: **Đã hoàn thành / Chưa hoàn thành**. Trạng thái dựa trên lần nộp bài đầu tiên của student (xem BR-01). | 🔴 Must Have | Tính động, không lưu riêng |

---

### 3.6 Student — Chi tiết bài học

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| STU-04 | Student bấm vào bài học để mở trang chi tiết. | 🔴 Must Have | |
| STU-05 | Trang chi tiết render nội dung Markdown thành HTML để hiển thị. | 🔴 Must Have | |
| STU-06 | Student tải xuống các file Word đính kèm của bài học. | 🔴 Must Have | |

---

### 3.7 Student — Làm bài tập

| ID | Mô tả yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| STU-07 | Trang chi tiết bài học hiển thị danh sách tất cả câu hỏi, tự phân luồng UI hiển thị theo `type` (Radio, Checkbox, Text tự luận). | 🔴 Must Have | |
| STU-08 | Student chọn một/nhiều đáp án (dạng trắc nghiệm). Riêng bài tự luận sinh viên không bị bắt buộc text-input. | 🔴 Must Have | |
| STU-09 | Student nộp toàn bộ bài làm một lần. Có thể nộp lại nhiều lần. REST API hỗ trợ mảng `answerIds`. | 🔴 Must Have | Hỏi lại bao lần tùy thích |
| STU-10 | Sau khi nộp, trả về kết quả 100 điểm quy đổi. Partial Scoring chấm điểm từng phần cho Multiple Choice. | 🔴 Must Have | Giao diện Result |
| STU-11 | Các câu ESSAY (tự luận) được highlight vàng, hiển thị thẳng đáp án mẫu để student tự tham khảo. | 🔴 Must Have | Bảo mật — không lộ trước |

---

## 4. Data Model — Mô tả Thực thể

### 4.1 User (Tài khoản)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính, tự sinh. |
| `email` | String | Có | Email đăng nhập. Duy nhất trong hệ thống. |
| `password` | String | Có | Mật khẩu đã được hash (bcrypt). |
| `full_name` | String | Có | Họ và tên đầy đủ. |
| `role` | Enum | Có | `ADMIN` hoặc `STUDENT`. |
| `created_at` | DateTime | Có | Thời điểm tạo tài khoản. |

---

### 4.2 Category (Danh mục)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `name` | String | Có | Tên danh mục. Ví dụ: Buồng phòng, Ẩm thực, Lễ tân. |

---

### 4.3 Lesson (Bài học)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `title` | String | Có | Tiêu đề bài học. |
| `summary` | String | Có | Mô tả ngắn (tối đa ~200 ký tự). Hiển thị ở danh sách. |
| `content_md` | Text | Có | Nội dung chi tiết dạng Markdown. Render thành HTML trên trang chi tiết. |
| `image_url` | String | Không | URL ảnh đại diện sau khi upload. |
| `category_id` | UUID (FK) | Có | Tham chiếu tới bảng `Category`. |
| `created_at` | DateTime | Có | Thời điểm tạo. |
| `updated_at` | DateTime | Có | Thời điểm cập nhật gần nhất. |

---

### 4.4 LessonFile (File đính kèm)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `lesson_id` | UUID (FK) | Có | Bài học mà file này thuộc về. |
| `file_name` | String | Có | Tên file hiển thị cho student. |
| `file_url` | String | Có | Đường dẫn file đã lưu trữ. |
| `uploaded_at` | DateTime | Có | Thời điểm upload. |

---

### 4.5 Question (Câu hỏi)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `lesson_id` | UUID (FK) | Có | Bài học chứa câu hỏi này. |
| `text` | Text | Có | Nội dung câu hỏi. |
| `explanation` | Text | Không | Giải thích tổng sau khi student nộp bài. |
| `order_index` | Integer | Có | Thứ tự hiển thị câu hỏi trong bài học. |

---

### 4.6 Answer (Đáp án)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `question_id` | UUID (FK) | Có | Câu hỏi mà đáp án này thuộc về. |
| `text` | Text | Có | Nội dung đáp án. |
| `is_correct` | Boolean | Có | `TRUE` nếu đây là đáp án đúng. |
| `explanation` | Text | Không | Giải thích tại sao đáp án này đúng hoặc sai. Chỉ trả về sau khi student nộp bài. |

---

### 4.7 Submission (Bài làm của Student)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | Có | Khóa chính. |
| `user_id` | UUID (FK) | Có | Student thực hiện bài làm. |
| `question_id` | UUID (FK) | Có | Câu hỏi được trả lời. |
| `answer_id` | UUID (FK) | Có | Đáp án student đã chọn. |
| `is_correct` | Boolean | Có | Kết quả đúng/sai, lưu tại thời điểm nộp. |
| `submitted_at` | DateTime | Có | Thời điểm nộp bài. |
| **`attempt_number`** | **Integer** | **Có** | **Lần làm thứ mấy. Bắt đầu từ 1, tăng dần mỗi lần student nộp lại.** |

> **Lưu ý thiết kế (v1.1):** Mỗi lần student nộp bài tạo ra một tập `Submission` mới với `attempt_number` tăng dần. Toàn bộ lịch sử được giữ lại. Trạng thái "Đã hoàn thành" chỉ phụ thuộc vào lần nộp đầu tiên (`attempt_number = 1`) — xem BR-01.

---

## 5. Quy Tắc Nghiệp Vụ (Business Rules)

### BR-01 — Trạng thái hoàn thành bài học *(Cập nhật v1.1)*

Bài học được coi là **"Đã hoàn thành"** ngay sau khi student nộp bài **lần đầu tiên** (`attempt_number = 1`) và có `Submission` cho tất cả câu hỏi của bài học đó.

Trạng thái này **không thay đổi** dù student làm lại bài bao nhiêu lần sau đó. Tính toán động khi tải danh sách, không lưu thành trường riêng.

```
isCompleted = tồn tại ít nhất 1 lần nộp (attempt_number = 1)
              với đủ số câu hỏi của bài học
```

### BR-02 — Ẩn giải thích trước khi nộp

Trường `explanation` của `Answer` và `Question` **KHÔNG** được trả về trong API chi tiết bài học khi student đang làm bài. Chúng chỉ xuất hiện trong response của API nộp bài (`/submit`), sau khi hệ thống đã ghi nhận `Submission`.

### BR-03 — Tính toàn vẹn câu hỏi

- Câu hỏi SINGLE_CHOICE phải có $\ge$ 2 đáp án và đúng 1 đáp án `is_correct = TRUE`.
- Câu hỏi MULTIPLE_CHOICE phải có $\ge$ 2 đáp án và $\ge$ 1 đáp án `is_correct = TRUE`.
- Câu hỏi ESSAY chỉ cần tạo 1 đáp án đóng vai trò chứa đoạn Text (Bài giải mẫu), đáp án này mặc định `is_correct = TRUE`.
Hệ thống từ chối lưu nếu vi phạm quy tắc này.

### BR-04 — Xóa bài học (Cascade)

Khi Admin xóa một bài học, toàn bộ dữ liệu liên quan bị xóa theo: `LessonFile`, `Question`, `Answer`, toàn bộ `Submission` (mọi lần nộp) của học viên. Hệ thống hiển thị cảnh báo rõ ràng trước khi thực hiện.

### BR-05 — Logic Chấm Điểm (Scoring)

Student được chọn 1 đáp án (Radio) đối với SINGLE_CHOICE, hoặc chọn nhiều đáp án (Checkbox) đối với MULTIPLE_CHOICE. 
- **SINGLE_CHOICE**: Đúng trọn vẹn được 1 điểm. Sai được 0 điểm.
- **MULTIPLE_CHOICE (Partial Scoring)**: Giả sử N đáp án đúng. Mỗi tùy chọn đúng cộng `1/N` điểm. Nếu tick vào đáp án sai -> Toàn câu 0 điểm.
- **ESSAY**: Không được tính vào tổng điểm tự động. Mở khóa đáp án mẫu sau khi nộp.

### BR-06 — Xóa danh mục có bài học đang dùng *(Mới — v1.1)*

Admin không thể xóa một `Category` đang được gán cho một hoặc nhiều bài học. Hệ thống hiển thị cảnh báo và yêu cầu Admin chuyển các bài học sang danh mục khác trước.

---

## 6. Yêu Cầu Phi Chức Năng

| Hạng mục | Yêu cầu |
|---|---|
| **Hiệu năng** | Trang danh sách bài học (hiển thị tất cả, không phân trang) tải trong dưới 2 giây với 50 bài học trên kết nối LAN nội bộ. |
| **Bảo mật** | API yêu cầu xác thực JWT. Đáp án đúng và giải thích không được lộ ra client trước khi nộp bài. |
| **Upload file** | Giới hạn tối đa 20MB mỗi file Word. Ảnh tối đa 5MB. Chỉ chấp nhận định dạng `.docx`, `.jpg`, `.png`. |
| **Khả năng mở rộng** | Hỗ trợ tối thiểu 50 người dùng đồng thời trên phần cứng 4GB RAM. |
| **Responsive** | Giao diện hoạt động tốt trên desktop và tablet. Mobile là ưu tiên phụ. |
| **Phân trang** | Phiên bản hiện tại hiển thị toàn bộ danh sách bài học một lần, không phân trang. Có thể bổ sung trong phiên bản sau nếu số lượng bài học tăng đáng kể. |

---

## 7. Quyết Định Đã Xác Nhận

> Section này ghi lại các câu hỏi mở từ v1.0 đã được Product Owner xác nhận. Không còn câu hỏi tồn đọng tại thời điểm v1.1.

| # | Câu hỏi ban đầu | Quyết định | Ảnh hưởng tới |
|---|---|---|---|
| 1 | Student có được làm lại bài đã hoàn thành không? | ✅ **Có.** Student được làm lại nhiều lần. Trạng thái "Đã hoàn thành" giữ nguyên sau lần nộp đầu tiên, không bị reset. | BR-01, STU-09, Submission schema (thêm `attempt_number`) |
| 2 | Admin hay Student tự đăng ký tài khoản? | ✅ **Admin tạo.** Không có tính năng tự đăng ký cho Student. | AUTH-05, Section 1.2, Section 2.1 |
| 3 | Category cố định hay Admin quản lý? | ✅ **Admin quản lý linh hoạt** (thêm/sửa/xóa). | CAT-01 đến CAT-04, BR-06 (mới) |
| 4 | Có phân trang danh sách bài học không? | ✅ **Chưa cần.** Hiển thị tất cả một lần. Có thể bổ sung sau. | STU-01, Section 6 |

---

## 8. Bảng Thuật Ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Submission** | Bản ghi lưu câu trả lời của một Student cho một câu hỏi cụ thể trong một lần nộp bài. |
| **attempt_number** | Số thứ tự lần nộp bài của student cho một bài học. Bắt đầu từ 1, tăng dần mỗi lần làm lại. |
| **Markdown** | Định dạng văn bản thuần cho phép định dạng nội dung (tiêu đề, in đậm, bảng...) mà không cần viết HTML. |
| **Dashboard** | Trang tổng hợp dành cho Admin, hiển thị danh sách bài học và các nút quản lý. |
| **Cascade delete** | Khi xóa một bản ghi cha, toàn bộ bản ghi con liên quan cũng tự động bị xóa theo. |
| **JWT** | JSON Web Token — chuẩn xác thực không trạng thái (stateless), dùng để bảo vệ các API endpoint. |
| **Single-choice** | Dạng câu hỏi chỉ cho phép chọn một đáp án duy nhất (khác với multiple-choice). |

---

*Tài liệu được cập nhật theo từng buổi review với Product Owner. Mọi thay đổi yêu cầu được ghi nhận vào bảng Lịch sử thay đổi ở đầu tài liệu.*
