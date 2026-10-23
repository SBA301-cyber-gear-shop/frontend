# Flow mua hàng, nhận tại cửa hàng, promotion và review

Chế độ mặc định dùng API Spring Boot. Backend sử dụng service interface trong `internal.service`, implementation trong `internal.service.impl`, controller trong `internal.controller` và DTO trong `api.dto.request`/`api.dto.response`.

## Luồng sử dụng

1. **Admin** vào `/quan-tri/khuyen-mai`: tạo/sửa mã giảm theo phần trăm hoặc số tiền, giới hạn lượt, thời gian và trạng thái. Banner có thể bật riêng khi đã nhập ảnh; banner hợp lệ xuất hiện ở trang chủ.
2. **Customer** xem sản phẩm tại `/san-pham`, chọn phiên bản/số lượng, thêm giỏ. Trong `/gio-hang`, kiểm tra tồn và tiếp tục `/thanh-toan`.
3. Nhập tên, số điện thoại nhận hàng và voucher. Chọn **Kiểm tra thông tin & voucher** hoặc **Áp dụng**, sau đó **Xác nhận đặt hàng**. Sửa dữ liệu sau preview yêu cầu kiểm tra lại.
4. Server kiểm tra lại giá/tồn/voucher, lưu snapshot sản phẩm và bảo hành, trừ tồn, giữ lượt voucher, tạo payment `PENDING`, xóa giỏ trong cùng transaction. Khách xem đơn tại `/don-hang`.
5. **Staff/Admin** vào `/van-hanh/don-hang`, chuyển lần lượt `pending → confirmed → preparing → ready_for_pickup`.
6. Nhân viên nhập số tiền thực nhận để xác nhận thu đủ. Payment chuyển `SUCCESS`; voucher chuyển từ `RESERVED` sang `USED`. Có thể ghi mã tham chiếu thu tiền.
7. Nhân viên tiếp tục bàn giao: nhập một serial cho mỗi thiết bị có bảo hành, đối chiếu số điện thoại người nhận và đánh dấu đã kiểm tra. Server chỉ hoàn tất khi đủ tiền, đúng người nhận và đủ serial duy nhất.
8. Bàn giao thành công chuyển đơn sang `completed`, tạo thẻ bảo hành cho từng thiết bị; thời hạn bắt đầu khi bàn giao. Khách xem tại `/bao-hanh`.
9. Khách mở đơn đã hoàn tất và đánh giá từng dòng hàng từ 1–5 sao; có thể sửa đánh giá. Đánh giá hiển thị ở trang sản phẩm tương ứng.

```mermaid
flowchart LR
    A[Admin tạo promotion] --> B[Khách kiểm tra giỏ và voucher]
    B --> C[Tạo đơn pending]
    C --> D[confirmed]
    D --> E[preparing]
    E --> F[ready_for_pickup]
    F --> G[Thu đủ tiền]
    G --> H[Đối chiếu người nhận và serial]
    H --> I[completed và kích hoạt bảo hành]
    I --> J[Khách đánh giá sản phẩm]
```

## Quy tắc nghiệp vụ

- Preview chỉ tính thử, không giữ tồn hay voucher. Khi đặt hàng, frontend gửi tổng/giảm giá đã preview để server phát hiện thay đổi; server tự tính lại và lấy dòng hàng từ giỏ của tài khoản.
- `Idempotency-Key` là UUID lưu theo tài khoản trong session trình duyệt. Trước khi gửi, FE lưu cả key và payload đã xác nhận. Nếu mất phản hồi hoặc nhận lỗi 5xx, màn hình cho kiểm tra lại cùng yêu cầu, kể cả sau tải lại trang và giỏ đã rỗng. Không xóa yêu cầu chưa rõ kết quả; server trả cùng đơn khi retry. Lỗi 4xx yêu cầu preview lại trước khi xác nhận.
- Giá, tên phiên bản, số tiền giảm và số tháng bảo hành được lưu theo thời điểm đặt. Thay đổi catalogue/promotion sau đó không đổi giá trị đơn cũ.
- Voucher đang giữ cũng chiếm hạn mức. Hủy đơn hợp lệ hoàn tồn và trả lượt chung, nhưng tài khoản đã dùng mã đó không được dùng lại, kể cả đơn đã hủy, theo `UNIQUE(user_id, promotion_id)` trong SQL hiện tại.
- Customer được hủy ở `pending`/`confirmed`; Staff/Admin được hủy trước khi hoàn tất. Đơn đã thu tiền với số tiền dương cần quy trình hoàn tiền trước, nên hiện bị chặn hủy. Hủy lặp không hoàn tồn lần hai.
- Đơn có số tiền cuối bằng 0 được ghi nhận thanh toán thành công ngay; vẫn phải qua chuẩn bị và bàn giao.
- Chỉ chủ đơn được xem đơn/thẻ bảo hành hoặc gửi review. Staff/Admin xử lý đơn; chỉ Admin quản lý promotion. Role và trạng thái hoạt động được kiểm tra lại từ tài khoản backend.
- Mỗi dòng hàng có một đánh giá; sửa đánh giá cập nhật bản hiện có. Review chỉ mở sau `completed`.
- Thẻ sản phẩm và trang chi tiết hiển thị `averageRating`, `reviewCount`, `buyerCount` từ catalogue API. Điểm sao lấy trung bình các review thuộc đơn `completed`; người mua đếm tài khoản khác nhau có đơn `completed`, theo từng phiên bản. Một người mua nhiều lần hoặc mua nhiều thiết bị vẫn chỉ tính một người. Sản phẩm chưa có review hiển thị “Chưa có đánh giá”.
- Catalogue được tải lại khi chuyển đường dẫn trong ứng dụng hoặc quay lại tab trình duyệt, để thẻ sản phẩm không giữ thống kê cũ trong khi trang chi tiết đã tải review mới. Các phản hồi cũ và request đã hủy không ghi đè kết quả mới.
- Thời gian nghiệp vụ theo `Asia/Bangkok` (UTC+07:00), khớp trường `TIMESTAMP` trong SQL. Nhân viên đối chiếu trực tiếp số điện thoại, chưa có OTP nhận hàng.

