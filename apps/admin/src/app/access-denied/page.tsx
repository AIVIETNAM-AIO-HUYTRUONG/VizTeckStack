export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-0">
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-6">🚫</div>
        <h1 className="font-display text-2xl font-bold text-text-1 mb-3">
          Không có quyền truy cập
        </h1>
        <p className="text-text-2 text-sm leading-relaxed">
          Tài khoản của bạn chưa được cấp quyền vào trang quản trị.
          Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
      </div>
    </div>
  );
}
