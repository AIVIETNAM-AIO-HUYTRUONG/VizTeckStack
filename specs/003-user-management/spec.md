# Feature Specification: User Management

**Feature Branch**: `feature/003-user-management`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "user management — quản lý người dùng cho admin CMS: tạo/sửa/xóa user, phân quyền (admin/editor/viewer), login/logout, bảo vệ route"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Đăng nhập / Đăng xuất (Priority: P1)

Người dùng có tài khoản truy cập admin CMS. Họ cần đăng nhập bằng email và mật khẩu để vào hệ thống, và đăng xuất khi xong việc. Session được duy trì cho đến khi đăng xuất hoặc hết hạn.

**Why this priority**: Không có auth thì mọi tính năng user management đều vô nghĩa. Đây là prerequisite cho tất cả user stories còn lại.

**Independent Test**: Mở trang `/login`, nhập email/password hợp lệ → vào được `/dashboard`. Nhập sai → thấy thông báo lỗi. Bấm "Đăng xuất" → về `/login`, không vào được `/dashboard`.

**Acceptance Scenarios**:

1. **Given** tôi chưa đăng nhập, **When** tôi truy cập `/dashboard`, **Then** hệ thống chuyển về trang `/login`
2. **Given** tôi ở trang `/login`, **When** nhập email và password hợp lệ rồi submit, **Then** tôi vào được trang `/dashboard`
3. **Given** tôi ở trang `/login`, **When** nhập sai email hoặc password, **Then** thấy thông báo lỗi rõ ràng, form không bị reset
4. **Given** tôi đã đăng nhập, **When** bấm "Đăng xuất", **Then** tôi về `/login` và không còn truy cập được trang admin
5. **Given** tôi đã đăng nhập, **When** session hết hạn (sau 24h không hoạt động), **Then** tôi bị redirect về `/login` khi thao tác tiếp theo

---

### User Story 2 — Quản lý người dùng (CRUD) (Priority: P2)

Super Admin có thể tạo tài khoản cho thành viên mới, chỉnh sửa thông tin, và xóa tài khoản khi không còn cần thiết. Danh sách user được hiển thị trong trang quản lý.

**Why this priority**: Cần tạo được user thì mới có người dùng để phân quyền. US2 là nền tảng cho US3.

**Independent Test**: Đăng nhập với super admin account → vào `/admin/users` → thấy danh sách user → tạo user mới với email + role → user xuất hiện trong danh sách → edit tên → xóa user → user biến mất.

**Acceptance Scenarios**:

1. **Given** tôi là Super Admin, **When** vào `/admin/users`, **Then** thấy danh sách tất cả users với tên, email, role, trạng thái
2. **Given** tôi là Super Admin, **When** tạo user mới với email và role, **Then** user nhận được email mời set password và xuất hiện trong danh sách với trạng thái "Pending"
3. **Given** tôi là Super Admin, **When** edit thông tin user (tên, role), **Then** thay đổi được lưu và hiển thị ngay
4. **Given** tôi là Super Admin, **When** xóa một user, **Then** user bị xóa khỏi hệ thống và không đăng nhập được nữa
5. **Given** tôi là Super Admin, **When** tạo user với email đã tồn tại, **Then** thấy lỗi "Email đã được sử dụng"

---

### User Story 3 — Phân quyền theo role (Priority: P3)

Hệ thống có 3 role: Super Admin (toàn quyền), Editor (tạo/sửa nội dung), Viewer (chỉ xem). Mỗi user chỉ có thể truy cập những chức năng phù hợp với role của mình.

**Why this priority**: Role-based access là tính năng nâng cao, build on top of US1 + US2.

**Independent Test**: Đăng nhập với Editor account → không thấy menu "/admin/users" → có thể vào lesson editor → không thể delete roadmap.

**Acceptance Scenarios**:

