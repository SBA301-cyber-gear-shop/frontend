import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout, AdminLayout } from "@/layouts";
import { Empty, Button } from "@/components/ui";
import { PrivateRoute } from "./PrivateRoute";
import { legacyAliases } from "./legacyAliases";
const Landing = lazy(() => import("@/pages/Landing"));
const Home = lazy(() => import("@/pages/Home"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const Product = lazy(() => import("@/pages/Product"));
const Builder = lazy(() => import("@/pages/Builder"));
const SavedBuilds = lazy(() => import("@/pages/SavedBuilds"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Warranty = lazy(() => import("@/pages/Warranty"));
const Account = lazy(() => import("@/pages/Account"));
const MyVouchers = lazy(() => import("@/pages/MyVouchers"));
const StaffOrders = lazy(() => import("@/pages/StaffOrders"));
const StaffVouchers = lazy(() => import("@/pages/StaffVouchers"));
const Intake = lazy(() => import("@/pages/WarrantyIntake"));
const Technician = lazy(() => import("@/pages/Technician"));
const AdminProduct = lazy(() => import("@/pages/AdminProduct"));
const AdminSpecs = lazy(() => import("@/pages/AdminSpecs"));
const AdminPromotion = lazy(() => import("@/pages/AdminPromotion"));
const AdminAiConfig = lazy(() => import("@/pages/AdminAiConfig"));
const AdminPcBuildMetadata = lazy(() => import("@/pages/AdminPcBuildMetadata"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const Exceptions = lazy(() => import("@/pages/Exceptions"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Handover = lazy(() => import("@/pages/Handover"));
const PaymentResult = lazy(() => import("@/pages/PaymentResult"));
const StaffLiveSupport = lazy(() => import("@/pages/StaffLiveSupport"));
export function AppRoutes() {
  return (
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
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route element={<MainLayout />}>
          <Route path="/cua-hang" element={<Home />} />
          <Route path="/san-pham" element={<Catalog />} />
          <Route path="/danh-muc/:category" element={<Catalog />} />
          <Route path="/san-pham/:id" element={<Product />} />
          <Route path="/build-pc" element={<Builder />} />
          <Route path="/gio-hang" element={<Cart />} />
          <Route path="/trang-thai" element={<Exceptions />} />
          <Route element={<PrivateRoute />}>
            <Route path="/build-pc/da-luu" element={<SavedBuilds />} />
            <Route path="/tai-khoan" element={<Account />} />
            <Route path="/don-hang" element={<Orders />} />
            <Route path="/don-hang/:id" element={<OrderDetail />} />
            <Route path="/bao-hanh" element={<Warranty />} />
          </Route>
          <Route path="/voucher-cua-toi" element={<PrivateRoute roles={["Customer"]}><MyVouchers /></PrivateRoute>} />
          <Route
            path="/thanh-toan"
            element={
              <PrivateRoute roles={["Customer"]}>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/thanh-toan/ket-qua"
            element={
              <PrivateRoute roles={["Customer"]}>
                <PaymentResult />
              </PrivateRoute>
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
            <PrivateRoute roles={["Staff", "Admin", "Technician"]}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route element={<PrivateRoute roles={["Staff", "Admin"]} />}>
            <Route path="/van-hanh/don-hang" element={<StaffOrders />} />
            <Route path="/van-hanh/voucher" element={<StaffVouchers />} />
            <Route path="/van-hanh/ban-giao" element={<Handover />} />
            <Route path="/van-hanh/bao-hanh" element={<Intake />} />
            <Route path="/van-hanh/ho-tro-truc-tuyen" element={<StaffLiveSupport />} />
          </Route>
          <Route
            path="/ky-thuat"
            element={
              <PrivateRoute roles={["Technician", "Admin"]}>
                <Technician />
              </PrivateRoute>
            }
          />
          <Route element={<PrivateRoute roles={["Admin"]} />}>
            <Route path="/quan-tri/thong-ke" element={<AdminAnalytics />} />
            <Route path="/quan-tri/san-pham" element={<AdminProduct />} />
            <Route path="/quan-tri/thong-so" element={<AdminSpecs />} />
            <Route path="/quan-tri/khuyen-mai" element={<AdminPromotion />} />
            <Route path="/quan-tri/cau-hinh-ai" element={<AdminAiConfig />} />
            <Route path="/quan-tri/pc-builder-metadata" element={<AdminPcBuildMetadata />} />
          </Route>
        </Route>
        {Object.entries(legacyAliases).map(([from, to]) => (
          <Route
            key={from}
            path={"/" + from + ".html"}
            element={<Navigate to={to} replace />}
          />
        ))}
      </Routes>
    </Suspense>
  );
}
