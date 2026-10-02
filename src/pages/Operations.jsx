import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../state/context";
import {
  createTicket,
  dateTime,
  money,
  transitionOrder,
  transitionTicket,
} from "../domain/commerce";
import { ORDER_STATUS, PAYMENT_STATUS, TICKET_STATUS } from "../data/seed";
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
export function StaffOrders({ handover = false }) {
  const { data, commit, notify } = useStore(),
    [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [confirm, setConfirm] = useState(false),
    navigate = useNavigate();
  const filtered = data.orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (o.id + " " + o.pickupPhone + " " + o.pickupName)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = data.orders.find(
    (o) => o.id === (params.get("id") || "TZ-261001-0128"),
  );
  const [serials, setSerials] = useState({}),
    [checked, setChecked] = useState(false);
  const update = (action) => {
    try {
      commit((d) => transitionOrder(d, selected.id, action));
      notify("Đã cập nhật trạng thái demo.");
      setConfirm(false);
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const count = selected?.lines.reduce((s, l) => s + l.quantity, 0) || 0;
  function finish() {
    try {
      if (!checked)
        throw new Error("Xác nhận đối chiếu người nhận và thiết bị.");
      const units = Array.from(
        { length: count },
        (_, i) => serials[selected.id + "-" + i] || "",
      );
      commit((d) => transitionOrder(d, selected.id, "handover", units));
      notify("Đã bàn giao và tạo thẻ bảo hành theo serial.");
      navigate("/van-hanh/don-hang?id=" + selected.id);
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  return (
    <>
      <Heading
        title={handover ? "Bàn giao đơn hàng" : "Xử lý đơn hàng"}
        sub="Đối chiếu đơn, thu tiền và chuẩn bị bàn giao tại cửa hàng."
        eyebrow="VẬN HÀNH / ĐƠN HÀNG"
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tra cứu đơn hàng"
          placeholder="Mã đơn, số điện thoại hoặc tên khách"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Lọc trạng thái đơn"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="order-picker">
        {filtered.map((o) => (
          <button
            key={o.id}
            className={"chip " + (o.id === selected?.id ? "active" : "")}
            onClick={() => {
              setParams({ id: o.id });
              setChecked(false);
            }}
          >
            {o.id} · {ORDER_STATUS[o.status]}
          </button>
        ))}
      </div>
      {!filtered.length && <Empty title="Không tìm thấy đơn phù hợp" />}
      {selected && (
        <div className="split section">
          <div className="stack">
            <Panel
              title={selected.id}
              action={
                <Badge tone="info">{ORDER_STATUS[selected.status]}</Badge>
              }
            >
              <p className="small muted">
                Đặt ngày {dateTime(selected.createdAt)}
              </p>
              <div className="section">
                <Steps
                  labels={Object.values(ORDER_STATUS).slice(0, 5)}
                  current={Object.keys(ORDER_STATUS).indexOf(selected.status)}
                />
              </div>
            </Panel>
            <Panel title="Hàng trong đơn">
              <OrderLines lines={selected.lines} products={data.products} />
            </Panel>
            <Panel title="Thông tin nhận hàng">
              <div className="two-col">
                <KV label="Người nhận">{selected.pickupName}</KV>
                <KV label="Điện thoại">{selected.pickupPhone}</KV>
              </div>
              <p className="small muted section">
                {selected.note || "Không có ghi chú."}
              </p>
            </Panel>
            {handover && (
              <Panel title={"Serial từng thiết bị · " + count + " thiết bị"}>
                <Notice>
                  Nhập serial thực tế, duy nhất cho mỗi thiết bị. Thẻ bảo hành
                  được tạo khi xác nhận bàn giao.
                </Notice>
                <div className="stack section">
                  {selected.lines
                    .flatMap((l) =>
                      Array.from({ length: l.quantity }, (_, i) => ({
                        line: l,
                        index: i,
                      })),
                    )
                    .map((u, i) => (
                      <Field
                        key={i}
                        label={u.line.name + " · Thiết bị " + (u.index + 1)}
                        value={serials[selected.id + "-" + i] || ""}
                        onChange={(e) =>
                          setSerials({
                            ...serials,
                            [selected.id + "-" + i]: e.target.value,
                          })
                        }
                      />
                    ))}
                </div>
                <label className="filter-option section">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  Đã đối chiếu người nhận, serial và bàn giao đủ hàng.
                </label>
              </Panel>
            )}
          </div>
          <aside className="stack">
            <Panel title="Thanh toán" className="summary">
              <Badge
                tone={selected.payment === "SUCCESS" ? "success" : "warning"}
              >
                {PAYMENT_STATUS[selected.payment]}
              </Badge>
              <p className="small muted section">Cần thanh toán đủ</p>
              <div className="price">{money(selected.final)}</div>
              <div className="divider" />
              <KV label="Tiền hàng">{money(selected.total)}</KV>
              <KV label={"Giảm giá " + (selected.promotion || "")}>
                {money(selected.discount)}
              </KV>
              <KV label="Thành tiền">{money(selected.final)}</KV>
              {selected.payment !== "SUCCESS" &&
                !["canceled", "completed"].includes(selected.status) && (
                  <>
                    <Button className="full" onClick={() => setConfirm(true)}>
                      Xác nhận đã thu đủ
                    </Button>
                    <p className="tiny muted section">
                      Demo: chỉ xác nhận sau khi đối chiếu khoản thu.
                    </p>
                  </>
                )}
            </Panel>
            <Panel title="Bước tiếp theo" className="summary">
              {["pending", "confirmed", "preparing"].includes(
                selected.status,
              ) && (
                <Button className="full" onClick={() => update("advance")}>
                  {selected.status === "pending"
                    ? "Xác nhận đơn"
                    : selected.status === "confirmed"
                      ? "Bắt đầu chuẩn bị"
                      : "Đánh dấu sẵn sàng nhận"}
                </Button>
              )}
              {handover ? (
                <Button
                  className="full"
                  disabled={
                    selected.status !== "ready_for_pickup" ||
                    selected.payment !== "SUCCESS" ||
                    !checked
                  }
                  onClick={finish}
                >
                  Hoàn tất bàn giao
                </Button>
              ) : (
                <Button
                  className="full"
                  disabled={
                    selected.status !== "ready_for_pickup" ||
                    selected.payment !== "SUCCESS"
                  }
                  onClick={() =>
                    navigate("/van-hanh/ban-giao?id=" + selected.id)
                  }
                >
                  Tiếp tục bàn giao →
                </Button>
              )}
              {selected.status === "completed" && (
                <Notice tone="success">
                  Đã bàn giao và kích hoạt bảo hành.
                </Notice>
              )}
            </Panel>
          </aside>
        </div>
      )}
      {confirm && (
        <Modal
          title="Xác nhận đã nhận đủ tiền?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Đơn {selected.id} · {money(selected.final)}. Thao tác cập nhật khoản
            thu trong dữ liệu demo.
          </p>
          <div className="row section">
            <Button tone="secondary" onClick={() => setConfirm(false)}>
              Quay lại
            </Button>
            <Button onClick={() => update("pay")}>Đã thu đủ tiền</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Intake() {
  const { data, commit, notify } = useStore(),
    [search, setSearch] = useState("KST26A000428"),
    [selectedId, setSelectedId] = useState("wc1"),
    [issue, setIssue] = useState(""),
    [condition, setCondition] = useState(""),
    [accessories, setAccessories] = useState(""),
    [verified, setVerified] = useState(false),
    [created, setCreated] = useState(null);
  const card = data.warranties.find((w) => w.id === selectedId),
    product = data.products.find((p) => p.id === card?.productId),
    existing = data.tickets.find(
      (t) => t.warrantyId === card?.id && t.status !== "returned",
    );
  const matches = data.warranties.filter((w) => {
    const o = data.orders.find((o) => o.id === w.orderId);
    return (w.serial + " " + w.orderId + " " + o?.pickupPhone)
      .toLowerCase()
      .includes(search.toLowerCase().replaceAll(" ", ""));
  });
  function submit(e) {
    e.preventDefault();
    try {
      if (!verified)
        throw new Error("Đối chiếu serial và xác nhận đã nhận thiết bị.");
      const id = "BH-" + crypto.randomUUID().slice(0, 8).toUpperCase();
      commit((d) =>
        createTicket(d, {
          id,
          warrantyId: card.id,
          issue,
          condition,
          accessories,
        }),
      );
      setCreated(id);
      notify("Đã tạo phiếu tiếp nhận.");
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  return (
    <>
      <Heading
        title="Tiếp nhận bảo hành"
        sub="Tra cứu đúng thiết bị và đối chiếu khách hàng tại quầy."
        eyebrow="VẬN HÀNH / BẢO HÀNH"
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tra cứu serial hoặc số điện thoại"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Serial, mã đơn hoặc số điện thoại"
        />
        <Button
          tone="dark"
          onClick={() => {
            setSelectedId(matches[0]?.id || "");
            setCreated(null);
            setVerified(false);
          }}
        >
          Tra cứu
        </Button>
      </div>
      <div className="order-picker">
        {matches.map((w) => (
          <button
            className={"chip " + (w.id === selectedId ? "active" : "")}
            key={w.id}
            onClick={() => {
              setSelectedId(w.id);
              setCreated(null);
              setVerified(false);
            }}
          >
            {w.serial}
          </button>
        ))}
      </div>
      {card ? (
        <div className="split section">
          <div className="stack">
            <Panel
              title="Thiết bị bảo hành"
              action={
                <Badge tone={card.status === "active" ? "success" : "warning"}>
                  {card.status === "active"
                    ? "Thẻ hoạt động"
                    : "Không hoạt động"}
                </Badge>
              }
            >
              <div className="row">
                <Art type={product?.category} className="small-art" />
                <div>
                  <h3>{product?.name}</h3>
                  <p className="muted">{product?.variant}</p>
                </div>
              </div>
              <div className="divider" />
              <KV label="Serial">{card.serial}</KV>
              <KV label="Đơn mua">{card.orderId}</KV>
              <KV label="Hết hạn">
                {new Date(card.end).toLocaleDateString("vi-VN")}
              </KV>
            </Panel>
            {existing ? (
              <Panel title="Thiết bị đã có yêu cầu đang xử lý">
                <Notice tone="warning">
                  Không tạo trùng ticket cho cùng lần tiếp nhận.
                </Notice>
                <KV label="Mã phiếu">{existing.id}</KV>
                <KV label="Trạng thái">{TICKET_STATUS[existing.status]}</KV>
                <p>{existing.issue}</p>
                <Link className="text-button section" to="/van-hanh/bao-hanh">
                  Tiếp tục tra cứu thiết bị khác
                </Link>
              </Panel>
            ) : (
              <Panel title="Thông tin tiếp nhận">
                <form onSubmit={submit}>
                  <Field label="Mô tả lỗi khách báo">
                    {(id) => (
                      <textarea
                        id={id}
                        className="input full"
                        required
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                      />
                    )}
                  </Field>
                  <div className="two-col section">
                    <Field
                      label="Tình trạng ngoại quan"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                    />
                    <Field
                      label="Phụ kiện nhận giữ"
                      value={accessories}
                      onChange={(e) => setAccessories(e.target.value)}
                      placeholder="Không có / ghi rõ phụ kiện"
                      required
                    />
                  </div>
                  <label className="filter-option section">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                    />
                    Đã đối chiếu serial và nhận thiết bị từ khách.
                  </label>
                  <Button type="submit" disabled={!verified}>
                    Tạo phiếu tiếp nhận
                  </Button>
                </form>
              </Panel>
            )}
          </div>
          <aside className="stack">
            <Panel title="Tóm tắt tiếp nhận">
              <KV label="Khách hàng">
                {data.orders.find((o) => o.id === card.orderId)?.pickupName ||
                  card.userId}
              </KV>
              <KV label="Serial">{card.serial}</KV>
              <p className="muted small section">
                Thẻ còn hạn là điều kiện tiếp nhận. Kỹ thuật viên xác định lỗi
                có thuộc phạm vi bảo hành.
              </p>
            </Panel>
            {created && (
              <Panel title="Biên nhận đã tạo">
                <p className="mono">{created}</p>
                <p className="section">{issue}</p>
                <KV label="Ngoại quan">{condition}</KV>
                <KV label="Phụ kiện">{accessories}</KV>
                <Button className="section" onClick={() => window.print()}>
                  In biên nhận
                </Button>
              </Panel>
            )}
          </aside>
        </div>
      ) : (
        <Empty
          title="Không tìm thấy thiết bị"
          description="Kiểm tra lại serial, mã đơn hoặc số điện thoại. Không liên kết nhầm thẻ bảo hành."
        />
      )}
    </>
  );
}
export function Technician() {
  const { data, commit, notify } = useStore(),
    [selectedId, setSelectedId] = useState(data.tickets[0]?.id || ""),
    [filter, setFilter] = useState("all");
  const ticket = data.tickets.find((t) => t.id === selectedId);
  return (
    <>
      <Heading
        title="Xử lý kỹ thuật"
        sub="Chẩn đoán, sửa chữa, kiểm tra và trả thiết bị."
        eyebrow="VẬN HÀNH / KỸ THUẬT"
      />
      <div className="two-col">
        <Panel title="Danh sách yêu cầu">
          <select
            className="input full"
            aria-label="Lọc phiếu bảo hành"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(TICKET_STATUS).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="stack section">
            {data.tickets
              .filter((t) => filter === "all" || t.status === filter)
              .map((t) => (
                <button
                  className={
                    "selection " + (t.id === selectedId ? "selected" : "")
                  }
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div>
                    <b>{t.id}</b>
                    <p className="small muted">{t.issue}</p>
                    <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
                  </div>
                </button>
              ))}
          </div>
        </Panel>
        {ticket ? (
          <TicketEditor
            key={ticket.id + "-" + ticket.status}
            ticket={ticket}
            data={data}
            onSave={(status, note, publicNote) => {
              try {
                commit((d) =>
                  transitionTicket(d, ticket.id, status, note, publicNote),
                );
                notify("Đã cập nhật yêu cầu.");
              } catch (e) {
                notify(e.message, "danger");
              }
            }}
          />
        ) : (
          <Empty title="Chọn yêu cầu cần xử lý" />
        )}
      </div>
    </>
  );
}
function TicketEditor({ ticket: t, data, onSave }) {
  const [note, setNote] = useState(t.note),
    [publicNote, setPublicNote] = useState(t.publicNote);
  const next = {
    received: ["inspecting"],
    inspecting: ["repairing", "rejected"],
    repairing: ["completed"],
    completed: ["returned", "inspecting"],
    rejected: ["returned"],
    returned: [],
  };
  return (
    <div className="stack">
      <Panel
        title={t.id}
        action={<Badge tone="info">{TICKET_STATUS[t.status]}</Badge>}
      >
        <KV label="Serial">
          {data.warranties.find((w) => w.id === t.warrantyId)?.serial}
        </KV>
        <KV label="Tiếp nhận">{dateTime(t.createdAt)}</KV>
        <h3 className="section">Lỗi khách báo</h3>
        <p>{t.issue}</p>
        <KV label="Ngoại quan">{t.condition || "Chưa ghi nhận"}</KV>
        <KV label="Phụ kiện">{t.accessories || "Chưa ghi nhận"}</KV>
        <div className="section">
          <Field label="Ghi chú nội bộ kỹ thuật">
            {(id) => (
              <textarea
                id={id}
                className="input full"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="5"
              />
            )}
          </Field>
          <Field label="Thông tin hiển thị cho khách">
            {(id) => (
              <textarea
                id={id}
                className="input full"
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                rows="3"
              />
            )}
          </Field>
        </div>
        <div className="row wrap-row section">
          {next[t.status].map((s) => (
            <Button
              key={s}
              tone={s === "rejected" ? "ghost" : "primary"}
              onClick={() => onSave(s, note, publicNote)}
            >
              {s === "inspecting"
                ? "Bắt đầu kiểm tra"
                : s === "repairing"
                  ? "Bắt đầu sửa chữa"
                  : s === "completed"
                    ? "Hoàn tất sửa chữa"
                    : s === "returned"
                      ? "Xác nhận đã trả khách"
                      : "Từ chối bảo hành"}
            </Button>
          ))}
        </div>
      </Panel>
      <Notice tone="neutral">
        Ghi chú nội bộ không hiển thị ở trang khách. Ticket đã trả khách được
        giữ lại để đối chiếu lần tiếp nhận tiếp theo.
      </Notice>
    </div>
  );
}