## API

| Nhóm                  | API                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Catalogue             | `GET /api/products`                                                                                     |
| Giỏ                   | `GET /api/orders/cart`, `POST /api/orders/cart/items`, `PUT/DELETE /api/orders/cart/items/{cartItemId}` |
| Checkout              | `POST /api/checkout/validate`, `POST /api/checkout/details/preview`                                     |
| Tạo/xem đơn           | `POST /api/orders` (header `Idempotency-Key`), `GET /api/orders`, `GET /api/orders/{orderCode}`         |
| Khách hủy             | `POST /api/orders/{orderCode}/cancel`                                                                   |
| Vận hành              | `GET /api/operations/orders?search=&status=`                                                            |
| Trạng thái            | `PATCH /api/operations/orders/{orderCode}/status`                                                       |
| Thu tiền/bàn giao/hủy | `POST /api/operations/orders/{orderCode}/collect`, `/handover`, `/cancel`                               |
| Bảo hành sau nhận hàng | `GET /api/my/warranty-cards` (màn hình bảo hành từ main, gồm tiến trình sửa chữa)                       |
| Promotion             | `GET /api/promotions`; Admin: `GET/POST /api/admin/promotions`, `PUT /api/admin/promotions/{id}`        |
| Review                | `PUT /api/order-items/{id}/review`, `GET /api/products/{productVariantId}/reviews`                      |

Thêm giỏ dùng `productVariantId`; sửa/xóa giỏ dùng `cartItemId`; review và serial bàn giao dùng `orderItemId` do API đơn trả về.

## Chạy và thử bằng tài khoản thật

