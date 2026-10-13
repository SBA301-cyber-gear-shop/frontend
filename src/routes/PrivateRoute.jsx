import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/features/auth";
import { Button, Empty } from "@/components/ui";

export function PrivateRoute({ roles, children }) {
  const { user } = useSession(),
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
