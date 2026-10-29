import { money } from "@/utils";
import {
  Button,
  Empty,
  Heading,
  KV,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { Field } from "@/components/form";
import { OrderLines } from "@/features/products";
import { useCheckout } from "../hooks/useCheckout";

export function CheckoutForm() {
  const {
    data,
    user,
    fromBuild,
    lines,
    total,
    name,
    setName,
    phone,
    setPhone,
    note,
    setNote,
    method,
    setMethod,
    inputCode,
    setInputCode,
    applied,
    setApplied,
    error,
    placing,
    applying,
    discount,
    promoError,
    apply,
    submit,
    demoMode,
    validating,
    retryValidation,
    pendingAttempt,
  } = useCheckout();

  if (!demoMode && pendingAttempt)
    return (
      <div className="stack">
        <Heading title="Kiểm tra kết quả đặt hàng" />
        <Notice tone="warning">
          {error ||
            "Yêu cầu đặt hàng trước chưa có kết quả xác nhận. Kiểm tra lại cùng yêu cầu để tránh tạo đơn trùng."}
        </Notice>
        <Panel title="Yêu cầu đã gửi">
          <KV label="Người nhận">{pendingAttempt.payload.pickupName}</KV>
          <KV label="Điện thoại">{pendingAttempt.payload.pickupPhone}</KV>
          <KV label="Thành tiền">
            {money(
              pendingAttempt.payload.expectedTotal -
                pendingAttempt.payload.expectedDiscount,
            )}
          </KV>
        </Panel>
        <Button disabled={placing} onClick={submit}>
          {placing ? "Đang kiểm tra…" : "Kiểm tra lại yêu cầu đặt hàng"}
        </Button>
        <Button to="/don-hang" tone="secondary">
          Xem đơn hàng của tôi
        </Button>
      </div>
    );

  if (!demoMode && fromBuild)
    return (
      <Notice>
        Cấu hình PC chưa hỗ trợ đặt hàng trực tiếp. Vui lòng chọn từng sản phẩm
        và thêm vào giỏ hàng.
      </Notice>
    );

  if (validating)
    return <Notice>Đang kiểm tra giá và tồn kho với cửa hàng…</Notice>;

  if (!demoMode && error && !lines.length)
    return (
      <div className="stack">
        <Notice tone="danger">{error}</Notice>
        <Button onClick={retryValidation}>Kiểm tra lại</Button>
        <Button to="/gio-hang">Về giỏ hàng</Button>
      </div>
    );

  if (!lines.length)
    return (
      <Empty
        title="Chưa có sản phẩm để đặt hàng"
        action={<Button to="/san-pham">Chọn sản phẩm</Button>}
      />
    );

  return (
    <>
      <Heading
        title={fromBuild ? "Đặt mua cấu hình PC" : "Xác nhận đơn hàng"}
        sub="Kiểm tra người nhận, ưu đãi và phương thức thanh toán."
      />
      <Steps
        labels={["Chọn sản phẩm", "Thông tin & thanh toán", "Theo dõi đơn"]}
        current={1}
      />
      <form onSubmit={submit}>
        <div className="split">
          <div className="stack">
            <Panel title="01 · Người nhận tại cửa hàng">
              <p className="small muted">
                Đơn hàng thuộc tài khoản {user.email}.
              </p>
              <div className="two-col section">
                <Field
                  label="Họ tên người nhận"
                  value={name}
                  required
                  autoComplete="name"
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  label="Số điện thoại người nhận"
                  value={phone}
                  required
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="section">
                <Field
                  label="Ghi chú cho cửa hàng"
                  value={note}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="section">
                <Notice>
                  Nhận tại cửa hàng TechZone. Chờ xác nhận sẵn sàng trước khi
                  đến nhận. Địa điểm nhận cần được cửa hàng cấu hình khi triển
                  khai.
                </Notice>
              </div>
            </Panel>
            <Panel title="02 · Phương thức thanh toán">
              {(demoMode
                ? [
                    [
                      "store",
                      "Thanh toán tại cửa hàng",
                      "Thu đủ tiền khi bạn đến nhận hàng.",
                    ],
                    [
                      "online",
                      "Thanh toán online · Demo",
                      "Chưa tích hợp cổng thanh toán thật. Bạn sẽ được chọn kết quả mô phỏng.",
                    ],
                  ]
                : [
                    [
                      "store",
                      "Thanh toán tại cửa hàng",
                      "Thu đủ tiền khi bạn đến nhận hàng.",
                    ],
                  ]
              ).map(([value, label, desc]) => (
                <label
                  className={
                    "selection " + (method === value ? "selected" : "")
                  }
                  key={value}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                  />
                  <div>
                    <b>{label}</b>
                    <p className="small muted">{desc}</p>
                  </div>
                </label>
              ))}
            </Panel>
            <Panel title="03 · Kiểm tra sản phẩm">
              <OrderLines lines={lines} products={data.products} />
            </Panel>
          </div>
          <aside className="stack">
            <Panel title="Mã giảm giá">
              <div className="row gap8">
                <input
                  className="input flex"
                  aria-label="Mã giảm giá"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Nhập mã"
                />
                <Button
                  tone="secondary"
                  type="button"
                  onClick={apply}
                  disabled={placing || applying || (!!error && !demoMode)}
                >
                  {applying ? "Đang kiểm tra…" : "Áp dụng"}
                </Button>
              </div>
              {applied && !promoError && (
                <div className="section">
                  <Notice tone="success">
                    {applied} · Giảm {money(discount)}{" "}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setApplied("")}
                    >
                      Bỏ mã
                    </button>
                  </Notice>
                </div>
              )}
              {promoError && (
                <div className="section">
                  <Notice tone="danger">{promoError}</Notice>
                </div>
              )}
              <p className="tiny muted section">
                Một mã mỗi đơn · Mỗi khách dùng một lần.
              </p>
            </Panel>
            <Panel title="Chi tiết thanh toán" className="summary">
              <KV label="Tiền hàng">{money(total)}</KV>
              <KV label="Giảm giá">−{money(discount)}</KV>
              <KV label="Cần thanh toán" total>
                {money(total - discount)}
              </KV>
              <p className="small muted section">
                Nhận tại cửa hàng ·{" "}
                {method === "store" ? "Thanh toán tại quầy" : "Online mô phỏng"}
              </p>
              {error && (
                <div className="section stack">
                  <Notice tone="danger">{error}</Notice>
                  {!demoMode && (
                    <Button tone="secondary" onClick={retryValidation}>
                      Kiểm tra lại giỏ hàng
                    </Button>
                  )}
                </div>
              )}
              <div className="section">
                <Notice>
                  Thanh toán tại cửa hàng khi đến nhận sản phẩm.
                </Notice>
              </div>
              <Button
                type="submit"
                className="full"
                disabled={placing || validating || !lines.length}
              >
                {placing
                  ? demoMode
                    ? "Đang tạo đơn…"
                    : "Đang đặt hàng…"
                  : "Xác nhận đặt hàng →"}
              </Button>
              <p className="tiny muted section">
                Đặt hàng thành công chưa có nghĩa đã thanh toán hoặc hàng đã sẵn
                sàng.
              </p>
            </Panel>
          </aside>
        </div>
      </form>
    </>
  );
}
