import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useStore } from "../state/context";
import { money, totalOf } from "../domain/commerce";
import { Logo, Icon, Button, Badge, Empty } from "./ui";
const menu = [
  ["/van-hanh/don-hang", "bag", "Đơn hàng", ["Staff", "Admin"]],
  ["/van-hanh/ban-giao", "pin", "Bàn giao tại quầy", ["Staff", "Admin"]],
  ["/van-hanh/bao-hanh", "shield", "Tiếp nhận bảo hành", ["Staff", "Admin"]],
  ["/ky-thuat", "chip", "Xử lý kỹ thuật", ["Technician", "Admin"]],
  ["/quan-tri/san-pham", "grid", "Sản phẩm & phiên bản", ["Admin"]],
  ["/quan-tri/thong-so", "grid", "Danh mục & thông số", ["Admin"]],
  ["/quan-tri/khuyen-mai", "spark", "Khuyến mãi & banner", ["Admin"]],
];
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      "TechZone Pro · " +
      (pathname === "/"
        ? "Hiệu năng mang dấu ấn của bạn"
        : decodeURIComponent(pathname.split("/")[1]).replaceAll("-", " "));
  }, [pathname]);
  return null;
}
export function StoreLayout() {
  const { data, user } = useStore(),
    navigate = useNavigate(),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <div className="utility">
        <div className="wrap between">
          <span>
            <Icon name="pin" /> Đặt online · Nhận trực tiếp tại cửa hàng
          </span>
          <Link to="/bao-hanh">Bảo hành theo từng thiết bị</Link>
        </div>
      </div>
      <header className="store-header">
        <div className="wrap header-main">
          <Logo />
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/san-pham?q=" + encodeURIComponent(search));
            }}
          >
            <Icon name="search" />
            <input
              aria-label="Tìm sản phẩm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm, thương hiệu, mã phiên bản..."
            />
            <button type="submit">Tìm kiếm</button>
          </form>
          <Link className="build-nav" to="/build-pc">
            <Icon name="spark" /> AI Build PC
          </Link>
          <Link
            className="header-action"
            to={user ? "/tai-khoan" : "/dang-nhap"}
          >
            <Icon name="user" />
            <div>
              <small>Tài khoản</small>
              {user ? user.name.split(" ").slice(-2).join(" ") : "Đăng nhập"}
            </div>
          </Link>
          <Link className="header-action" to="/gio-hang">
            <Icon name="cart" />
            <div>
              <small>
                Giỏ hàng · {data.cart.reduce((s, l) => s + l.quantity, 0)}
              </small>
              {money(totalOf(data.cart, data.products))}
            </div>
          </Link>
          <button
            className="mobile-menu icon-button"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
        <nav
          className={"wrap nav " + (open ? "is-open" : "")}
          aria-label="Cửa hàng"
          onClick={() => setOpen(false)}
        >
          <NavLink to="/san-pham" end className="catalog">
            <Icon />
            Danh mục sản phẩm
          </NavLink>
          <NavLink to="/cua-hang">Trang chủ</NavLink>
          <NavLink to="/san-pham?category=parts">Linh kiện PC</NavLink>
          <NavLink to="/danh-muc/monitor">Màn hình</NavLink>
          <NavLink to="/danh-muc/laptop">Laptop</NavLink>
          <NavLink to="/don-hang">Đơn hàng của tôi</NavLink>
          <NavLink to="/bao-hanh">Bảo hành</NavLink>
        </nav>
      </header>
      <main id="main-content" className="wrap main">
        <Outlet />
      </main>
      <footer className="wrap between">
        <div>
          <Logo />
          <p className="small muted">
            Chọn đúng linh kiện. Theo dõi rõ từng đơn hàng.
          </p>
        </div>
        <div className="row small muted">
          <Link to="/">Khám phá TechZone</Link>
          <Link to="/tai-khoan">Tài khoản</Link>
          <Link to="/dang-nhap">Vận hành</Link>
        </div>
        <span className="small muted">© 2026 TechZone Pro · Demo</span>
      </footer>
    </>
  );
}
export function RequireRole({ roles, children }) {
  const { user } = useStore(),
    location = useLocation();
  if (!user)
    return (
      <Navigate
        to="/dang-nhap"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (roles && !roles.includes(user.role))
    return (
      <main className="wrap main">
        <Empty
          title="Bạn chưa có quyền truy cập"
          description="Trang này dành cho vai trò được phân công."
          action={<Button to="/tai-khoan">Về tài khoản</Button>}
        />
      </main>
    );
  return children || <Outlet />;
}
export function AdminLayout() {
  const { user, signOut } = useStore(),
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
export function AccountLayout({ children }) {
  const { user, signOut } = useStore();
  return (
    <div className="account-grid">
      <aside className="account-nav">
        <div className="identity">
          <Icon name="user" />
          <h3>{user?.name}</h3>
          <span className="small muted">{user?.email}</span>
        </div>
        <NavLink to="/don-hang">Đơn hàng của tôi</NavLink>
        <NavLink to="/bao-hanh">Bảo hành của tôi</NavLink>
        <NavLink to="/tai-khoan">Hồ sơ & tài khoản</NavLink>
        {user?.role !== "Customer" && (
          <Link
            to={
              user?.role === "Technician" ? "/ky-thuat" : "/van-hanh/don-hang"
            }
          >
            Không gian vận hành →
          </Link>
        )}
        <button className="text-button" onClick={signOut}>
          Đăng xuất
        </button>
      </aside>
      <div>{children}</div>
    </div>
  );
}
