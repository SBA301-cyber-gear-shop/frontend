import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../state/context";
import { dateTime, money, transitionOrder } from "../domain/commerce";
import { ORDER_STATUS, PAYMENT_STATUS, TICKET_STATUS } from "../data/seed";
import { AccountLayout } from "../components/Layouts";
import { OrderLines } from "./Checkout";
import {
  Art,
  Badge,
  Button,
  Empty,
  Field,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
  Steps,
} from "../components/ui";
export function Orders() {
  const { data, user } = useStore(),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const orders = data.orders.filter(
    (o) =>
      o.userId === user.id &&
      (filter === "all" || o.status === filter) &&
      o.id.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <AccountLayout>
      <Heading
        title="Đơn hàng của tôi"
        sub="Theo dõi từ lúc đặt đến khi nhận tại cửa hàng."
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tìm mã đơn"
          placeholder="Tìm theo mã đơn hàng"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Trạng thái đơn"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="stack">
        {orders.length ? (
          orders.map((o) => (
            <Panel key={o.id}>
              <div className="between">
                <div>
                  <Link className="red" to={"/don-hang/" + o.id}>
                    <b>{o.id}</b>
                  </Link>
                  <p className="small muted">{dateTime(o.createdAt)}</p>
                </div>
                <Badge
                  tone={
                    o.status === "completed"
                      ? "success"
                      : o.status === "canceled"
                        ? "danger"
                        : "info"
                  }
                >
                  {ORDER_STATUS[o.status]}
                </Badge>
              </div>
              <div className="row section">
                <Art
                  type={
                    data.products.find((p) => p.id === o.lines[0]?.id)?.category
                  }
                  className="mini"
                />
                <div>
                  <b>{o.lines[0]?.name}</b>
                  <p className="small muted">
                    {o.lines.reduce((s, l) => s + l.quantity, 0)} sản phẩm ·
                    Nhận tại cửa hàng
                  </p>
                </div>
              </div>
              <div className="between section">
                <Badge tone={o.payment === "SUCCESS" ? "success" : "warning"}>
                  {PAYMENT_STATUS[o.payment]}
                </Badge>
                <div className="row">
                  <strong className="price">{money(o.final)}</strong>
                  <Button to={"/don-hang/" + o.id} tone="secondary">
                    Xem chi tiết →
                  </Button>
                </div>
              </div>
            </Panel>
          ))
        ) : (
          <Empty
            title="Chưa có đơn phù hợp"
            action={<Button to="/san-pham">Khám phá sản phẩm</Button>}
          />
        )}
      </div>
    </AccountLayout>
  );
}
export function OrderDetail() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    { data, user, commit, notify } = useStore(),
    [confirm, setConfirm] = useState(false),
    [review, setReview] = useState(null),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState("");
  const order = data.orders.find((o) => o.id === id && o.userId === user.id);
  function act(action) {
    try {
      commit((d) => transitionOrder(d, id, action));
      setConfirm(false);
      notify("Đã cập nhật đơn demo.");
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  if (!order)
    return (
      <Empty
        title="Không tìm thấy đơn của bạn"
        action={<Button to="/don-hang">Về danh sách đơn</Button>}
      />
    );
  const labels = Object.values(ORDER_STATUS).slice(0, 5),
    index = Object.keys(ORDER_STATUS).indexOf(order.status);
  function saveReview() {
    if (!comment.trim()) return notify("Nhập nội dung đánh giá.", "danger");
    commit((d) => ({
      ...d,
      reviews: [
        ...d.reviews.filter(
          (r) => !(r.orderId === id && r.productId === review),
        ),
        {
          id: crypto.randomUUID(),
          orderId: id,
          productId: review,
          rating,
          comment: comment.trim(),
          name: user.name,
        },
      ],
    }));
    setReview(null);
    notify("Đã lưu đánh giá.");
  }
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
            sang đơn khác theo chính sách demo.
          </p>
          <div className="row section">
            <Button tone="secondary" onClick={() => setConfirm(false)}>
              Giữ đơn
            </Button>
            <Button onClick={() => act("cancel")}>Xác nhận hủy</Button>
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
          <Button onClick={saveReview}>Lưu đánh giá</Button>
        </Modal>
      )}
    </>
  );
}
export function Warranty() {
  const { data, user } = useStore(),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const cards = data.warranties.filter(
    (w) =>
      w.userId === user.id &&
      w.serial.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <AccountLayout>
      <Heading
        title="Bảo hành của tôi"
        sub="Mỗi thiết bị, một serial. Theo dõi rõ từng yêu cầu."
      />
      <input
        className="input full section-title"
        aria-label="Tìm serial bảo hành"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo serial thiết bị"
      />
      <Notice>
        Để yêu cầu bảo hành, mang thiết bị đến cửa hàng. Nhân viên sẽ đối chiếu
        serial và tiếp nhận trực tiếp.
      </Notice>
      <div className="stack section">
        {cards.length ? (
          cards.map((w) => {
            const p = data.products.find((p) => p.id === w.productId),
              tickets = data.tickets.filter(
                (t) => t.warrantyId === w.id && t.userId === user.id,
              );
            return (
              <Panel key={w.id}>
                <div className="between">
                  <div className="row">
                    <Art type={p?.category} className="mini" />
                    <div>
                      <h3>{p?.name}</h3>
                      <p className="small mono">{w.serial}</p>
                    </div>
                  </div>
                  <Badge
                    tone={new Date(w.end) > new Date() ? "success" : "warning"}
                  >
                    {new Date(w.end) > new Date() ? "Còn bảo hành" : "Hết hạn"}
                  </Badge>
                </div>
                <div className="two-col section">
                  <KV label="Bắt đầu">
                    {new Date(w.start).toLocaleDateString("vi-VN")}
                  </KV>
                  <KV label="Kết thúc">
                    {new Date(w.end).toLocaleDateString("vi-VN")}
                  </KV>
                </div>
                <Link className="text-button" to={"/don-hang/" + w.orderId}>
                  Xem đơn mua →
                </Link>
                {tickets.map((t) => (
                  <button
                    className="ticket-preview between full"
                    key={t.id}
                    onClick={() => setSelected(t)}
                  >
                    <b>{t.id}</b>
                    <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
                    <span>Xem tiến trình →</span>
                  </button>
                ))}
              </Panel>
            );
          })
        ) : (
          <Empty
            title="Chưa có thiết bị phù hợp"
            description="Thẻ bảo hành xuất hiện sau khi đơn được bàn giao."
          />
        )}
      </div>
      {selected && (
        <Modal
          title={"Yêu cầu " + selected.id}
          onClose={() => setSelected(null)}
        >
          <Badge tone="info">{TICKET_STATUS[selected.status]}</Badge>
          <KV label="Tiếp nhận">{dateTime(selected.createdAt)}</KV>
          <h3 className="section">Lỗi đã báo</h3>
          <p>{selected.issue}</p>
          <h3 className="section">Thông tin từ cửa hàng</h3>
          <p>{selected.publicNote || "Cửa hàng đang xử lý yêu cầu."}</p>
          <p className="tiny muted section">
            Ghi chú nội bộ chỉ dành cho nhân viên phụ trách.
          </p>
        </Modal>
      )}
    </AccountLayout>
  );
}
export function Account() {
  const { user, commit, signIn, notify } = useStore(),
    [name, setName] = useState(user.name),
    [phone, setPhone] = useState(user.phone || ""),
    [address, setAddress] = useState(user.address || "");
  function save(e) {
    e.preventDefault();
    if (!name.trim() || !/^0\d{9}$/.test(phone))
      return notify("Kiểm tra họ tên và số điện thoại.", "danger");
    const updated = { ...user, name: name.trim(), phone, address };
    commit((d) => ({
      ...d,
      users: d.users.some((u) => u.id === user.id)
        ? d.users.map((u) => (u.id === user.id ? { ...u, ...updated } : u))
        : [...d.users, updated],
    }));
    signIn(updated);
    notify("Đã lưu hồ sơ demo.");
  }
  return (
    <AccountLayout>
      <Heading
        title="Hồ sơ & tài khoản"
        sub="Quản lý thông tin liên hệ của bạn."
      />
      <div className="stack">
        <Panel title="Thông tin cá nhân">
          <form onSubmit={save}>
            <div className="two-col">
              <Field
                label="Họ tên"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
              <Field label="Email" value={user.email} readOnly />
            </div>
            <div className="two-col section">
              <Field
                label="Số điện thoại"
                type="tel"
                value={phone}
                required
                onChange={(e) => setPhone(e.target.value)}
              />
              <Field
                label="Địa chỉ liên hệ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit" className="section">
              Lưu thay đổi
            </Button>
          </form>
        </Panel>
        <Panel title="Phương thức thanh toán">
          <Empty
            title="Chưa có phương thức đã lưu"
            description="Bạn vẫn có thể thanh toán tại cửa hàng. Việc lưu phương thức thanh toán cần tích hợp token từ cổng thanh toán."
          />
        </Panel>
        <Notice tone="neutral">
          Dữ liệu demo lưu tại trình duyệt. Không nhập thông tin thẻ hoặc dữ
          liệu nhạy cảm thật.
        </Notice>
      </div>
    </AccountLayout>
  );
}
