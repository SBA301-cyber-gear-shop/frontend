import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../state/context";
import { dateTime, money, transitionOrder } from "../domain/commerce";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  TICKET_RESOLUTION,
  TICKET_STATUS,
} from "../data/seed";
import { useAftersales } from "../services/aftersales";
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
const STEP_LABEL = {
  "received>inspecting": "Bắt đầu kiểm tra",
  "received>canceled": "Hủy phiếu",
  "inspecting>repairing": "Bắt đầu sửa chữa",
  "inspecting>canceled": "Hủy phiếu",
  "repairing>waiting_for_parts": "Chờ linh kiện",
  "repairing>inspecting": "Kiểm tra lại",
  "waiting_for_parts>repairing": "Tiếp tục sửa chữa",
  "ready_for_return>returned": "Xác nhận đã trả khách",
  "ready_for_return>inspecting": "Khách báo còn lỗi",
};
const RESOLUTION_STEP = {
  repaired: "Hoàn tất sửa chữa",
  rejected: "Từ chối bảo hành",
  no_fault_found: "Không tìm thấy lỗi",
  withdrawn: "Khách rút yêu cầu",
};
// Một nút cho mỗi bước được phép; bước cần chọn kết quả thì mỗi kết quả một nút.
const stepButtons = (ticket) =>
  ticket.allowedTransitions.flatMap((t) =>
    t.resolutions.length
      ? t.resolutions.map((r) => ({
          toStatus: t.toStatus,
          resolution: r,
          label: RESOLUTION_STEP[r],
        }))
      : [
          {
            toStatus: t.toStatus,
            resolution: null,
            label: STEP_LABEL[ticket.status + ">" + t.toStatus],
          },
        ],
  );
// Màn hình quầy chỉ có các bước của lễ tân, kể cả khi Admin (được làm mọi bước) đang dùng.
const COUNTER_STEPS = [
  "received>canceled",
  "ready_for_return>returned",
  "ready_for_return>inspecting",
];
const counterSteps = (ticket) =>
  stepButtons(ticket).filter((s) =>
    COUNTER_STEPS.includes(ticket.status + ">" + s.toStatus),
  );
const day = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "Chưa có");
// Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD, làm giới hạn dưới cho ô chọn ngày hẹn trả.
const today = () => new Date().toLocaleDateString("en-CA");
const cardBadge = (c) =>
  c.status === "replaced"
    ? ["warning", "Đã đổi thiết bị"]
    : c.status !== "active"
      ? ["warning", "Thẻ bị vô hiệu"]
      : c.valid
        ? ["success", "Còn bảo hành"]
        : ["warning", "Hết hạn"];
