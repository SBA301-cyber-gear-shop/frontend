import { dateTime, money, formatShortOrderCode, formatOrderSuffix } from "@/utils";
import { useState, useEffect } from "react";
import { paymentApi } from "../api/paymentApi";
import { shippingApi } from "../api/shippingApi";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants";
import { OrderLines } from "@/features/products";
import {
  Badge,
  Button,
  Empty,
  Heading,
  Icon,
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

  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const fetchTracking = async () => {
    if (!id || order?.deliveryType !== "shipping") return;
    setTrackingLoading(true);
    try {
      const data = await shippingApi.getTracking(id);
      setTracking(data);
    } catch (err) {
      // Ignored
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id, order?.deliveryType]);

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
              ? order.deliveryType === "shipping"
                ? "Đơn hàng đã được bàn giao cho đơn vị vận chuyển GHN."
                : "Đơn đã sẵn sàng. Vui lòng đối chiếu thông tin và thanh toán đủ trước khi nhận."
              : order.status === "delivering"
                ? "Kiện hàng đang được nhân viên giao hàng GHN giao đến địa chỉ của bạn. Vui lòng chú ý điện thoại."
              : order.status === "completed"
                ? "Đơn hàng đã giao thành công. Thông tin bảo hành theo từng thiết bị có trong tài khoản."
                : order.status === "canceled"
                  ? "Đơn đã được hủy. Số lượng giữ hàng đã được giải phóng."
                  : order.deliveryType === "shipping"
                  ? "Cửa hàng đang xử lý đóng gói đơn hàng để bàn giao cho GHN Express."
                  : "Cửa hàng đang xử lý đơn. Vui lòng chờ thông báo sẵn sàng trước khi đến nhận."}
          </Notice>

          {/* KHỐI HÀNH TRÌNH VẬN CHUYỂN GHN TRỰC TIẾP TRÊN WEB */}
          {order.deliveryType === "shipping" && (
            <Panel
              title="Hành trình vận chuyển (GHN Express)"
              action={
                <Button
                  tone="ghost"
                  disabled={trackingLoading}
                  onClick={fetchTracking}
                >
                  {trackingLoading ? "Đang đồng bộ…" : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Icon name="refresh" />
                      Làm mới hành trình
                    </span>
                  )}
                </Button>
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <span className="small muted">Mã vận đơn GHN:</span>
                  <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--primary)" }}>
                    {tracking?.trackingCode || order.trackingCode || "Đang tạo vận đơn..."}
                  </div>
                  {(tracking?.trackingCode || order.trackingCode) && (
                    <div style={{ marginTop: "4px" }}>
                      <a
                        href={`https://tracking.ghn.dev/?order_code=${tracking?.trackingCode || order.trackingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "#0284c7",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        <Icon name="search" /> Tra cứu trực tuyến trên GHN ↗
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <span className="small muted">Trạng thái vận chuyển:</span>
                  <div>
                    <Badge tone={tracking?.status === "delivered" ? "success" : "info"}>
                      {tracking?.statusText || "Đang xử lý tại kho CyberShop"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="small muted">Dự kiến nhận hàng:</span>
                  <div style={{ fontWeight: 500 }}>
                    {tracking?.expectedDeliveryTime || "2 - 3 ngày"}
                  </div>
                </div>
              </div>

              {/* TIMELINE CÁC BƯỚC ĐI QUA */}
              <div style={{ marginTop: "16px" }}>
                <b style={{ fontSize: "14px", display: "block", marginBottom: "12px" }}>
                  Lịch sử hành trình kiện hàng:
                </b>
                {tracking?.logs && tracking.logs.length > 0 ? (
                  <div className="stack" style={{ gap: "12px", paddingLeft: "8px" }}>
                    {tracking.logs.map((logItem, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "12px",
                          position: "relative",
                          borderLeft: "2px solid var(--primary, #3b82f6)",
                          paddingLeft: "12px",
                          paddingBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: idx === 0 ? "#10b981" : "#94a3b8",
                            position: "absolute",
                            left: "-5px",
                            top: "6px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <b style={{ fontSize: "13px" }}>{logItem.description}</b>
                            <span className="small muted">{logItem.time}</span>
                          </div>
                          {logItem.location && (
                            <p className="tiny muted" style={{ marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Icon name="pin" /> {logItem.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small muted" style={{ fontStyle: "italic" }}>
                    Đơn hàng mới tạo. Lịch sử di chuyển sẽ được cập nhật liên tục ngay khi bưu tá GHN nhận kiện hàng.
                  </div>
                )}
              </div>
            </Panel>
          )}

          <OrderLines lines={order.lines} products={data.products} />

          <Panel title="Thông tin nhận hàng">
            <div className="two-col">
              <KV label="Người nhận">{order.pickupName}</KV>
              <KV label="Điện thoại">{order.pickupPhone}</KV>
            </div>
            <div className="section">
              <KV label="Hình thức">
                {order.deliveryType === "shipping" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="truck" /> Giao hàng tận nơi qua GHN Express
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="store" /> Nhận tại quầy TechZone Flagship Store
                  </span>
                )}
              </KV>
              {order.shippingAddress && (
                <KV label="Địa chỉ giao hàng">{order.shippingAddress}</KV>
              )}
            </div>
            <p className="small muted section">
              {order.note || "Không có ghi chú thêm."}
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
              {order.deliveryType === "shipping" && (
                <KV label="Phí vận chuyển (GHN)">{money(order.shippingFee)}</KV>
              )}
              <div className="divider" />
              <KV label="Thành tiền" total>
                {money(order.final)}
              </KV>
            </div>
            <p className="small muted section">
              Phương thức:{" "}
              {order.method === "store"
                ? "Tại quầy TechZone"
                : order.method === "cod"
                ? "Tiền mặt khi nhận hàng (COD)"
                : order.method === "vnpay"
                ? "Cổng thanh toán VNPAY"
                : "Online · Demo"}
            </p>
            {order.method === "vnpay" &&
              !["SUCCESS", "CANCELED"].includes(order.payment) &&
              order.status !== "canceled" && (
                <div className="section stack">
                  <Notice tone="info">
                    Đơn hàng thanh toán trực tuyến qua cổng VNPAY.
                  </Notice>
                  <Button
                    className="full"
                    onClick={async () => {
                      try {
                        const data = await paymentApi.createVnPayUrl(id);
                        if (data?.paymentUrl) {
                          window.location.href = data.paymentUrl;
                        }
                      } catch (err) {
                        notify(
                          err.response?.data?.message ||
                            "Không thể tạo liên kết thanh toán VNPAY lúc này.",
                          "danger",
                        );
                      }
                    }}
                  >
                    Thanh toán ngay qua VNPAY →
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
