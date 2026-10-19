import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useSession } from "@/features/auth";
import { Logo, Icon, Badge } from "@/components/ui";
import "./AdminLayout.scss";

const menu = [
  ["/van-hanh/don-hang", "bag", "Đơn hàng", ["Staff", "Admin"]],
  ["/van-hanh/ban-giao", "pin", "Bàn giao tại quầy", ["Staff", "Admin"]],
  ["/van-hanh/bao-hanh", "shield", "Tiếp nhận bảo hành", ["Staff", "Admin"]],
  ["/ky-thuat", "chip", "Xử lý kỹ thuật", ["Technician", "Admin"]],
  ["/quan-tri/san-pham", "grid", "Sản phẩm & phiên bản", ["Admin"]],
  ["/quan-tri/thong-so", "grid", "Danh mục & thông số", ["Admin"]],
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
              <NavLink key={to} to={to}>
                <Icon name={icon} />
                {label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Badge tone="info">{user.role}</Badge>
          <p className="small muted">Môi trường demo · Dữ liệu trên thiết bị</p>
          <Link to="/cua-hang">← Xem cửa hàng</Link>
          <button className="text-button" onClick={signOut}>
            Đăng xuất
          </button>
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

export default AdminLayout;
