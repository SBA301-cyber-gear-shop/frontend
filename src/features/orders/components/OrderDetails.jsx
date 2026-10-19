import { dateTime, money } from "@/utils";
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
import { Field } from "@/components/form";
import { useOrderDetails } from "../hooks/useOrderDetails";

export function OrderDetails() {
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
    rating,
    setRating,
    comment,
    setComment,
    order,
    act,
    labels,
    index,
    saveReview,
    loading,
    error,
    refresh,
    busy,
  } = useOrderDetails();
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
        sub={id + " · " + dateTime(order.createdAt)}
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
            <Panel title="Đánh giá sản phẩm">
              {order.lines.map((l) => (
                <div className="between section" key={l.id}>
                  <span>{l.name}</span>
                  <Button
                    tone="secondary"
                    onClick={() => {
                      const r = data.reviews.find(
                        (r) => r.orderId === id && r.productId === l.id,
                      );
                      setRating(r?.rating || 5);
                      setComment(r?.comment || "");
                      setReview(l.id);
                    }}
                  >
                    Đánh giá
                  </Button>
                </div>
              ))}
            </Panel>
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
              order.payment !== "SUCCESS" && (
                <Button
                  className="full"
                  tone="ghost"
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
            <Button tone="secondary" onClick={() => setConfirm(false)}>
              Giữ đơn
            </Button>
            <Button disabled={busy} onClick={() => act("cancel")}>
              Xác nhận hủy
            </Button>
          </div>
        </Modal>
      )}
      {review && (
        <Modal title="Đánh giá sản phẩm" onClose={() => setReview(null)}>
          <Field label="Số sao">
            {(id) => (
              <select
                id={id}
                className="input"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((v) => (
                  <option key={v} value={v}>
                    {v} sao
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Nhận xét">
            {(id) => (
              <textarea
                id={id}
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            )}
          </Field>
          <Button disabled={busy} onClick={saveReview}>
            Lưu đánh giá
          </Button>
        </Modal>
      )}
    </>
  );
}
