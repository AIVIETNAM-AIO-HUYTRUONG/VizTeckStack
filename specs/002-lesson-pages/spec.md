# Feature Specification: Lesson Editor Enhancements

**Feature Branch**: `002-lesson-pages`

**Created**: 2026-06-30

**Status**: Draft

**Input**: Thêm kéo thả block trong lesson như Notion, icon/cover/mục lục, và chia sẻ trang theo user với phân quyền.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kéo thả block trong lesson (Priority: P1)

Content editor có thể kéo thả bất kỳ block nào trong lesson lên hoặc xuống để sắp xếp lại thứ tự nội dung, giống như Notion.

**Why this priority**: Cốt lõi của trải nghiệm soạn thảo. Hiện tại nội dung lesson chỉ có thể thêm vào cuối hoặc xóa — không thể sắp xếp lại linh hoạt.

**Independent Test**: Editor mở một lesson có 5 blocks (heading, paragraph, image, bullet list, code block), kéo code block lên trên heading, reload trang — thứ tự mới vẫn được lưu.

**Acceptance Scenarios**:

1. **Given** lesson đang mở trong editor, **When** editor hover vào bất kỳ block nào, **Then** hiện handle kéo (⠿) ở cạnh trái của block
2. **Given** handle kéo đang hiển thị, **When** editor kéo block đó lên hoặc xuống, **Then** có đường chỉ vị trí (drop indicator) cho thấy block sẽ đặt ở đâu
3. **Given** block được thả vào vị trí mới, **When** editor dừng kéo, **Then** block xuất hiện đúng vị trí ngay lập tức và thứ tự được lưu
4. **Given** một block toggle/accordion đang có nội dung con bên trong, **When** editor kéo block toggle đó, **Then** toàn bộ nội dung con di chuyển cùng với block cha
5. **Given** editor kéo block và thả ra ngoài vùng hợp lệ, **When** thả chuột, **Then** block trở về vị trí cũ và không có thay đổi nào được lưu

---

### User Story 2 - Icon, Cover và Mục lục (Priority: P2 → thực hiện sau P1)

Mỗi lesson có thể có icon emoji và ảnh cover đặt ở đầu trang. Editor có thể thêm block "Table of Contents" tự động tạo danh sách các heading có thể click để điều hướng trong bài.

**Why this priority**: Cải thiện nhận diện và điều hướng trong lesson. Icon và cover đã tồn tại một phần trong hệ thống — tính năng này hoàn thiện trải nghiệm và thêm TOC.

**Independent Test**: Editor thêm icon 📚 và cover image cho một lesson, sau đó thêm block TOC vào bài có 3 headings — TOC liệt kê đúng 3 heading với anchor links click được.

**Acceptance Scenarios**:

1. **Given** lesson đang mở trong editor, **When** editor nhấn vào vùng icon phía trên tiêu đề, **Then** hiện emoji picker để chọn icon cho lesson
2. **Given** lesson đang mở, **When** editor nhấn "Add cover", **Then** có thể upload ảnh hoặc dán URL để đặt làm ảnh bìa phía trên icon và tiêu đề
3. **Given** lesson có ít nhất một H1/H2/H3 heading, **When** editor thêm block "Table of Contents", **Then** TOC tự tạo danh sách link đến từng heading theo thứ tự trong bài
4. **Given** TOC block đang tồn tại, **When** một heading được thêm hoặc xóa, **Then** TOC cập nhật tự động trong vòng 1 giây
5. **Given** learner xem lesson ở chế độ view, **When** nhấn vào một mục trong TOC, **Then** trang cuộn đến đúng heading đó

---

### User Story 3 - Chia sẻ trang với phân quyền theo user (Priority: P3 → thực hiện sau P2)

Admin có thể mời người dùng cụ thể bằng email và cấp quyền xem hoặc chỉnh sửa từng lesson. Người được mời phải đăng nhập mới truy cập được.

**Why this priority**: Cho phép chia sẻ nội dung có kiểm soát với học sinh hoặc đồng nghiệp. Phụ thuộc vào User Management System chưa tồn tại — là dependency lớn nhất.

**Scope note**: US3 yêu cầu **User Management System** hoàn chỉnh (tài khoản, đăng nhập, nhóm, email invitation) chưa có trong hệ thống. Cần xây prerequisite này trước.

**Independent Test**: Admin mời bob@example.com với quyền "Can view" vào lesson "React Hooks". Bob đăng ký tài khoản qua email mời, đăng nhập, xem được nội dung nhưng không thể chỉnh sửa.

**Acceptance Scenarios**:

1. **Given** admin đang xem lesson, **When** nhấn nút "Share", **Then** hiện panel cho phép nhập email và chọn quyền (Can view / Can edit)
2. **Given** email được mời chưa có tài khoản, **When** admin gửi lời mời, **Then** người đó nhận email với link đăng ký tài khoản
3. **Given** user đã có tài khoản và được mời với "Can view", **When** họ đăng nhập và mở lesson, **Then** xem được nội dung nhưng không thể sửa
4. **Given** user được mời với "Can edit", **When** họ đăng nhập và mở lesson, **Then** họ có thể chỉnh sửa nội dung lesson đó
5. **Given** admin thu hồi quyền của một user, **When** user đó cố truy cập lesson, **Then** thấy thông báo "Bạn không có quyền truy cập trang này"
6. **Given** lesson được chia sẻ với một nhóm, **When** thành viên mới được thêm vào nhóm, **Then** họ tự động có quyền truy cập lesson đó

