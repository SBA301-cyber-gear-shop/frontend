import { NavLink } from "react-router-dom";

/** Tab đầu trang Build PC: tạo cấu hình mới hoặc xem các bộ đã lưu (trang đã lưu cần đăng nhập). */
export function BuilderTabs() {
  return (
    <nav className="builder-tabs" aria-label="AI Build PC">
      <NavLink to="/build-pc" end>
        Tạo cấu hình
      </NavLink>
      <NavLink to="/build-pc/da-luu">Cấu hình đã lưu</NavLink>
    </nav>
  );
}
