import { Link, NavLink } from "react-router-dom";
import { useSession } from "@/features/auth";
import { Icon } from "@/components/ui";

export function AccountLayout({ children }) {
  const { user, signOut } = useSession();
  return (
    <div className="account-grid">
      <aside className="account-nav">
        <div className="identity">
          <Icon name="user" />
          <h3>{user?.name}</h3>
          <span className="small muted">{user?.email}</span>
        </div>
        <NavLink to="/don-hang">Đơn hàng của tôi</NavLink>
        {user?.role === "Customer" && <NavLink to="/voucher-cua-toi">Voucher của tôi</NavLink>}
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