---

### Edge Cases

- Kéo block trong khi kết nối mạng chậm — block trả về vị trí cũ hay giữ vị trí mới?
- TOC với heading lồng nhau (H1 > H2 > H3) — có thụt lề theo cấp không?
- Lesson không có heading nào — TOC block hiển thị gì?
- Admin xóa user đã được cấp quyền — quyền đó có tự bị xóa không?
- Hai editor cùng kéo thả block cùng lúc — conflict được xử lý thế nào?

---

## Requirements *(mandatory)*

### Functional Requirements

**Kéo thả block (FR-001–FR-005)**

- **FR-001**: Mọi block trong lesson editor MUST hiển thị drag handle (⠿) khi hover
- **FR-002**: Editor MUST được kéo bất kỳ block nào đến vị trí khác trong cùng một lesson
- **FR-003**: Trong khi kéo, MUST có drop indicator (đường kẻ) cho thấy vị trí block sẽ đặt
- **FR-004**: Block toggle/accordion khi bị kéo MUST mang theo toàn bộ nội dung con bên trong
- **FR-005**: Thứ tự block sau khi kéo thả MUST được lưu lại ngay lập tức và persist sau khi reload

**Icon & Cover (FR-006–FR-009)**

- **FR-006**: Mỗi lesson MUST hỗ trợ một icon emoji, hiển thị phía trên tiêu đề
- **FR-007**: Editor MUST có thể chọn icon từ emoji picker hoặc xóa icon hiện tại
- **FR-008**: Mỗi lesson MUST hỗ trợ một ảnh cover hiển thị ở đầu trang, phía trên icon
- **FR-009**: Editor MUST có thể upload ảnh cover hoặc dán URL ảnh bên ngoài, và xóa cover

**Mục lục — Table of Contents (FR-010–FR-013)**

- **FR-010**: Editor MUST có thể thêm block "Table of Contents" vào bất kỳ vị trí nào trong lesson
- **FR-011**: TOC MUST tự động tổng hợp tất cả H1/H2/H3 headings trong lesson theo thứ tự xuất hiện
- **FR-012**: TOC MUST cập nhật trong vòng 1 giây khi heading được thêm, xóa, hoặc đổi tên
- **FR-013**: Khi lesson không có heading nào, TOC MUST hiển thị thông báo trống thay vì danh sách rỗng

**Chia sẻ & Phân quyền (FR-014–FR-020)**

*Prerequisite: User Management System (tài khoản, đăng nhập, nhóm, email)*

- **FR-014**: Hệ thống MUST hỗ trợ tài khoản người dùng với email và mật khẩu
- **FR-015**: Admin MUST có thể tạo và quản lý nhóm người dùng
- **FR-016**: Mỗi lesson MUST có nút "Share" mở panel mời người dùng bằng email
- **FR-017**: Admin MUST có thể cấp một trong hai mức quyền: "Can view" hoặc "Can edit"
- **FR-018**: Người được mời chưa có tài khoản MUST nhận email với link đăng ký
- **FR-019**: Quyền MUST áp dụng ở cấp lesson — chia sẻ lesson cha không tự động chia sẻ lesson con
- **FR-020**: Thu hồi hoặc thay đổi quyền MUST có hiệu lực ngay lập tức

### Key Entities

- **Block**: Đơn vị nội dung trong lesson — có type, content, và `orderIndex` xác định vị trí trong trang
- **Lesson** (Node hiện có): Bổ sung `icon` (emoji), `coverImage` (URL) — đã tồn tại một phần
- **TOCBlock**: Block ảo — không lưu riêng, render từ danh sách headings trong lesson lúc hiển thị
- **User**: Tài khoản người dùng với email, password — mới, chưa có trong hệ thống
- **Group**: Nhóm người dùng có tên và danh sách members
- **LessonPermission**: Liên kết User (hoặc Group) với Lesson và permission level (view | edit)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Editor có thể kéo thả bất kỳ block nào đến vị trí mới trong vòng 2 giây thao tác
- **SC-002**: Thứ tự block mới được lưu và hiển thị đúng sau reload, không bị revert
- **SC-003**: TOC cập nhật trong vòng 1 giây sau khi heading thay đổi
- **SC-004**: 90% editor có thể kéo thả block thành công trong lần thử đầu tiên mà không cần hướng dẫn
- **SC-005**: Admin có thể mời người dùng và cấp quyền cho lesson trong vòng 60 giây
- **SC-006**: Thay đổi quyền áp dụng trong vòng 5 giây, không yêu cầu user logout/login lại

---

## Assumptions

- Block drag-and-drop hoạt động trong cùng một lesson — không kéo block giữa các lesson khác nhau
- Icon và cover đã có cơ sở (`Node.icon`, `Node.coverImage`) — tính năng này hoàn thiện UI và mở rộng cho tất cả lesson
- TOC chỉ tổng hợp headings trong lesson hiện tại, không traverse sang lesson khác
- US3 (Sharing) phụ thuộc vào User Management System chưa tồn tại — cần spec và implement riêng trước
- Admin hiện tại (single token) vẫn có full access, không bị ảnh hưởng bởi permission system mới
- Khi conflict kéo thả đồng thời (hai người cùng edit), áp dụng last-write-wins — conflict resolution nâng cao là out of scope v1
