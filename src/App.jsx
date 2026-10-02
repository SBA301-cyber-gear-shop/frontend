import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StoreProvider from "./state/StoreProvider";
import {
  StoreLayout,
  AdminLayout,
  RequireRole,
  ScrollToTop,
} from "./components/Layouts";
import { ErrorBoundary, Empty, Button } from "./components/ui";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() =>
  import("./pages/StorePages").then((m) => ({ default: m.Home })),
);
const Catalog = lazy(() =>
  import("./pages/StorePages").then((m) => ({ default: m.Catalog })),
);
const Product = lazy(() =>
  import("./pages/StorePages").then((m) => ({ default: m.Product })),
);
const Builder = lazy(() => import("./pages/Builder"));
const Cart = lazy(() =>
  import("./pages/Checkout").then((m) => ({ default: m.Cart })),
);
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() =>
  import("./pages/AccountPages").then((m) => ({ default: m.Orders })),
);
const OrderDetail = lazy(() =>
  import("./pages/AccountPages").then((m) => ({ default: m.OrderDetail })),
);
const Warranty = lazy(() =>
  import("./pages/AccountPages").then((m) => ({ default: m.Warranty })),
);
const Account = lazy(() =>
  import("./pages/AccountPages").then((m) => ({ default: m.Account })),
);
const StaffOrders = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.StaffOrders })),
);
const Intake = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.Intake })),
);
const Technician = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.Technician })),
);
const AdminProduct = lazy(() =>
  import("./pages/AdminPages").then((m) => ({ default: m.AdminProduct })),
);
const AdminSpecs = lazy(() =>
  import("./pages/AdminPages").then((m) => ({ default: m.AdminSpecs })),
);
const AdminPromotion = lazy(() =>
  import("./pages/AdminPages").then((m) => ({ default: m.AdminPromotion })),
);
const Exceptions = lazy(() => import("./pages/Exceptions"));
const aliases = {
  "01-landing": "/",
  "02-home": "/cua-hang",
  "03-monitors": "/danh-muc/monitor",
  "04-laptops": "/danh-muc/laptop",
  "05-product": "/san-pham/ram16",
  "06-builder": "/build-pc",
  "06b-builder-verified": "/build-pc",
  "07-cart": "/gio-hang",
  "08-checkout": "/thanh-toan",
  "08b-build-checkout": "/thanh-toan?source=build",
  "09-login": "/dang-nhap",
  "09b-register": "/dang-ky",
  "10-orders": "/don-hang",
  "11-order-detail": "/don-hang/TZ-261001-0128",
  "11a-order-created": "/don-hang/TZ-261001-0128?created=1",
  "12-warranty": "/bao-hanh",
  "13-account": "/tai-khoan",
  "14-staff-orders": "/van-hanh/don-hang",
  "15-handover": "/van-hanh/ban-giao",
  "16-warranty-intake": "/van-hanh/bao-hanh",
  "16b-new-intake": "/van-hanh/bao-hanh",
  "17-technician": "/ky-thuat",
  "18-admin-product": "/quan-tri/san-pham",
  "19-admin-specs": "/quan-tri/thong-so",
  "20-admin-promotion": "/quan-tri/khuyen-mai",
  "21-exception-states": "/trang-thai",
};
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="page-loading" role="status">
                <span />
                Đang tải TechZone…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dang-nhap" element={<Auth key="login" />} />
              <Route
                path="/dang-ky"
                element={<Auth key="register" register />}
              />
              <Route element={<StoreLayout />}>
                <Route path="/cua-hang" element={<Home />} />
                <Route path="/san-pham" element={<Catalog />} />
                <Route path="/danh-muc/:category" element={<Catalog />} />
                <Route path="/san-pham/:id" element={<Product />} />
                <Route path="/build-pc" element={<Builder />} />
                <Route path="/gio-hang" element={<Cart />} />
                <Route path="/trang-thai" element={<Exceptions />} />
                <Route element={<RequireRole />}>
                  <Route path="/tai-khoan" element={<Account />} />
                  <Route path="/don-hang" element={<Orders />} />
                  <Route path="/don-hang/:id" element={<OrderDetail />} />
                  <Route path="/bao-hanh" element={<Warranty />} />
                </Route>
                <Route
                  path="/thanh-toan"
                  element={
                    <RequireRole roles={["Customer"]}>
                      <Checkout />
                    </RequireRole>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Empty
                      title="Không tìm thấy trang"
                      description="Đường dẫn không tồn tại hoặc đã thay đổi."
                      action={<Button to="/cua-hang">Về cửa hàng</Button>}
                    />
                  }
                />
              </Route>
              <Route
                element={
                  <RequireRole roles={["Staff", "Admin", "Technician"]}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route element={<RequireRole roles={["Staff", "Admin"]} />}>
                  <Route path="/van-hanh/don-hang" element={<StaffOrders />} />
                  <Route
                    path="/van-hanh/ban-giao"
                    element={<StaffOrders handover />}
                  />
                  <Route path="/van-hanh/bao-hanh" element={<Intake />} />
                </Route>
                <Route
                  path="/ky-thuat"
                  element={
                    <RequireRole roles={["Technician", "Admin"]}>
                      <Technician />
                    </RequireRole>
                  }
                />
                <Route element={<RequireRole roles={["Admin"]} />}>
                  <Route path="/quan-tri/san-pham" element={<AdminProduct />} />
                  <Route path="/quan-tri/thong-so" element={<AdminSpecs />} />
                  <Route
                    path="/quan-tri/khuyen-mai"
                    element={<AdminPromotion />}
                  />
                </Route>
              </Route>
              {Object.entries(aliases).map(([from, to]) => (
                <Route
                  key={from}
                  path={"/" + from + ".html"}
                  element={<Navigate to={to} replace />}
                />
              ))}
            </Routes>
          </Suspense>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