function RequestHistory({ requests }) {
  if (!requests.length)
    return <p className="small muted">Thẻ chưa có phiếu bảo hành nào.</p>;
  return requests.map((r) => (
    <div className="ticket-preview row wrap-row between" key={r.id}>
      <b className="mono">{r.requestCode}</b>
      <span className="small muted">{dateTime(r.createdAt)}</span>
      <Badge tone="info">{TICKET_STATUS[r.status]}</Badge>
      {r.resolution && <Badge>{TICKET_RESOLUTION[r.resolution]}</Badge>}
    </div>
  ));
}
function Timeline({ events }) {
  return events.map((e, i) => (
    <div className="ticket-preview" key={i}>
      <div className="row wrap-row between">
        <b>
          {e.fromStatus === e.toStatus ? "Ghi chú" : TICKET_STATUS[e.toStatus]}
        </b>
        <span className="small muted">
          {dateTime(e.createdAt)} · {e.actorName}
        </span>
      </div>
      {e.internalNote && <p className="small">{e.internalNote}</p>}
      {e.publicNote && (
        <p className="small muted">Cho khách: {e.publicNote}</p>
      )}
    </div>
  ));
}
const EMPTY_INTAKE = {
  issueDescription: "",
  conditionNote: "",
  accessoriesNote: "",
  contactName: "",
  contactPhone: "",
  expectedReturnDate: "",
};
export function Intake() {
  const svc = useAftersales(),
    { notify } = useStore(),
    [query, setQuery] = useState(""),
    [asked, setAsked] = useState(""),
    [cards, setCards] = useState(null),
    [selectedId, setSelectedId] = useState(null),
    [open, setOpen] = useState(null),
    [receipt, setReceipt] = useState(null),
    [form, setForm] = useState(EMPTY_INTAKE),
    [verified, setVerified] = useState(false),
    [note, setNote] = useState(""),
    [publicNote, setPublicNote] = useState(""),
    [busy, setBusy] = useState(false);
  // Số thứ tự của lần tra cứu hoặc chọn thẻ mới nhất, để bỏ kết quả về trễ của lần trước.
  const latest = useRef(0);
  const card = cards?.find((c) => c.id === selectedId) || null;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  // Chọn một thẻ trong kết quả và nạp phiếu đang mở của thẻ đó, nếu có.
  async function show(found, pick) {
    const mine = ++latest.current;
    setCards(found);
    setSelectedId(pick?.id ?? null);
    setVerified(false);
    setNote("");
    setPublicNote("");
    setForm({
      ...EMPTY_INTAKE,
      contactName: pick?.pickupName || "",
      contactPhone: pick?.pickupPhone || "",
    });
    // Bỏ phiếu của thẻ trước ngay, để không ai thao tác nhầm lên nó trong lúc phiếu mới đang tải.
    setOpen(null);
    if (!pick?.openRequest) return;
    const ticket = await svc.getRequest(pick.openRequest.id);
    if (mine === latest.current) setOpen(ticket);
  }
  async function search(q, keepId) {
    const mine = ++latest.current;
    try {
      const found = await svc.searchCards(q);
      if (mine !== latest.current) return;
      setAsked(q);
      await show(found, found.find((c) => c.id === keepId) || found[0]);
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  // Khóa form trong lúc gửi để không tạo hai phiếu khi bấm hai lần.
  async function write(action) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      notify(err.message, "danger");
    } finally {
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    write(async () => {
      if (!verified)
        throw new Error("Đối chiếu serial và xác nhận đã nhận thiết bị.");
      const created = await svc.createRequest({
        warrantyCardId: card.id,
        ...form,
      });
      notify("Đã tạo phiếu tiếp nhận.");
      await search(asked, card.id);
      setReceipt(created);
    });
  }
  const act = (step) =>
    write(async () => {
      await svc.transition(open.id, {
        toStatus: step.toStatus,
        resolution: step.resolution,
        internalNote: note,
        publicNote,
        version: open.version,
      });
      notify("Đã cập nhật yêu cầu.");
      await search(asked, card.id);
    });
  return (
    <>
      <Heading
        title="Tiếp nhận bảo hành"
        sub="Tra cứu đúng thiết bị, tiếp nhận và trả máy cho khách tại quầy."
        eyebrow="VẬN HÀNH / BẢO HÀNH"
      />
      <form
        className="row section-title"
        onSubmit={(e) => {
          e.preventDefault();
          setReceipt(null);
          search(query);
        }}
      >
        <input
          className="input flex"
          aria-label="Tra cứu serial hoặc số điện thoại"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Serial, mã đơn, số điện thoại hoặc mã phiếu"
        />
        <Button tone="dark" type="submit" disabled={busy}>
          Tra cứu
        </Button>
      </form>
      <div className="order-picker">
        {cards?.map((c) => (
          <button
            className={"chip " + (c.id === selectedId ? "active" : "")}
            key={c.id}
            disabled={busy}
            onClick={() => {
              setReceipt(null);
              show(cards, c).catch((err) => notify(err.message, "danger"));
            }}
          >
            {c.serialNumber}
          </button>
        ))}
      </div>
      {card ? (
        <div className="split section">
          <fieldset className="stack plain-fieldset" disabled={busy}>
            <Panel
              title="Thiết bị bảo hành"
              action={
                <Badge tone={cardBadge(card)[0]}>{cardBadge(card)[1]}</Badge>
              }
            >
              <div className="row">
                <Art className="small-art" />
                <div>
                  <h3>{card.productName}</h3>
                  <p className="muted">{card.variantName}</p>
                </div>
              </div>
              <div className="divider" />
              <KV label="Serial">{card.serialNumber}</KV>
              <KV label="Đơn mua">{card.orderCode}</KV>
              <KV label="Hiệu lực">
                {day(card.startDate)} đến {day(card.endDate)}
              </KV>
              {card.replacedBySerialNumber && (
                <Notice tone="warning">
                  Thiết bị này đã được đổi sang serial{" "}
                  <b className="mono">{card.replacedBySerialNumber}</b>. Tra
                  cứu serial mới để tiếp nhận.
                </Notice>
              )}
            </Panel>
            {open ? (
              <Panel title="Thiết bị đã có yêu cầu đang xử lý">
                <Notice tone="warning">
                  Không tạo trùng ticket cho cùng lần tiếp nhận.
                </Notice>
                <KV label="Mã phiếu">{open.requestCode}</KV>
                <KV label="Trạng thái">{TICKET_STATUS[open.status]}</KV>
                {open.resolution && (
                  <KV label="Kết quả">{TICKET_RESOLUTION[open.resolution]}</KV>
                )}
                <KV label="Người mang máy">
                  {open.contactName} · {open.contactPhone}
                </KV>
                <KV label="Phụ kiện nhận giữ">{open.accessoriesNote}</KV>
                <p className="section">{open.issueDescription}</p>
                {open.publicNote && (
                  <p className="small muted">Đã báo khách: {open.publicNote}</p>
                )}
                {counterSteps(open).length > 0 && (
                  <div className="section">
                    <Field label="Ghi chú bàn giao hoặc lý do">
                      {(id) => (
                        <textarea
                          id={id}
                          className="input full"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      )}
                    </Field>
                    <Field
                      label="Thông tin hiển thị cho khách"
                      value={publicNote}
                      onChange={(e) => setPublicNote(e.target.value)}
                    />
                    <div className="row wrap-row section">
                      {counterSteps(open).map((s) => (
                        <Button
                          key={s.toStatus}
                          tone={s.toStatus === "returned" ? "primary" : "ghost"}
                          onClick={() => act(s)}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            ) : card.openRequest ? (
              <Panel title="Thiết bị đã có yêu cầu đang xử lý">
                <p className="muted">
                  Đang tải phiếu {card.openRequest.requestCode}…
                </p>
              </Panel>
            ) : card.valid ? (
              <Panel title="Thông tin tiếp nhận">
                <form onSubmit={submit}>
                  <Field label="Mô tả lỗi khách báo">
                    {(id) => (
                      <textarea
                        id={id}
                        className="input full"
                        required
                        value={form.issueDescription}
                        onChange={set("issueDescription")}
                      />
                    )}
                  </Field>
                  <div className="two-col section">
                    <Field
                      label="Tình trạng ngoại quan"
                      value={form.conditionNote}
                      onChange={set("conditionNote")}
                      required
                    />
                    <Field
                      label="Phụ kiện nhận giữ"
                      value={form.accessoriesNote}
                      onChange={set("accessoriesNote")}
                      placeholder="Không có / ghi rõ phụ kiện"
                      required
                    />
                  </div>
                  <div className="two-col section">
                    <Field
                      label="Người mang máy đến"
                      value={form.contactName}
                      onChange={set("contactName")}
                      required
                    />
                    <Field
                      label="Số điện thoại liên hệ"
                      value={form.contactPhone}
                      onChange={set("contactPhone")}
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="section">
                    <Field
                      label="Ngày hẹn trả"
                      type="date"
                      min={today()}
                      value={form.expectedReturnDate}
                      onChange={set("expectedReturnDate")}
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
            ) : (
              <Notice tone="warning">
                Thẻ không còn hiệu lực nên không tạo được phiếu bảo hành. Sửa
                chữa trả phí, nếu có, xử lý ngoài hệ thống.
              </Notice>
            )}
          </fieldset>
          <aside className="stack">
            {/* Đứng đầu cột để thấy ngay sau khi tạo phiếu; lớp receipt để bản in chỉ có khung này. */}
            {receipt && (
              <Panel title="Biên nhận đã tạo" className="receipt">
                <p className="mono">{receipt.requestCode}</p>
                <KV label="Khách hàng">{receipt.card.customerName}</KV>
                <KV label="Người mang máy">
                  {receipt.contactName} · {receipt.contactPhone}
                </KV>
                <KV label="Thiết bị">
                  {receipt.card.productName} · {receipt.card.serialNumber}
                </KV>
                <KV label="Tiếp nhận lúc">{dateTime(receipt.createdAt)}</KV>
                <KV label="Ngày hẹn trả">{day(receipt.expectedReturnDate)}</KV>
                <p className="section">{receipt.issueDescription}</p>
                <KV label="Ngoại quan">{receipt.conditionNote}</KV>
                <KV label="Phụ kiện">{receipt.accessoriesNote}</KV>
                <Button className="section" onClick={() => window.print()}>
                  In biên nhận
                </Button>
              </Panel>
            )}
            <Panel title="Tóm tắt tiếp nhận">
              <KV label="Khách hàng">{card.customerName}</KV>
              <KV label="Điện thoại">{card.customerPhone || "Chưa có"}</KV>
              <KV label="Serial">{card.serialNumber}</KV>
              <p className="muted small section">
                Thẻ còn hạn là điều kiện tiếp nhận. Kỹ thuật viên xác định lỗi
                có thuộc phạm vi bảo hành.
              </p>
            </Panel>
            <Panel title="Lịch sử bảo hành của thẻ">
              {card.repairedCount >= 3 && (
                <Notice tone="warning">
                  Thiết bị đã sửa {card.repairedCount} lần. Cân nhắc đổi thiết
                  bị nếu lỗi tái diễn.
                </Notice>
              )}
              <RequestHistory requests={card.requests} />
            </Panel>
          </aside>
        </div>
      ) : (
        <Empty
          title={cards ? "Không tìm thấy thiết bị" : "Tra cứu thiết bị"}
          description="Nhập đúng serial, mã đơn, số điện thoại hoặc mã phiếu. Không liên kết nhầm thẻ bảo hành."
        />
      )}
    </>
  );
}
export function Technician() {
  const svc = useAftersales(),
    [filter, setFilter] = useState(""),
    [list, setList] = useState(null),
    [selectedId, setSelectedId] = useState(null),
    [detail, setDetail] = useState(null),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  const activeId = selectedId ?? list?.[0]?.id ?? null;
  useEffect(() => {
    let alive = true;
    svc
      .listRequests(filter)
      .then((rows) => alive && setList(rows))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [svc, filter, tick]);
  useEffect(() => {
    if (activeId == null) return;
    let alive = true;
    svc
      .getRequest(activeId)
      .then((found) => alive && setDetail(found))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [svc, activeId, tick]);
  const ticket = detail?.id === activeId ? detail : null;
  // Lỗi cũ được xóa ở mỗi lần người dùng yêu cầu tải lại, nên chỉ lần tải hỏng gần nhất mới còn hiện.
  const reload = () => {
    setError("");
    setTick((n) => n + 1);
  };
  return (
    <>
      <Heading
        title="Xử lý kỹ thuật"
        sub="Chẩn đoán, sửa chữa, kiểm tra và chuyển thiết bị về quầy chờ trả."
        eyebrow="VẬN HÀNH / KỸ THUẬT"
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="two-col">
        <Panel
          title="Danh sách yêu cầu"
          action={
            <button className="text-button" onClick={reload}>
              Làm mới
            </button>
          }
        >
          <select
            className="input full"
            aria-label="Lọc phiếu bảo hành"
            value={filter}
            onChange={(e) => {
              setError("");
              setFilter(e.target.value);
              setSelectedId(null);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TICKET_STATUS).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="stack section">
            {list?.map((t) => (
              <button
                className={"selection " + (t.id === activeId ? "selected" : "")}
                key={t.id}
                onClick={() => {
                  setError("");
                  setSelectedId(t.id);
                }}
              >
                <div>
                  <b>{t.requestCode}</b>
                  <p className="small muted">
                    {t.productName} · {t.serialNumber}
                  </p>
                  <p className="small muted">{t.issueDescription}</p>
                  <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
                </div>
              </button>
            ))}
            {list && !list.length && (
              <p className="small muted">Không có phiếu nào.</p>
            )}
          </div>
        </Panel>
        {ticket ? (
          <TicketEditor
            key={ticket.id + ":" + ticket.version}
            ticket={ticket}
            svc={svc}
            onChanged={(updated) => {
              if (updated) setDetail(updated);
              reload();
            }}
          />
        ) : (
          <Empty title="Chọn yêu cầu cần xử lý" />
        )}
      </div>
    </>
  );
}
function TicketEditor({ ticket: t, svc, onChanged }) {
  const { notify } = useStore(),
    [note, setNote] = useState(""),
    [publicNote, setPublicNote] = useState(""),
    [expected, setExpected] = useState(""),
    [siblings, setSiblings] = useState([]),
    [target, setTarget] = useState(""),
    [serial, setSerial] = useState(""),
    [source, setSource] = useState("supplier"),
    [confirming, setConfirming] = useState(false),
    [busy, setBusy] = useState(false);
  const orderCode = t.card.orderCode,
    cardId = t.card.id,
    canRelink = t.canRelinkCard;
  // Các thẻ khác cùng đơn hàng, dùng khi khách mang cả bộ máy và lỗi nằm ở linh kiện khác.
  useEffect(() => {
    if (!canRelink || !orderCode) return;
    let alive = true;
    svc
      .searchCards(orderCode)
      .then(
        (found) =>
          alive &&
          setSiblings(
            found.filter((c) => c.id !== cardId && c.status === "active"),
          ),
      )
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [svc, canRelink, orderCode, cardId]);
  async function run(action, message) {
    // Khóa form trong lúc gửi: phiếu được nạp lại khi có kết quả, chữ gõ dở lúc đó sẽ mất.
    setBusy(true);
    try {
      const updated = await action();
      notify(message);
      onChanged(updated);
    } catch (err) {
      notify(err.message, "danger");
      // Phiếu có thể vừa bị người khác đổi: tải lại để thấy trạng thái mới thay vì kẹt ở bản cũ.
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  const others = t.card.requests.filter((r) => r.id !== t.id);
  return (
    <fieldset className="stack plain-fieldset" disabled={busy}>
      <Panel
        title={t.requestCode}
        action={
          <span className="row">
            <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
            {t.resolution && <Badge>{TICKET_RESOLUTION[t.resolution]}</Badge>}
          </span>
        }
      >
        <KV label="Thiết bị">
          {t.card.productName} · {t.card.serialNumber}
        </KV>
        <KV label="Thẻ bảo hành">
          {cardBadge(t.card)[1]}, đến {day(t.card.endDate)}
        </KV>
        <KV label="Tiếp nhận">{dateTime(t.createdAt)}</KV>
        <KV label="Ngày hẹn trả">{day(t.expectedReturnDate)}</KV>
        <KV label="Người mang máy">
          {t.contactName || "Chưa ghi nhận"} · {t.contactPhone || ""}
        </KV>
        <KV label="Kỹ thuật viên">
          {t.assignedTechnicianName || "Chưa có"}
        </KV>
        <h3 className="section">Lỗi khách báo</h3>
        <p>{t.issueDescription}</p>
        <KV label="Ngoại quan">{t.conditionNote || "Chưa ghi nhận"}</KV>
        <KV label="Phụ kiện">{t.accessoriesNote || "Chưa ghi nhận"}</KV>
        {(stepButtons(t).length > 0 || t.canAddNote) && (
          <>
            <div className="section">
              <Field label="Ghi chú nội bộ kỹ thuật">
                {(id) => (
                  <textarea
                    id={id}
                    className="input full"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows="4"
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
                    rows="2"
                  />
                )}
              </Field>
              <Field
                label="Đổi ngày hẹn trả (nếu cần)"
                type="date"
                min={today()}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
              />
            </div>
            <div className="row wrap-row section">
              {stepButtons(t).map((s) => (
                <Button
                  key={s.toStatus + (s.resolution || "")}
                  tone={
                    s.toStatus === "canceled" || s.resolution === "rejected"
                      ? "ghost"
                      : "primary"
                  }
                  onClick={() =>
                    run(
                      () =>
                        svc.transition(t.id, {
                          toStatus: s.toStatus,
                          resolution: s.resolution,
                          internalNote: note,
                          publicNote,
                          expectedReturnDate: expected || null,
                          version: t.version,
                        }),
                      "Đã cập nhật yêu cầu.",
                    )
                  }
                >
                  {s.label}
                </Button>
              ))}
              {t.canAddNote && (
                <Button
                  tone="secondary"
                  onClick={() =>
                    run(
                      () =>
                        svc.addNote(t.id, {
                          internalNote: note,
                          publicNote,
                          expectedReturnDate: expected || null,
                        }),
                      "Đã lưu ghi chú.",
                    )
                  }
                >
                  Lưu ghi chú
                </Button>
              )}
            </div>
          </>
        )}
      </Panel>
      {canRelink && siblings.length > 0 && (
        <Panel title="Đổi thẻ gắn với phiếu">
          <p className="small muted">
            Dùng khi khách mang cả bộ máy và linh kiện lỗi thuộc thẻ khác trong
            cùng đơn hàng. Lý do ghi ở ô ghi chú nội bộ phía trên.
          </p>
          <Field label="Thẻ của linh kiện lỗi">
            {(id) => (
              <select
                id={id}
                className="input full"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Chọn thẻ</option>
                {siblings.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.serialNumber} · {c.productName}
                    {c.valid ? "" : " (hết hạn)"}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Button
            className="section"
            tone="secondary"
            disabled={!target}
            onClick={() =>
              run(
                () =>
                  svc.relinkCard(t.id, {
                    warrantyCardId: siblings.find(
                      (c) => String(c.id) === target,
                    ).id,
                    internalNote: note,
                  }),
                "Đã đổi thẻ của phiếu.",
              )
            }
          >
            Đổi thẻ
          </Button>
        </Panel>
      )}
      {t.canReplaceDevice && (
        <Panel title="Đổi thiết bị">
          <p className="small muted">
            Dùng khi không sửa được và khách nhận thiết bị khác. Thẻ mới có hạn
            tính lại từ hôm nay. Hệ thống chưa tự trừ tồn kho.
          </p>
          <Field
            label="Serial thiết bị thay thế"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />
          <Field label="Nguồn thiết bị thay thế">
            {(id) => (
              <select
                id={id}
                className="input full"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="supplier">Hãng gửi về</option>
                <option value="stock">Lấy từ hàng đang bán</option>
              </select>
            )}
          </Field>
          <Button
            className="section"
            tone="secondary"
            disabled={!serial.trim()}
            onClick={() => setConfirming(true)}
          >
            Đổi thiết bị
          </Button>
        </Panel>
      )}
      {confirming && (
        <Modal
          title="Xác nhận đổi thiết bị?"
          onClose={() => setConfirming(false)}
        >
          <p>
            Thẻ của serial <b className="mono">{t.card.serialNumber}</b> sẽ đóng
            lại và thẻ mới được tạo cho serial{" "}
            <b className="mono">{serial.trim().toUpperCase()}</b>. Thao tác này
            không hoàn tác được.
          </p>
          <div className="row section">
            <Button tone="secondary" onClick={() => setConfirming(false)}>
              Quay lại
            </Button>
            <Button
              onClick={() => {
                setConfirming(false);
                run(
                  () =>
                    svc.replaceDevice(t.id, {
                      newSerialNumber: serial,
                      source,
                      internalNote: note,
                      publicNote,
                    }),
                  "Đã ghi nhận đổi thiết bị.",
                );
              }}
            >
              Xác nhận đổi thiết bị
            </Button>
          </div>
        </Modal>
      )}
      <Panel title="Lịch sử xử lý">
        <Timeline events={t.events} />
      </Panel>
      {others.length > 0 && (
        <Panel title="Các phiếu trước của thiết bị">
          <RequestHistory requests={others} />
        </Panel>
      )}
      <Notice tone="neutral">
        Ghi chú nội bộ không hiển thị ở trang khách. Trả máy cho khách thực hiện
        ở màn hình Tiếp nhận bảo hành.
      </Notice>
    </fieldset>
  );
}