1. Chạy backend trong `D:\SBA_backend` với Java 21: `.\mvnw.cmd spring-boot:run`.
2. Trong frontend, đặt `.env.local` rồi chạy `npm run dev`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_DEMO_DATA=false
```

3. Dùng ba tài khoản có role `Admin`, `Staff`, `Customer`, đăng xuất/đăng nhập luân phiên để đi theo các bước trên. Customer có thể tự đăng ký; tài khoản nhân viên/quản trị cần được cấp role trong dữ liệu hiện tại.

Catalogue cần `brands`, `categories`, `products`, `product_variants`, với `products.status = 'active'`. Menu có sẵn dùng slug `cpu`, `mainboard`, `ram`, `gpu`, `ssd`, `psu`, `case`, `cooler`, `monitor`, `laptop`. Thông số lấy từ `specification_values`, `specification_options` và `category_specifications`. Nếu chưa seed dữ liệu, trang hiển thị danh sách rỗng.

Backend dùng đúng bảng chữ thường trong `SBA301-scriptDB.sql`. Không tự tạo bảng tên chữ hoa hay di chuyển dữ liệu từ bảng cũ. Không chạy lại toàn bộ script SQL trên dữ liệu đang sử dụng vì script chứa lệnh xóa schema.

## Phạm vi hiện tại

Đã nối flow **thanh toán tại cửa hàng** với API backend. Thanh toán online và hoàn tiền chưa có tích hợp cổng thật; server từ chối phương thức chưa hỗ trợ. Giữ các màn hình quản trị sản phẩm/thông số, PC builder và tiếp nhận/kỹ thuật bảo hành mới nhất từ `main`.

Thêm linh kiện từ cấu hình PC hiện tại hoặc cấu hình đã lưu cũng dùng API giỏ hàng. Backend chưa có API thêm cả cấu hình trong một transaction: FE gửi tuần tự từng phiên bản; nếu một phiên bản lỗi sau khi đã thêm các phiên bản trước, FE tải lại giỏ và thông báo phần đã thêm để khách kiểm tra trước khi thử lại. Hồ sơ hiển thị dữ liệu đăng nhập, chưa lưu thay đổi.

Bật `VITE_USE_DEMO_DATA=true` để chạy giao diện demo cũ. Chế độ API không ghi dữ liệu thương mại vào `techzone-demo-v1`.

## Kiểm thử

```powershell
npm test
npm run lint
npm run build
$env:PLAYWRIGHT_BROWSER_CHANNEL='msedge' # Nếu máy dùng Edge
npm run test:e2e
```

Playwright chạy demo (4175) và API (4176), gồm luồng Admin tạo promotion → Customer đặt hàng → Staff thu tiền/bàn giao → Customer xem hai thẻ bảo hành và review. HTTP được giả lập để kiểm tra UI và contract.

Bộ API còn kiểm tra tải lại trang sau mất phản hồi đặt hàng, giữ nguyên idempotency key/payload, bắt preview lại khi giá thay đổi, lỗi tồn kho, thêm cấu hình PC vào giỏ thật, và tách dữ liệu API khỏi localStorage demo.

Backend `.\mvnw.cmd test` dùng H2 riêng, kiểm tra quyền, idempotency, giá thay đổi, số tiền thu, serial, review, hoàn tồn, hạn mức voucher và rollback transaction; có kiểm thử hai khách đồng thời mua tồn cuối/tranh lượt voucher cuối. Các kiểm thử này không kết nối hoặc sửa Neon. Cần kiểm tra thêm trên môi trường PostgreSQL thử nghiệm trước khi triển khai thực tế.

### Xác minh ngày 23/10/2026 — nhánh Vu_BuyAnhPurchase

- `npm run build`: pass, gồm TypeScript và production bundle.
- `npm test`: 31/31 pass. Các test HTTP chạy ngoài sandbox vì sandbox chặn localhost.
- Playwright Edge `--project=api`: 14/14 pass, API được giả lập; gồm giỏ hàng, preview/đặt hàng, retry cùng yêu cầu sau mất phản hồi và reload, đổi giá, PC builder, hủy đơn 0 đồng, bàn giao có/không có bảo hành, xem thẻ và review.
- Playwright Edge demo: 3/3 test mua hàng–bàn giao, tiếp nhận–kỹ thuật bảo hành, và phân quyền Customer pass.
- `npm run check:architecture`: pass (225 file). ESLint phần tích hợp (`orders`, `cart`, `reviews`, `promotions`, `store`, `routes`, `warranty` và test API) pass.
- `npm run lint` toàn repo còn 6 lỗi có sẵn từ `main`: unused ở `ProductEditor`/`ProductManagement`; `set-state-in-effect` ở `VariantModal`, `useProductEditor`, `useProductManagement`.
- Backend: `mvn -o -B -Dtest=PurchaseApiTests,PickupOrderApiTests,PromotionManagementApiTests test`: 22/22 pass trên H2 riêng. Log: `D:\SBA_backend\target\pickup-fe-integration-tests.log`.

Đã đồng bộ `main` tại `f29c585`. Kiểm thử trình duyệt dùng HTTP giả lập, backend dùng MockMvc/H2; chưa chạy FE → backend → PostgreSQL/Neon xuyên suốt trong lượt này.

### Bản sửa main sau merge ngày 23/10/2026

Nhánh `Vu_BuyAnhPurchase` đã đồng bộ với `origin/main` tại `bf0c8dc`, khôi phục endpoint mua hàng và các hàm tải/cập nhật giỏ trong `StoreProvider`, xử lý trùng module API bảo hành, và mở lại các route từ main. Đã sửa toàn bộ 6 lỗi lint quản trị sản phẩm: form khởi tạo theo sản phẩm/phiên bản được chọn, giữ nội dung chưa lưu khi refresh, và tải dữ liệu bất đồng bộ có cleanup. Số tháng bảo hành bằng 0 được giữ nguyên khi sửa/lưu sản phẩm.

Kết quả: production build/TypeScript pass, `npm run lint` và kiểm tra kiến trúc pass, 31/31 unit/API test pass, 15/15 Playwright API test trên Edge pass. Test bổ sung kiểm tra sửa biến thể không làm mất bản nháp sản phẩm, chuyển sản phẩm/modal khởi tạo đúng dữ liệu và lưu bảo hành 0 tháng. Playwright vẫn dùng HTTP giả lập; chưa xác nhận toàn luồng với Neon thật. BE main đã được kiểm tra độc lập: 99/99 test trên H2 pass; bản sửa BE chỉ dọn dấu conflict trong README.
