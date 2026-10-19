import { useState } from "react";
import { Button, Heading, Notice, Panel, Empty } from "@/components/ui";
import "./ExceptionGallery.scss";

export function ExceptionGallery() {
  const [retry, setRetry] = useState(false);
  return (
    <div className="exception-gallery">
      <Heading
        title="Thông báo rõ vấn đề. Hướng dẫn bước tiếp theo."
        sub="Các trạng thái hỗ trợ trong luồng mua hàng và cấu hình PC."
      />
      <div className="two-col">
        {[
          [
            "Giá đã thay đổi",
            "Kiểm tra giá hiện tại trong giỏ và xác nhận lại trước khi đặt hàng.",
            "/gio-hang",
            "Xem giỏ hàng",
          ],
          [
            "Voucher không áp dụng",
            "Mã có thể hết hạn, hết lượt hoặc đã sử dụng. Bạn vẫn có thể mua không dùng mã.",
            "/thanh-toan",
            "Quay lại thanh toán",
          ],
          [
            "Số lượng chưa đáp ứng",
            "Giảm số lượng hoặc chọn một phiên bản khác còn hàng.",
            "/san-pham",
            "Chọn phiên bản khác",
          ],
          [
            "Cấu hình chưa đủ thông số",
            "Thay linh kiện có dữ liệu đầy đủ hoặc nhờ kỹ thuật viên xác minh.",
            "/build-pc",
            "Kiểm tra cấu hình",
          ],
        ].map(([title, body, to, cta]) => (
          <Panel title={title} key={title}>
            <Notice tone="warning">{body}</Notice>
            <Button to={to} className="section">
              {cta}
            </Button>
          </Panel>
        ))}
        <Panel title="Không thể tải dữ liệu">
          {retry ? (
            <Notice tone="success">Kết nối demo đã khôi phục.</Notice>
          ) : (
            <Notice tone="danger">
              Chưa thể tải dữ liệu. Giỏ hàng của bạn vẫn được giữ.
            </Notice>
          )}
          <Button className="section" onClick={() => setRetry(!retry)}>
            {retry ? "Mô phỏng lỗi" : "Thử lại"}
          </Button>
        </Panel>
        <Panel title="Chưa có kết quả">
          <Empty
            title="Không tìm thấy sản phẩm"
            description="Thử từ khóa khác hoặc xóa bộ lọc."
            action={<Button to="/san-pham">Xóa bộ lọc</Button>}
          />
        </Panel>
      </div>
    </div>
  );
}

export default ExceptionGallery;
