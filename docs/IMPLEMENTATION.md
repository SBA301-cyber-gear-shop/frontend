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

## Kiểm thử

Đã xác minh ngày 13/10/2026: lint/kiểm tra kiến trúc, TypeScript và production
build đều thành công; 11/11 domain tests và 11/11 E2E tests thành công.

- Domain: 11 trường hợp gồm tính giá, tương thích, voucher, tồn kho, serial
  và vòng đời bảo hành.
- E2E: render 21 màn hình ở 1440px và 390px; mua hàng đến bàn giao; build PC;
  quản trị; bảo hành; phân quyền; bộ lọc; đăng ký; lỗi đăng nhập và redirect;
  URL cũ và trang không tìm thấy.
- Đối chiếu trước/sau restructuring: 42/42 ảnh trùng khớp từng pixel.
- API auth được mock chỉ trong test. Các kiểm thử này không xác nhận
  backend, cổng thanh toán hoặc AI production hoạt động.
