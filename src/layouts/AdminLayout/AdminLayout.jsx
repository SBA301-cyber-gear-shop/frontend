import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useSession } from "@/features/auth";
import { Logo, Icon, Badge } from "@/components/ui";
import { demoMode } from "@/utils";

const menu = [
  ["/van-hanh/don-hang", "bag", "Đơn hàng", ["Staff", "Admin"]],
  ["/van-hanh/ho-tro-truc-tuyen", "message", "Hỗ trợ trực tuyến", ["Staff", "Admin"]],
  ["/van-hanh/ban-giao", "pin", "Bàn giao tại quầy", ["Staff", "Admin"]],
  ["/van-hanh/bao-hanh", "shield", "Tiếp nhận bảo hành", ["Staff", "Admin"]],
  ["/ky-thuat", "chip", "Xử lý kỹ thuật", ["Technician", "Admin"]],
  ["/quan-tri/san-pham", "grid", "Sản phẩm & phiên bản", ["Admin"]],
  ["/quan-tri/thong-so", "layers", "Danh mục & thông số", ["Admin"]],
  ["/quan-tri/khuyen-mai", "spark", "Khuyến mãi & banner", ["Admin"]],
];

export function AdminLayout() {
  const { user, signOut } = useSession(),
    [open, setOpen] = useState(false);
  return (
    <div className="admin-body">
      <button
        className="admin-menu icon-button"
        onClick={() => setOpen(!open)}
        aria-label="Menu vận hành"
        aria-expanded={open}
      >
        ☰
      </button>
      <aside className={"admin-sidebar " + (open ? "is-open" : "")}>
        <Logo />
        <div className="eyebrow">KHÔNG GIAN VẬN HÀNH</div>
        <nav onClick={() => setOpen(false)}>
          {menu
            .filter((m) => m[3].includes(user.role))
            .map(([to, icon, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon-wrap">
                  <Icon name={icon} />
                </span>
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <Badge tone="info">{user.role}</Badge>
            <p className="small muted">
              {demoMode
                ? "Môi trường demo · Dữ liệu trên thiết bị"
                : "Quản lý đơn và nhận hàng tại cửa hàng"}
            </p>
          </div>
          <div className="sidebar-actions">
            <Link to="/cua-hang" className="sidebar-action-btn" title="Xem cửa hàng">
              <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
              <span>Xem cửa hàng</span>
            </Link>
            <button
              className="sidebar-action-btn text-button danger"
              onClick={signOut}
              title="Đăng xuất khỏi hệ thống"
            >
              <Icon name="logout" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-work">
        <div className="admin-top between">
          <span className="small muted">TechZone Pro / {user.role}</span>
          <span className="row small">
            <Icon name="user" />
            {user.name}
          </span>
        </div>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
