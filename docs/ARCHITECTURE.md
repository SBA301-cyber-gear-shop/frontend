# Kiến trúc frontend TechZone

Đợt tái cấu trúc ngày 13/10/2026 giữ giao diện, URL, animation và dữ liệu
trình duyệt hiện có. Mục tiêu là phân chia trách nhiệm theo từng feature.

## Cấu trúc

```text
public/assets/                Giữ nguyên ảnh và URL /assets/...
src/
  assets/styles/              global.css, reference.css, landing.css,
                              login.css, app.css
  components/
    ui/                       Button/, Modal/, Badge/, ... và index.ts
    form/                     Field/, Select/, Quantity/ và index.ts
  features/
    auth/                     api, components, hooks, types, index.ts
    products/                 components, hooks, constants, domain, types
    cart/                     components, hooks, index.ts
    orders/                   components, hooks, constants, domain, types
    pc-builder/               api, components, hooks, domain, types
    promotions/               components, hooks, domain, types
    warranty/                 components, hooks, constants, domain, types
    landing/                  components, hooks, constants
    system-states/            components
  hooks/                      useDebounce, useScroll
  layouts/                    MainLayout/, AuthLayout/, AccountLayout/,
                              AdminLayout/ và index.ts
  pages/                      Home/HomePage.tsx, Login/LoginPage.tsx, ...
  routes/                     AppRoutes, PrivateRoute, ScrollToTop,
                              legacyAliases và index.ts
  services/                   httpClient.js, endpoints.ts, index.ts
  store/                      StoreProvider, context, index.ts
    demo/                     seed.js, persistence.js, index.js
  types/                      common.types.ts, index.ts
  utils/                      formatters.js, index.ts
  App.tsx                     Provider và router
  main.tsx                    CSS và gắn React vào DOM
  vite-env.d.ts
scripts/check-architecture.mjs
tests/domain.test.js
tests/e2e/flows.spec.js
vite.config.ts
vitest.config.ts
tsconfig.json
tsconfig.node.json
```

Mọi feature đều có public API tại `index.ts`. Chỉ tạo thư mục có mã thực tế;
không thêm api/store rỗng, Redux, Axios hoặc CSS Module chỉ để khớp tên mẫu.
Ảnh giữ trong public để không đổi URL; font vẫn bundle từ Fontsource.

## Page chỉ ghép màn hình

Page không gọi HTTP, không đọc global store và không tính toán nghiệp vụ.

```tsx
import { useCart } from "@/features/cart";
import { ProductDetails } from "@/features/products";

export default function ProductPage() {
  const { addToCart } = useCart();
  return <ProductDetails addCart={addToCart} />;
}
```

Page nối hành động giỏ hàng vào màn hình sản phẩm để products không phụ
thuộc ngược vào cart. Khung cửa hàng/quản trị được áp dụng ở nested route.
Khung tài khoản/xác thực được ghép ở Page.

Luồng đăng nhập:

```text
LoginPage → useAuthForm → authApi → services/request → backend
          ↘ AuthLayout + LoginForm + AuthHelp
```

## Alias và barrel

- Vite và TypeScript cùng định nghĩa `@/` trỏ vào `src/`.
- Bên ngoài feature: chỉ import `@/features/<tên>`.
- Nội bộ feature: import tương đối, không import lại barrel của chính nó.
- Shared UI: `@/components/ui`; form controls: `@/components/form`.
- Type nghiệp vụ nằm trong feature; chỉ API envelope, pagination và toast
  dùng chung nằm trong `src/types`.

```tsx
import { Button, Modal } from "@/components/ui";
import { Field } from "@/components/form";
import { ProductCard } from "@/features/products";
import type { ProductVariant } from "@/features/products";

// Không dùng từ bên ngoài:
// import { Button } from "@/components/ui/Button/Button";
// import { ProductCard } from "@/features/products/components/ProductCard";
```

Luồng phụ thuộc: App → routes → pages/layouts → features → shared.
Orders dùng products, promotions, pc-builder; pc-builder và cart dùng products.
Shared infrastructure không phụ thuộc lên feature. ProductCard và OrderLines
là UI nghiệp vụ sản phẩm; Button/Modal/Field không biết catalog hay đơn hàng.

## Trách nhiệm

