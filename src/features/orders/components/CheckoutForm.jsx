import { useEffect } from "react";
import { money } from "@/utils";
import {
  Button,
  Empty,
  Heading,
  Icon,
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
    deliveryType,
    setDeliveryType,
    provinces = [],
    districts = [],
    wards = [],
    provinceId,
    setProvinceId,
    districtId,
    setDistrictId,
    wardCode,
    setWardCode,
    addressDetail,
    setAddressDetail,
    shippingFee = 0,
    calculatingFee = false,
    totalWeightGram = 1000,
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
          <KV label="Hình thức">
            {pendingAttempt.payload.deliveryType === "shipping"
              ? "Giao hàng tận nơi (GHN)"
              : "Nhận tại quầy"}
          </KV>
          {pendingAttempt.payload.shippingAddress && (
            <KV label="Địa chỉ">{pendingAttempt.payload.shippingAddress}</KV>
          )}
          <KV label="Thành tiền">
            {money(
              pendingAttempt.payload.expectedTotal +
                (pendingAttempt.payload.shippingFee || 0) -
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

  const finalAmount = total - discount + (deliveryType === "shipping" ? shippingFee : 0);
  const MAX_COD_AMOUNT = 20_000_000;
  const isCodOverLimit = deliveryType === "shipping" && finalAmount > MAX_COD_AMOUNT;

  useEffect(() => {
    if (isCodOverLimit && method === "cod") {
      setMethod("vnpay");
    }
  }, [isCodOverLimit, method, setMethod]);

  const paymentOptions =
    deliveryType === "shipping"
      ? [
          [
            "cod",
            "Thanh toán khi nhận hàng (COD)",
            isCodOverLimit
              ? "Đơn hàng trên 20.000.000đ không hỗ trợ thu hộ COD. Vui lòng thanh toán qua VNPAY."
              : "Nhân viên giao hàng GHN sẽ thu tiền mặt khi giao hàng tận nơi (tối đa 20.000.000đ).",
            isCodOverLimit
          ],
          [
            "vnpay",
            "Cổng thanh toán VNPAY",
            "Quét mã VNPAY-QR hoặc thanh toán qua thẻ ATM / Internet Banking (Tiền COD = 0đ).",
            false
          ],
        ]
      : [
          [
            "store",
            "Thanh toán tại cửa hàng",
            "Thu đủ tiền khi bạn đến nhận hàng tại quầy TechZone.",
            false
          ],
          [
            "vnpay",
            "Cổng thanh toán VNPAY",
            "Thanh toán trước qua VNPAY, chỉ cần đến đối chiếu và nhận hàng.",
            false
          ],
        ];

  return (
    <>
      <Heading
        title={fromBuild ? "Đặt mua cấu hình PC" : "Xác nhận đơn hàng"}
        sub="Kiểm tra phương thức nhận hàng, người nhận, ưu đãi và thanh toán."
      />
      <Steps
        labels={["Chọn sản phẩm", "Thông tin & thanh toán", "Theo dõi đơn"]}
        current={1}
      />
      <form onSubmit={submit}>
        <div className="split">
          <div className="stack">
            {/* 01 · HÌNH THỨC NHẬN HÀNG */}
            <Panel title="01 · Hình thức nhận hàng">
              <div className="two-col section">
                <label
                  className={
                    "selection " + (deliveryType === "store" ? "selected" : "")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="store"
                    checked={deliveryType === "store"}
                    onChange={() => setDeliveryType("store")}
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ marginTop: "2px", color: deliveryType === "store" ? "var(--red)" : "var(--muted)" }}>
                      <Icon name="store" />
                    </div>
                    <div>
                      <b>Nhận tại cửa hàng</b>
                      <p className="small muted">
                        Đến trực tiếp cửa hàng TechZone (Miễn phí).
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={
                    "selection " +
                    (deliveryType === "shipping" ? "selected" : "")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="shipping"
                    checked={deliveryType === "shipping"}
                    onChange={() => setDeliveryType("shipping")}
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ marginTop: "2px", color: deliveryType === "shipping" ? "var(--red)" : "var(--muted)" }}>
                      <Icon name="truck" />
                    </div>
                    <div>
                      <b>Giao hàng tận nơi (GHN Express)</b>
                      <p className="small muted">
                        Giao nhanh toàn quốc, theo dõi hành trình trực tiếp.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* THÔNG TIN NGƯỜI NHẬN */}
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

              {/* NẾU GIAO HÀNG TẬN NƠI: CHỌN ĐỊA CHỈ */}
              {deliveryType === "shipping" && (
                <div className="section stack" style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label className="field-label">Tỉnh / Thành phố *</label>
                      <select
                        className="input full"
                        value={provinceId}
                        required
                        onChange={(e) => setProvinceId(e.target.value)}
                      >
                        <option value="">-- Chọn Tỉnh/Thành --</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Quận / Huyện *</label>
                      <select
                        className="input full"
                        value={districtId}
                        required
                        disabled={!provinceId}
                        onChange={(e) => setDistrictId(e.target.value)}
                      >
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Phường / Xã *</label>
                      <select
                        className="input full"
                        value={wardCode}
                        required
                        disabled={!districtId}
                        onChange={(e) => setWardCode(e.target.value)}
                      >
                        <option value="">-- Chọn Phường/Xã --</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    label="Số nhà, tên đường (Địa chỉ cụ thể) *"
                    value={addressDetail}
                    required
                    placeholder="VD: 123 Lê Lợi, Chung cư..."
                    maxLength={200}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />

                  <Notice tone={shippingFee > 0 ? "info" : "default"}>
                    {calculatingFee
                      ? `Đang tính phí vận chuyển GHN cho kiện hàng ~${((totalWeightGram || 1000) / 1000).toFixed(1)} kg...`
                      : shippingFee > 0
                      ? `Phí vận chuyển GHN: ${money(shippingFee)} (Khối lượng đóng gói: ~${((totalWeightGram || 1000) / 1000).toFixed(1)} kg · Giao dự kiến 2 - 3 ngày)`
                      : "Vui lòng chọn Phường/Xã để tính cước phí vận chuyển GHN."}
                  </Notice>
                </div>
              )}

              {deliveryType === "store" && (
                <div className="section">
                  <Notice>
                    Nhận tại showroom TechZone (Quận 12, TP.HCM). Cửa hàng sẽ
                    thông báo khi đơn hàng sẵn sàng để bạn đến nhận.
                  </Notice>
                </div>
              )}

              <div className="section">
                <Field
                  label="Ghi chú giao hàng / nhận hàng"
                  value={note}
                  maxLength={2000}
                  placeholder="Ghi chú thêm cho nhân viên đóng gói / shipper..."
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </Panel>

            {/* 02 · PHƯƠNG THỨC THANH TOÁN */}
            <Panel title="02 · Phương thức thanh toán">
              {paymentOptions.map(([value, label, desc, disabled]) => (
                <label
                  className={
                    "selection " + (method === value ? "selected" : "")
                  }
                  key={value}
                  style={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    disabled={disabled}
                    checked={method === value}
                    onChange={() => !disabled && setMethod(value)}
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ marginTop: "2px", color: method === value ? "var(--red)" : "var(--muted)" }}>
                      <Icon name={value === "vnpay" ? "creditCard" : value === "cod" ? "cash" : "store"} />
                    </div>
                    <div>
                      <b>{label}</b>
                      {disabled && (
                        <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--red)", fontWeight: "normal" }}>
                          (Vượt hạn mức COD)
                        </span>
                      )}
                      <p className="small muted">{desc}</p>
                    </div>
                  </div>
                </label>
              ))}
              {isCodOverLimit && (
                <Notice tone="warning" style={{ marginTop: "12px" }}>
                  ⚠️ Đơn hàng có giá trị trên 20.000.000đ ({money(finalAmount)}) vượt hạn mức thu hộ tiền mặt khi giao hàng (COD). Quý khách vui lòng chọn Cổng thanh toán trực tuyến VNPAY.
                </Notice>
              )}
            </Panel>

            {/* 03 · KIỂM TRA SẢN PHẨM */}
            <Panel title="03 · Kiểm tra sản phẩm">
              <OrderLines lines={lines} products={data.products} />
            </Panel>
          </div>

          {/* ASIDE CỘT PHẢI */}
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
              <KV label="Vận chuyển (GHN)">
                {deliveryType === "shipping"
                  ? calculatingFee
                    ? "Đang tính…"
                    : `${money(shippingFee)} (~${((totalWeightGram || 1000) / 1000).toFixed(1)} kg)`
                  : "Miễn phí"}
              </KV>
              <div className="divider" />
              <KV label="Cần thanh toán" total>
                {money(finalAmount)}
              </KV>

              <p className="small muted section">
                Hình thức:{" "}
                {deliveryType === "shipping"
                  ? "Giao tận nơi GHN · " +
                    (method === "cod" ? "Thu tiền khi nhận (COD)" : "VNPAY Online")
                  : "Tại cửa hàng · " +
                    (method === "store" ? "Thu tiền tại quầy" : "VNPAY Online")}
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
                  {method === "vnpay"
                    ? "Sau khi bấm đặt hàng, bạn sẽ được chuyển sang cổng thanh toán trực tuyến VNPAY để quét mã VNPAY-QR hoặc thanh toán thẻ ATM / Mobile Banking an toàn."
                    : deliveryType === "shipping"
                    ? "Nhân viên giao hàng GHN Express sẽ thu tiền mặt khi giao hàng tận nơi cho bạn."
                    : "Bạn thanh toán tiền mặt hoặc quẹt thẻ tại quầy khi đến nhận linh kiện."}
                </Notice>
              </div>

              <Button
                type="submit"
                className="full"
                disabled={placing || validating || !lines.length || calculatingFee}
              >
                {placing
                  ? "Đang đặt hàng…"
                  : method === "vnpay"
                  ? "Tiến hành thanh toán VNPAY →"
                  : "Xác nhận đặt hàng →"}
              </Button>
            </Panel>
          </aside>
        </div>
      </form>
    </>
  );
}
