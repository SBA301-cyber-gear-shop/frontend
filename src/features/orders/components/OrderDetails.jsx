import {
  dateTime,
  money,
  formatShortOrderCode,
} from "@/utils";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants";
import { OrderLines } from "@/features/products";
import {
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { ReviewComposer, ReviewViewer } from "@/features/reviews";

export function OrderDetails() {
  const { hash } = useLocation();
  const reviewSection = useRef(null);
  const [viewReview, setViewReview] = useState(null);
  const {
    id,
    params,
    data,
    commit,
    notify,
    confirm,
    setConfirm,
    review,
    setReview,
    order,
    act,
    labels,
    index,
    loading,
    error,
    refresh,
    reloadCatalog,
    busy,
    demoMode,
  } = useOrderDetails();
  useEffect(() => {
    if (hash === "#order-reviews" && order?.status === "completed") {
      reviewSection.current?.scrollIntoView({ block: "start" });
      reviewSection.current?.focus({ preventScroll: true });
    }
  }, [hash, order?.status, id]);
  if (loading) return <Notice>Đang tải đơn hàng…</Notice>;
  if (error)
    return (
      <div className="stack">
        <Notice tone="danger">{error}</Notice>
        <Button onClick={refresh}>Tải lại đơn hàng</Button>
      </div>
    );
  if (!order)
    return (
      <Empty
        title="Không tìm thấy đơn của bạn"
        action={<Button to="/don-hang">Về danh sách đơn</Button>}
      />
    );
  return (
    <>
      <Heading
        title={
          params.has("created")
            ? "Đã tạo đơn hàng của bạn"
            : "Chi tiết đơn hàng"
        }
        sub={formatShortOrderCode(id) + " · " + dateTime(order.createdAt)}
        action={
          <Badge tone={order.status === "completed" ? "success" : "info"}>
            {ORDER_STATUS[order.status]}
          </Badge>
        }
      />
      {order.status !== "canceled" && <Steps labels={labels} current={index} />}
      <div className="split">
        <div className="stack">
          <Notice tone={order.status === "canceled" ? "danger" : "info"}>
            {order.status === "ready_for_pickup"
              ? "Đơn đã sẵn sàng. Vui lòng đối chiếu thông tin và thanh toán đủ trước khi nhận."
              : order.status === "completed"
                ? "Bạn đã nhận hàng. Thông tin bảo hành theo từng thiết bị có trong tài khoản."
                : order.status === "canceled"
                  ? "Đơn đã được hủy. Số lượng giữ hàng đã được giải phóng."
                  : "Cửa hàng đang xử lý đơn. Vui lòng chờ thông báo sẵn sàng trước khi đến nhận."}
          </Notice>
          <OrderLines lines={order.lines} products={data.products} />
          <Panel title="Thông tin nhận hàng">
            <div className="two-col">
              <KV label="Người nhận">{order.pickupName}</KV>
              <KV label="Điện thoại">{order.pickupPhone}</KV>
            </div>
            <p className="small muted section">
              {order.note || "Không có ghi chú."}
            </p>
          </Panel>
          {order.status === "completed" && (
            <section
              id="order-reviews"
              ref={reviewSection}
              tabIndex={-1}
              aria-label="Đánh giá sản phẩm đã nhận"
              style={{ scrollMarginTop: 24 }}
            >
              <Panel title="Đánh giá sản phẩm">
                {order.lines.map((l) => (
                  <div className="between section" key={l.id}>
                    <span>{l.name}</span>
                    {l.review || (demoMode && data.reviews.some((entry) => entry.orderId === order.id && entry.productId === l.id)) ? <div className="row wrap-row"><Badge tone="success">Đã đánh giá</Badge><Button tone="secondary" onClick={() => setViewReview(l.id)}>Xem đánh giá</Button></div> : <Button
                      tone="secondary"
                      onClick={() => {
                        setReview(l.id);
                      }}
                    >
                      Đánh giá
                    </Button>}
                  </div>
                ))}
              </Panel>
            </section>
          )}
        </div>
        <aside className="stack">
          <Panel title="Thanh toán" className="summary">
            <Badge tone={order.payment === "SUCCESS" ? "success" : "warning"}>
              {PAYMENT_STATUS[order.payment]}
            </Badge>
            <div className="section">
              <KV label="Tiền hàng">{money(order.total)}</KV>
              <KV label={"Voucher " + (order.promotion || "")}>
                −{money(order.discount)}
              </KV>
              <KV label="Thành tiền" total>
                {money(order.final)}
              </KV>
            </div>
            <p className="small muted section">
              Phương thức:{" "}
              {order.method === "store" ? "Tại cửa hàng" : "Online · Demo"}
            </p>
            {order.method === "online" &&
              !["SUCCESS", "CANCELED"].includes(order.payment) &&
              order.status !== "canceled" && (
                <div className="section">
                  <Notice tone="warning">
                    Mô phỏng kết quả cổng thanh toán. Không thu tiền thật.
                  </Notice>
                  <Button className="full" onClick={() => act("pay")}>
                    Mô phỏng thanh toán thành công
                  </Button>
                  <Button
                    tone="secondary"
                    className="full"
                    onClick={() => {
                      commit((d) => ({
                        ...d,
                        orders: d.orders.map((o) =>
                          o.id === id ? { ...o, payment: "FAILED" } : o,
                        ),
                      }));
                      notify(
                        "Đã mô phỏng thất bại; bạn có thể thử lại.",
                        "danger",
                      );
                    }}
                  >
                    Mô phỏng thất bại
                  </Button>
                </div>
              )}
            <Button to="/don-hang" tone="secondary" className="full">
              Về đơn hàng của tôi
            </Button>
            {["pending", "confirmed"].includes(order.status) &&
              (order.payment !== "SUCCESS" || order.final === 0) && (
                <Button
                  className="full"
                  tone="ghost"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  Hủy đơn hàng
                </Button>
              )}
          </Panel>
        </aside>
      </div>
      {confirm && (
        <Modal title="Hủy đơn hàng?" onClose={() => setConfirm(false)}>
          <p>
            Hàng đã giữ sẽ được giải phóng. Voucher đã gắn đơn không được chuyển
            sang đơn khác theo chính sách mỗi khách dùng một lần.
          </p>
          <div className="row section">
            <Button
              tone="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Giữ đơn
            </Button>
            <Button disabled={busy} onClick={() => act("cancel")}>
              Xác nhận hủy
            </Button>
          </div>
        </Modal>
      )}
      {review && (
        <ReviewComposer key={review} order={{ ...order, lines: order.lines.filter((line) => line.id === review) }} demoMode={demoMode} onClose={() => setReview(null)} onSaved={() => { refresh(); void reloadCatalog(); notify("Đã lưu đánh giá."); }} />
      )}
      {viewReview && <ReviewViewer key={viewReview} order={{ ...order, lines: order.lines.filter((line) => line.id === viewReview) }} demoMode={demoMode} onClose={() => setViewReview(null)} />}
    </>
  );
}