| Vị trí                | Trách nhiệm                                              |
| --------------------- | -------------------------------------------------------- |
| features/*/components | JSX, class CSS, callback UI, trạng thái hiển thị nhỏ     |
| features/*/hooks      | State, lọc dữ liệu, validation form, hành động nghiệp vụ |
| features/*/domain     | Hàm quy tắc nghiệp vụ thuần, kiểm thử bằng Vitest        |
| features/*/api        | Nơi duy nhất trong feature gọi HTTP service              |
| services              | HTTP, bearer token, response/error, endpoint             |
| store                 | Commit state, lưu session, toast, browser persistence    |
| layouts               | Header/sidebar/footer và vị trí nội dung                 |
| pages                 | Ghép feature với layout                                  |

Store demo vẫn commit nguyên state để giữ đồng bộ kho, đơn, voucher và
thẻ bảo hành. Hành động thêm giỏ đã chuyển sang useCart. Không đổi khóa
`techzone-demo-v1`, `techzone-session`, `techzone-token`.

## Backend và demo

Ranh giới tích hợp giữ như trước khi restructuring:

- Đăng nhập/đăng ký gọi API thật: /api/auth/login và /api/auth/register.
- Catalog, checkout, thanh toán, bảo hành, quản trị và cập nhật hồ sơ còn
  dùng state demo trên thiết bị.
- UI builder vẫn dùng đề xuất demo và bộ kiểm tra tương thích.
  pcBuilderApi.suggest giữ điểm tích hợp API của hook cũ, chưa bật trên UI.
- Type DTO được chuyển về feature; không coi các type này là xác nhận mọi
  hợp đồng backend đã được triển khai.

Khi tích hợp API tiếp theo: thêm api trong feature, đổi hook và ánh xạ DTO.
Giữ Page và giao diện ổn định. Không gọi HTTP trong Page.

## Kiểm tra

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Lint gồm ESLint và check:architecture. Kiểm tra kiến trúc phát hiện import
không resolve, import sâu xuyên feature, bỏ qua barrel UI, import tương đối
xuyên tầng, phụ thuộc ngược, vòng lặp import, Page gọi API/store hoặc tính
toán dữ liệu, và feature gọi HTTP service bên ngoài thư mục api.

Dự án giữ JS/TS hỗn hợp: Page, entry, barrel và type dùng TypeScript; phần
component/hook/domain đã có giữ JS/JSX. TypeScript dùng allowJs, chưa bật
checkJs/strict cho mã cũ. ESLint kiểm tra JS/JSX và Page TSX không chứa
annotation; kiểm tra kiến trúc quét tất cả JS/JSX/TS/TSX.

Playwright dùng Chrome và cổng riêng 4175. API auth được mock trong test,
không cần backend/database thật. Test đăng nhập đã sửa theo form hiện tại,
vì nút demo login mà test cũ dùng đã bị bỏ khỏi UI trước đợt restructuring.

## Bản đồ chuyển đổi

| Cũ                                         | Mới                                                           |
| ------------------------------------------ | ------------------------------------------------------------- |
| pages/Auth.jsx                             | features/auth + layouts/AuthLayout + pages/Login, Register    |
| pages/StorePages.jsx                       | features/products + pages/Home, Catalog, Product              |
| pages/Checkout.jsx                         | features/cart, orders và products/OrderLines                  |
| pages/AccountPages.jsx                     | features/auth, orders, warranty + Page tương ứng              |
| pages/Operations.jsx                       | features/orders, warranty + Page vận hành                     |
| pages/AdminPages.jsx                       | features/products, promotions + Page quản trị                 |
| pages/Builder.jsx                          | features/pc-builder + pages/Builder                           |
| pages/Landing.jsx                          | features/landing + pages/Landing                              |
| components/Layouts.jsx                     | layouts và routes/PrivateRoute, ScrollToTop                   |
| domain/commerce.js                         | domain của products, orders, promotions, pc-builder, warranty |
| services/demoStore.js                      | store/demo/persistence + services/httpClient + utils/delay    |
| state/                                     | store/                                                        |
| data/seed.js                               | store/demo/seed.js và constants của feature                   |
| hooks nghiệp vụ trùng Page, chưa được dùng | hook thực sự được dùng trong feature                          |
| types nghiệp vụ                            | features/<tên>/types                                          |
| index.css, styles/                         | assets/styles, giữ nguyên CSS và thứ tự import                |
