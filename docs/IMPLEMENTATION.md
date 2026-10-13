# Bản đồ màn hình và hành vi được giữ lại

| Khu vực              | Routes                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Giới thiệu, cửa hàng | /, /cua-hang, /san-pham, /danh-muc/:category, /san-pham/:id           |
| Build PC và mua hàng | /build-pc, /gio-hang, /thanh-toan, /trang-thai                        |
| Khách hàng           | /dang-nhap, /dang-ky, /don-hang, /don-hang/:id, /bao-hanh, /tai-khoan |
| Vận hành             | /van-hanh/don-hang, /van-hanh/ban-giao, /van-hanh/bao-hanh, /ky-thuat |
| Quản trị             | /quan-tri/san-pham, /quan-tri/thong-so, /quan-tri/khuyen-mai          |

URL .html cũ tiếp tục chuyển hướng qua `src/routes/legacyAliases.ts`.
Chi tiết tổ chức mã nguồn nằm trong [ARCHITECTURE.md](ARCHITECTURE.md).

## Giao diện

Giữ nội dung, class CSS, hình ảnh, font Be Vietnam Pro, animation Anime.js,
responsive navigation và các trạng thái tương tác. CSS chuyển vào
`src/assets/styles`, giữ thứ tự import ở `global.css`.

Khung xác thực chuyển sang AuthLayout; form giữ validation, lỗi API,
ẩn/hiện mật khẩu, hỗ trợ và đăng nhập về URL đã yêu cầu.

## Luồng nghiệp vụ demo

- Đơn nhận tại cửa hàng, chụp giá/số lượng/thời hạn bảo hành khi tạo.
- Đặt đơn giữ kho; hủy đơn hợp lệ trả kho; bàn giao cần thanh toán và serial
  riêng cho từng thiết bị.
- RAM bán từng thanh. Build kiểm tra số khe, dung lượng, chuẩn RAM, socket,
  nguồn, M.2 và kích thước. Thiếu dữ liệu kiểm định chặn mua cấu hình.
- Voucher kiểm tra ngày hiệu lực, hạn mức và quy tắc dùng của từng tài khoản.
- Thẻ bảo hành theo thiết bị; không tạo ticket đang mở trùng thẻ.

Các quy tắc trên chuyển về `features/*/domain`, không thay đổi để trở thành
giao dịch backend. State demo và session vẫn được lưu ở trình duyệt.
Riêng đăng nhập/đăng ký gọi API thật thông qua `features/auth/api`.

## Chuyển HTTP sang Axios

Toàn bộ lời gọi Fetch API được thay bằng Axios client dùng chung tại
`src/services/axiosClient.ts`, export qua `@/services`. Các nơi sử dụng:

- `features/auth/api/authApi.ts`: đăng nhập và đăng ký, có type cho payload
  và response; trả HTTP body để hook xử lý envelope như trước.
- `features/pc-builder/api/pcBuilderApi.ts`: gửi yêu cầu đề xuất PC và trả
  nội dung đề xuất. Đây vẫn là API chưa được UI demo gọi.

Client giữ base URL, Bearer token theo session, thông báo lỗi backend và
phản hồi 204 như luồng cũ. Không thay đổi giao diện hoặc quy tắc nghiệp vụ.
Hướng dẫn thêm API nằm trong mục HTTP với Axios của ARCHITECTURE.md.

## Kiểm thử

Đã xác minh ngày 13/10/2026: lint/kiểm tra kiến trúc, TypeScript và production
build đều thành công; 26/26 Vitest tests (11 domain + 15 API) và 11/11 E2E
tests thành công sau khi chuyển sang Axios.

- Domain: 11 trường hợp gồm tính giá, tương thích, voucher, tồn kho, serial
  và vòng đời bảo hành.
- API: JSON payload, base URL, envelope/bare response, token thay đổi và
  logout, header riêng, 204, lỗi HTTP/validation, JSON sai, lỗi mạng và hủy
  request. HTTP server test chỉ lắng nghe ở loopback, không gọi backend thật.
- E2E: render 21 màn hình ở 1440px và 390px; mua hàng đến bàn giao; build PC;
  quản trị; bảo hành; phân quyền; bộ lọc; đăng ký; lỗi đăng nhập và redirect;
  URL cũ và trang không tìm thấy.
- Đối chiếu trước/sau restructuring: 42/42 ảnh trùng khớp từng pixel.
- API auth được mock chỉ trong test. Các kiểm thử này không xác nhận
  backend, cổng thanh toán hoặc AI production hoạt động.
