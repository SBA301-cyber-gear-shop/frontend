import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth";
import { useCart } from "@/features/cart";
import { money } from "@/utils";

import { Logo, Icon } from "@/components/ui";

export function MainLayout() {
  const { user } = useSession();
  const { totalCount, totalAmount } = useCart();
  const navigate = useNavigate(),
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
              <small>Giỏ hàng · {totalCount}</small>
              {money(totalAmount)}
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