1. **Given** tôi là Editor, **When** đăng nhập vào admin, **Then** tôi thấy menu lesson và roadmap nhưng không thấy User Management
2. **Given** tôi là Viewer, **When** đăng nhập vào admin, **Then** tôi chỉ thấy nội dung read-only, không có nút tạo/sửa/xóa
3. **Given** tôi là Editor, **When** cố truy cập `/admin/users` trực tiếp qua URL, **Then** tôi thấy "403 Forbidden" hoặc được redirect
4. **Given** tôi là Super Admin, **When** thay đổi role của một user đang đăng nhập, **Then** quyền hạn mới áp dụng trong vòng 1 phút

---

### Edge Cases

- Điều gì xảy ra nếu Super Admin duy nhất bị xóa? → Hệ thống phải ngăn, hiển thị lỗi
- Điều gì xảy ra nếu user mời quên set password? → Có thể resend invite email
- Điều gì xảy ra nếu user đổi email của chính mình thành email đã tồn tại? → Lỗi validation
- Điều gì xảy ra nếu session expire trong khi đang edit? → Prompt đăng nhập lại, không mất draft

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cho phép user đăng nhập bằng email và mật khẩu
- **FR-002**: Hệ thống MUST duy trì session đăng nhập trong 24 giờ (idle timeout)
- **FR-003**: Hệ thống MUST redirect về `/login` khi session hết hạn hoặc chưa đăng nhập
- **FR-004**: Super Admin MUST có thể xem danh sách tất cả users (tên, email, role, trạng thái)
- **FR-005**: Super Admin MUST có thể tạo user mới với email và role được chỉ định
- **FR-006**: Hệ thống MUST gửi email mời để user mới tự set password
- **FR-007**: Super Admin MUST có thể sửa thông tin user (tên, role)
- **FR-008**: Super Admin MUST có thể xóa user (ngoại trừ Super Admin duy nhất)
- **FR-009**: Hệ thống MUST có 3 role: Super Admin, Editor, Viewer
- **FR-010**: Hệ thống MUST enforce quyền hạn theo role — Editor và Viewer không truy cập được User Management
- **FR-011**: Viewer MUST chỉ có quyền đọc — không tạo, không sửa, không xóa bất kỳ nội dung nào
- **FR-012**: Editor MUST có thể tạo/sửa lesson và roadmap nhưng không xóa được roadmap
- **FR-013**: Hệ thống MUST log audit trail: ai tạo/sửa/xóa user nào, lúc nào
- **FR-014**: User MUST có thể đổi mật khẩu của chính mình
- **FR-015**: Hệ thống MUST block login sau 5 lần sai password liên tiếp (15 phút cooldown)

### Key Entities *(include if feature involves data)*

- **User**: id, email, name, role (SUPER_ADMIN | EDITOR | VIEWER), status (ACTIVE | PENDING | DISABLED), createdAt, lastLoginAt
- **Session**: id, userId, expiresAt, createdAt (server-side)
- **AuditLog**: id, actorId (user who performed action), targetId (user affected), action, timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User đăng nhập thành công trong vòng 3 giây từ lúc submit form
- **SC-002**: 100% các route admin đều yêu cầu đăng nhập — không có route bỏ sót
- **SC-003**: Tạo user mới hoàn thành trong dưới 30 giây (từ click "Add User" đến nhận confirm)
- **SC-004**: Role enforcement có độ trễ không quá 60 giây sau khi Super Admin thay đổi role
- **SC-005**: 0 trường hợp Super Admin duy nhất bị xóa (constraint enforcement 100%)
- **SC-006**: Email mời set password được gửi trong vòng 2 phút sau khi tạo tài khoản

## Assumptions

- Hệ thống email (SMTP hoặc email service) sẵn sàng — cần cho tính năng invite user (FR-006)
- Hiện tại chỉ có 1 loại auth: email + password. OAuth/SSO là out of scope cho v1
- Token-based auth (stateless JWT hoặc stateful session) — lựa chọn cụ thể sẽ quyết định trong plan
- Roadmap và Lesson content vẫn public-readable trên `apps/web` — user management chỉ bảo vệ admin CMS
- Số lượng user dự kiến nhỏ (< 100 users) — không cần pagination phức tạp trong v1
- Super Admin đầu tiên được seed trực tiếp vào DB (không có "register" flow public)
