# TechZone Pro — React storefront

Frontend React 19, Vite, React Router và Anime.js cho cửa hàng linh kiện PC.
Giao diện đã có được giữ nguyên; mã nguồn tổ chức theo feature.

## Chạy dự án

```bash
npm ci
npm run dev
```

Đăng nhập/đăng ký sử dụng backend. Sao chép `.env.example` thành
`.env.local` và đặt `VITE_API_BASE_URL` nếu backend không ở
`http://localhost:8080`. Các luồng thương mại, AI builder và bảo hành
hiện còn dùng dữ liệu demo trên trình duyệt.

## Kiến trúc

Xem [hướng dẫn kiến trúc và bản đồ chuyển đổi](docs/ARCHITECTURE.md).

- `pages/` chỉ ghép màn hình, layout và public hook của feature.
- `features/` sở hữu component, hook, API, type và quy tắc nghiệp vụ.
- `layouts/`, `routes/` quản lý khung trang, định tuyến và route guard.
- `components/ui`, `components/form` chứa giao diện dùng chung.
- Import xuyên tầng bằng alias `@/`; import feature qua `index.ts`.
- API dùng Axios client chung tại `src/services/axiosClient.ts`; feature
  gọi qua `@/services`, gửi object trực tiếp và lấy dữ liệu từ `response.data`.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Lint kiểm tra cả ranh giới kiến trúc và vòng lặp import. Test domain dùng
Vitest; test API kiểm tra Axios với HTTP server cục bộ. Playwright dùng Chrome,
cổng riêng 4175 và mock API auth; không cần
backend thật. Server test được tạo/dừng trong process để hỗ trợ Windows.

State demo dùng localStorage `techzone-demo-v1`; phiên đăng nhập dùng
sessionStorage. Không đổi dữ liệu hoặc khóa lưu trữ khi restructuring.

Tài liệu màn hình: [IMPLEMENTATION.md](docs/IMPLEMENTATION.md).
Manifest bản thiết kế: [docs/reference/manifest.json](docs/reference/manifest.json).
