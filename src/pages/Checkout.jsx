import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../state/context";
import { money, totalOf, promotionQuote, placeOrder } from "../domain/commerce";
import {
  Art,
  Button,
  Empty,
  Field,
  Heading,
  KV,
  Notice,
  Panel,
  Quantity,
  Steps,
} from "../components/ui";
export function OrderLines({
  lines,
  products,
  editable = false,
  onChange,
  onRemove,
}) {
  return (
    <div className="panel">
      {lines.map((l) => {
        const p = products.find((p) => p.id === l.id);
        return (
          <div className="cart-line" key={l.id}>
            <Art type={p?.category} className="small-art" />
            <div>
              <Link to={"/san-pham/" + l.id}>
                <h3>{l.name || p?.name || "Không tìm thấy sản phẩm"}</h3>
              </Link>
              <p>{l.variant || p?.variant}</p>
              <p>
                Đơn giá <b>{money(l.unitPrice ?? p?.price)}</b>
              </p>
            </div>
            {editable ? (
              <Quantity
                label={"Số lượng " + p?.name}
                value={l.quantity}
                max={Math.max(l.quantity, p?.stock || 0)}
                onChange={(q) => onChange(l.id, q)}
              />
            ) : (
              <span>SL: {l.quantity}</span>
            )}
            <div>
              <div className="price">
                {money(l.quantity * (l.unitPrice ?? p?.price ?? 0))}
              </div>
              {editable && (
                <button
                  className="remove text-button"
                  onClick={() => onRemove(l.id)}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function Cart() {
  const { data, commit } = useStore();
  if (!data.cart.length)
    return (
      <>
        <Heading title="Giỏ hàng của bạn" />
        <Empty
          title="Giỏ hàng đang trống"
          description="Bắt đầu bằng một linh kiện phù hợp với góc máy của bạn."
          action={<Button to="/san-pham">Khám phá sản phẩm →</Button>}
        />
      </>
    );
  return (
    <>
      <Heading
        title="Giỏ hàng của bạn"
        sub={
          data.cart.length +
          " phiên bản · " +
          data.cart.reduce((s, l) => s + l.quantity, 0) +
          " sản phẩm"
        }
        action={
          <Button to="/san-pham" tone="secondary">
            ← Tiếp tục mua sắm
          </Button>
        }
      />
      <Steps
        labels={["Giỏ hàng", "Thông tin & thanh toán", "Theo dõi đơn"]}
        current={0}
      />
      <div className="split">
        <div className="stack">
          <OrderLines
            lines={data.cart}
            products={data.products}
            editable
            onChange={(id, q) =>
              commit((d) => ({
                ...d,
                cart: d.cart.map((l) =>
                  l.id === id ? { ...l, quantity: q } : l,
                ),
              }))
            }
            onRemove={(id) =>
              commit((d) => ({ ...d, cart: d.cart.filter((l) => l.id !== id) }))
            }
          />
          <Notice>
            Nhận trực tiếp tại cửa hàng. Thông tin người nhận được xác nhận ở
            bước tiếp theo.
          </Notice>
          {data.cart.some(
            (l) => data.products.find((p) => p.id === l.id)?.category === "ram",
          ) && (
            <Panel title="Kiểm tra số lượng RAM">
              <p className="muted small">
                RAM được bán theo từng thanh. Hai thanh 16GB tương ứng số lượng
                2 và tổng dung lượng 32GB.
              </p>
            </Panel>
          )}
        </div>
        <aside className="stack">
          <Panel title="Tóm tắt giỏ hàng" className="summary">
            <KV label="Tiền hàng">
              {money(totalOf(data.cart, data.products))}
            </KV>
            <KV label="Tạm tính" total>
              {money(totalOf(data.cart, data.products))}
            </KV>
            <Button className="full" to="/thanh-toan">
              Tiếp tục đặt hàng →
            </Button>
            <p className="small muted section">
              Áp dụng một mã giảm giá ở bước thanh toán.
            </p>
          </Panel>
          <Notice tone="neutral">
            Giỏ hàng chưa giữ tồn kho. Giá và số lượng được kiểm tra lại khi xác
            nhận.
          </Notice>
        </aside>
      </div>
    </>
  );
}
export default function Checkout() {
  const { data, user, commit, notify } = useStore(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    fromBuild = params.get("source") === "build";
  const lines = fromBuild ? data.build : data.cart,
    total = totalOf(lines, data.products);
  const [name, setName] = useState(user?.name || ""),
    [phone, setPhone] = useState(user?.phone || ""),
    [note, setNote] = useState(""),
    [method, setMethod] = useState("store"),
    [inputCode, setInputCode] = useState(""),
    [applied, setApplied] = useState(""),
    [error, setError] = useState(""),
    [placing, setPlacing] = useState(false);
  let discount = 0,
    promoError = "";
  try {
    discount = promotionQuote(data, applied, user.id, total).discount;
  } catch (e) {
    promoError = e.message;
  }
  function apply() {
    try {
      promotionQuote(data, inputCode, user.id, total);
      setApplied(inputCode.trim().toUpperCase());
      setError("");
      notify("Đã áp dụng mã cho giá dự kiến.");
    } catch (e) {
      setError(e.message);
      setApplied("");
    }
  }
  function submit(e) {
    e.preventDefault();
    setError("");
    if (placing) return;
    setPlacing(true);
    try {
      const id =
        "TZ-" +
        new Date().toISOString().slice(0, 10).replaceAll("-", "") +
        "-" +
        crypto.randomUUID().slice(0, 6).toUpperCase();
      commit(
        (current) =>
          placeOrder(current, {
            user,
            lines,
            expectedTotal: total,
            budget: current.budget,
            fromBuild,
            pickupName: name,
            pickupPhone: phone,
            note,
            method,
            code: applied,
            id,
          }).state,
      );
      navigate("/don-hang/" + id + "?created=1");
      notify("Đã tạo đơn demo. Chưa phát sinh thanh toán thật.");
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }
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
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  label="Số điện thoại người nhận"
                  value={phone}
                  required
                  type="tel"
                  autoComplete="tel"
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="section">
                <Field
                  label="Ghi chú cho cửa hàng"
                  value={note}
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
              {[
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
              ].map(([value, label, desc]) => (
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
                <Button tone="secondary" onClick={apply}>
                  Áp dụng
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
              {(error || promoError) && (
                <div className="section">
                  <Notice tone="danger">{error || promoError}</Notice>
                </div>
              )}
              <Button
                type="submit"
                className="full"
                disabled={placing || !!promoError}
              >
                {placing ? "Đang tạo đơn…" : "Xác nhận đặt hàng →"}
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
