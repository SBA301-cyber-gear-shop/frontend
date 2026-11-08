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

  const paymentOptions =
    deliveryType === "shipping"
      ? [
          [
            "cod",
            "Thanh toán khi nhận hàng (COD)",
            "Nhân viên giao hàng GHN sẽ thu tiền mặt khi giao hàng tận nơi.",
          ],
          [
            "vnpay",
            "Cổng thanh toán VNPAY Sandbox",
            "Quét mã QR bằng App ngân hàng hoặc thẻ ATM NCB test (Tiền COD = 0đ).",
          ],
        ]
      : [
          [
            "store",
            "Thanh toán tại cửa hàng",
            "Thu đủ tiền khi bạn đến nhận hàng tại quầy TechZone.",
          ],
          [
            "vnpay",
            "Cổng thanh toán VNPAY Sandbox",
            "Thanh toán trước qua VNPAY, chỉ cần đến đối chiếu và nhận hàng.",
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
                  <div>
                    <b>🏪 Nhận tại cửa hàng</b>
                    <p className="small muted">
                      Đến trực tiếp cửa hàng TechZone (Miễn phí).
                    </p>
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
                  <div>
                    <b>🚚 Giao hàng tận nơi (GHN Express)</b>
                    <p className="small muted">
                      Giao nhanh toàn quốc, theo dõi hành trình trực tiếp.
                    </p>
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
                      ? "Đang tính phí vận chuyển GHN từ kho Quận 12..."
                      : shippingFee > 0
                      ? `Phí vận chuyển GHN: ${money(shippingFee)} (Thời gian giao dự kiến 2 - 3 ngày)`
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
              {paymentOptions.map(([value, label, desc]) => (
                <label
                  className={
                    "selection " + (method === value ? "selected" : "")
                  }
                  key={value}
                  style={{ cursor: "pointer" }}
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
                    : money(shippingFee)
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
                    ? "Sau khi bấm đặt hàng, bạn sẽ được chuyển sang cổng VNPAY Sandbox để quét mã hoặc nhập thẻ test NCB."
                    : deliveryType === "shipping"
                    ? "Shipper GHN sẽ thu tiền mặt khi giao hàng tận nhà cho bạn."
                    : "Bạn thanh toán tiền mặt tại quầy khi đến nhận linh kiện."}
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
