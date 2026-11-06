import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { dateTime } from "@/utils";
import {
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { Field } from "@/components/form";
import { REQUEST_RESOLUTION, REQUEST_STATUS } from "../constants";
import { cardBadge, day, today, warrantyRemainingText } from "../domain/requests";
import { useAftersales } from "../hooks/useAftersales";
import { RequestDetail, RequestHistory } from "./RequestHistory";

const EMPTY_INTAKE = {
  issueDescription: "",
  conditionNote: "",
  contactName: "",
  contactPhone: "",
  expectedReturnDate: "",
};
// Linh kiện tạo được phiếu: thẻ còn hoạt động, còn hạn, chưa có phiếu đang mở.
const selectable = (c) => c.status === "active" && c.valid && !c.openRequest;
// Linh kiện hết hạn được tiếp nhận để kiểm tra ngoài bảo hành.
const extraable = (c) => c.status === "active" && !c.valid && !c.openRequest;

// Nhóm kết quả tra cứu theo đơn hàng; trong mỗi đơn, linh kiện cùng cấu hình PC gom thành "Bộ PC", còn lại là "Mua lẻ".
function groupByOrder(cards) {
  const orders = new Map();
  for (const c of cards) {
    if (!orders.has(c.orderId))
      orders.set(c.orderId, { ...c, groups: new Map() });
    const groups = orders.get(c.orderId).groups;
    const key = c.pcCustomId ? "pc-" + c.pcCustomId : "loose";
    if (!groups.has(key))
      groups.set(key, {
        key,
        pcId: c.pcCustomId || null,
        label: c.pcCustomId
          ? "Bộ PC (cấu hình #" + c.pcCustomId + ")"
          : "Mua lẻ",
        cards: [],
      });
    groups.get(key).cards.push(c);
  }
  return [...orders.values()].map((o) => ({
    ...o,
    groups: [...o.groups.values()].sort((a, b) =>
      a.key === "loose" ? 1 : b.key === "loose" ? -1 : 0,
    ),
  }));
}

// In đúng biên nhận được bấm: đánh dấu khung đó để CSS in ẩn mọi thứ khác.
function printReceipt(e) {
  const el = e.currentTarget.closest(".receipt");
  el.classList.add("print-target");
  window.addEventListener(
    "afterprint",
    () => el.classList.remove("print-target"),
    { once: true },
  );
  window.print();
}

// Mỗi đơn tự giữ lựa chọn và form riêng, nên mở hay thao tác ở đơn này không ảnh hưởng đơn khác.
function OrderIntake({
  order: o,
  open,
  onToggle,
  preselected,
  onHistory,
  onOpenIntake,
  onCreate,
  receipts,
}) {
  const [selected, setSelected] = useState(() => new Set(preselected)),
    [extra, setExtra] = useState(() => new Set()),
    // Phụ kiện nhận giữ: linh kiện quầy giữ lại, và pcCustomId của từng bộ PC nhận nguyên bộ.
    [kept, setKept] = useState(() => new Set(preselected)),
    [fullPc, setFullPc] = useState(() => new Set()),
    [form, setForm] = useState(() => ({
      ...EMPTY_INTAKE,
      contactName: o.pickupName || "",
      contactPhone: o.pickupPhone || "",
    })),
    [verified, setVerified] = useState(false);
  const orderCards = o.groups.flatMap((g) => g.cards);
  // Chỉ nhóm bộ PC mới có lựa chọn nhận nguyên bộ; nhóm mua lẻ thì không.
  const pcGroups = o.groups.filter((g) => g.pcId);
  const historyCount = orderCards.reduce(
    (n, c) => n + (c.requests || []).length,
    0,
  );
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const flip = (prev, id, add) => {
    const next = new Set(prev);
    if (add) next.add(id);
    else next.delete(id);
    return next;
  };
  function toggle(setter, current, card) {
    const on = !current.has(card.id);
    setter((prev) => flip(prev, card.id, on));
    // Linh kiện tick ở đơn là thiết bị khách để lại, nên tự chọn luôn ở phụ kiện nhận giữ.
    setKept((prev) => flip(prev, card.id, on));
    // Bỏ một linh kiện thì bộ PC chứa nó không còn là nguyên bộ.
    if (!on) setFullPc((prev) => flip(prev, card.pcCustomId, false));
  }
  // Chọn hoặc bỏ cả bộ PC: tick mọi linh kiện của bộ và ghi "nguyên bộ PC" ở phụ kiện nhận giữ.
  function pickPc(g, on) {
    const apply = (prev, pred) => {
      const next = new Set(prev);
      for (const c of g.cards)
        if (on && pred(c)) next.add(c.id);
        else next.delete(c.id);
      return next;
    };
    setSelected((prev) => apply(prev, selectable));
    setExtra((prev) => apply(prev, extraable));
    setKept((prev) => apply(prev, () => true));
    setFullPc((prev) => flip(prev, g.pcId, on));
  }
  // Ghi chú phụ kiện gửi lên API được ghép từ lựa chọn trong dropdown.
  const accessories =
    [
      ...pcGroups
        .filter((g) => fullPc.has(g.pcId))
        .map((g) => "Nguyên bộ PC #" + g.pcId),
      ...orderCards
        .filter((c) => kept.has(c.id) && !fullPc.has(c.pcCustomId))
        .map((c) => c.productName + " (" + c.serialNumber + ")"),
    ].join(", ") || "Không có";
  function submit(e) {
    e.preventDefault();
    onCreate({
      ...form,
      accessoriesNote: accessories,
      warrantyCardIds: [...selected],
      outOfWarrantyCardIds: [...extra],
    });
  }
  const pcPick = (g) => (
    <input
      type="checkbox"
      checked={fullPc.has(g.pcId)}
      onChange={(e) => pickPc(g, e.target.checked)}
    />
  );
  return (
    <Panel className="intake-order-panel">
      <div className="intake-order-bar">
        <button
          type="button"
          className="intake-order-head"
          aria-expanded={open}
          onClick={onToggle}
        >
          <b>{"Đơn " + o.orderCode}</b>
          <span className="small muted">
            {o.customerName}
            {o.customerPhone ? " · " + o.customerPhone : ""} ·{" "}
            {orderCards.length} linh kiện
            {selected.size + extra.size
              ? " · đã chọn " + (selected.size + extra.size)
              : ""}
          </span>
          <span className="intake-order-toggle">
            {open ? "Thu gọn ▲" : "Mở đơn ▼"}
          </span>
        </button>
        <button type="button" className="text-button" onClick={onHistory}>
          Lịch sử bảo hành ({historyCount})
        </button>
      </div>
      {receipts.length > 0 && (
        <div className="intake-open-requests">
          {receipts.map((receipt) => (
            <button type="button" className="text-button" key={receipt.id} onClick={() => onOpenIntake(receipt.id)}>
              Xem phiếu {receipt.intakeCode}
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="intake-order">
          <div>
            {o.groups.map((g) => (
              <details className="intake-group" open key={g.key}>
                <summary>
                  {g.label} · {g.cards.length} linh kiện
                </summary>
                {g.pcId && (
                  <label className="filter-option intake-pc-pick">
                    {pcPick(g)}
                    <b>Nhận nguyên bộ PC</b>
                    <span className="small muted">
                      (chọn tất cả linh kiện của bộ)
                    </span>
                  </label>
                )}
                {g.cards.map((c) => (
                  <div className="ticket-preview intake-part" key={c.id}>
                    <div>
                      {selectable(c) ? (
                        <label className="filter-option">
                          <input
                            type="checkbox"
                            checked={selected.has(c.id)}
                            onChange={() => toggle(setSelected, selected, c)}
                          />
                          <b>{c.productName}</b>
                        </label>
                      ) : extraable(c) ? (
                        <label className="filter-option">
                          <input
                            type="checkbox"
                            checked={extra.has(c.id)}
                            onChange={() => toggle(setExtra, extra, c)}
                          />
                          <b>{c.productName}</b>
                          <span className="small muted">(ngoài bảo hành)</span>
                        </label>
                      ) : (
                        <b>{c.productName}</b>
                      )}
                    </div>
                    <div className="small">
                      <span className="muted">{c.variantName}</span>
                      <span className="mono">{c.serialNumber}</span>
                    </div>
                    <div className="intake-part-status">
                      <Badge tone={cardBadge(c)[0]}>{cardBadge(c)[1]}</Badge>
                      <span>Hạn {day(c.endDate)} · {warrantyRemainingText(c)}</span>
                      {c.openRequest && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => onOpenIntake(c.openRequest.intakeId)}
                        >
                          Đang bảo hành ·{" "}
                          {c.openRequest.intakeCode ||
                            c.openRequest.requestCode}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </details>
            ))}
          </div>
          {/* Form luôn hiện cạnh danh sách và dính trên màn hình khi cuộn. */}
          <aside className="intake-form">
            <div className="between panel-title">
              <h3>Tiếp nhận linh kiện</h3>
              <span className="small muted">
                Đã chọn {selected.size}
                {extra.size > 0 ? " · ngoài bảo hành " + extra.size : ""}
              </span>
            </div>
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
              <Field
                label="Tình trạng ngoại quan"
                value={form.conditionNote}
                onChange={set("conditionNote")}
                required
              />
              <div className="field">
                <span className="field-label">Phụ kiện nhận giữ</span>
                <details className="intake-dropdown">
                  <summary className="input">{accessories}</summary>
                  <div className="intake-dropdown-menu">
                    {pcGroups.map((g) => (
                      <label className="filter-option" key={g.key}>
                        {pcPick(g)}
                        <b>Nhận nguyên bộ PC #{g.pcId}</b>
                      </label>
                    ))}
                    {orderCards.map((c) => (
                      <label className="filter-option" key={c.id}>
                        <input
                          type="checkbox"
                          disabled={fullPc.has(c.pcCustomId)}
                          checked={kept.has(c.id)}
                          onChange={() =>
                            setKept((prev) => flip(prev, c.id, !prev.has(c.id)))
                          }
                        />
                        {c.productName}
                        <small className="mono">{c.serialNumber}</small>
                      </label>
                    ))}
                  </div>
                </details>
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
              <Button type="submit" disabled={!verified || !(selected.size + extra.size)}>
                Tạo phiếu tiếp nhận
              </Button>
              {!(selected.size + extra.size) && (
                <p className="small muted section">
                  Chọn ít nhất một linh kiện trong danh sách bên trái để tiếp nhận.
                </p>
              )}
            </form>
          </aside>
        </div>
      )}
    </Panel>
  );
}

export function ApiWarrantyIntake() {
  const svc = useAftersales(),
    { notify } = useStore(),
    // Từ khóa tra cứu và các đơn đang mở nằm trên URL để tải lại trang vẫn giữ nguyên màn hình.
    [params, setParams] = useSearchParams(),
    [query, setQuery] = useState(() => params.get("q") || ""),
    [asked, setAsked] = useState(""),
    [cards, setCards] = useState(null),
    // Linh kiện chọn sẵn khi tra đúng serial; mỗi đơn đọc phần của mình khi dựng lại.
    [preselect, setPreselect] = useState(() => new Set()),
    // Đơn nào mở thì tự mở, không ảnh hưởng đơn khác; mỗi lần tra cứu dựng lại các đơn bằng round.
    [openOrders, setOpenOrders] = useState(
      () =>
        new Set(
          (params.get("open") || "").split(",").filter(Boolean).map(Number),
        ),
    ),
    [round, setRound] = useState(0),
    [history, setHistory] = useState(null),
    [intake, setIntake] = useState(null),
    // Biên nhận của các lần tiếp nhận còn mở, tải từ server; mỗi đơn chỉ hiện biên nhận của mình.
    [receipts, setReceipts] = useState([]),
    [note, setNote] = useState(""),
    [publicNote, setPublicNote] = useState(""),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState(null);
  // Số thứ tự của lần tra cứu hoặc mở phiếu mới nhất, để bỏ kết quả về trễ của lần trước.
  const latest = useRef(0);

  async function openIntake(id) {
    const mine = ++latest.current;
    setNote("");
    setPublicNote("");
    const found = await svc.getIntake(id);
    if (mine === latest.current) setIntake(found);
  }
  async function search(q, keepIntakeId, keepOpen = false) {
    const mine = ++latest.current;
    try {
      const found = await svc.searchCards(q);
      // Biên nhận lấy lại từ server cho mọi lần tiếp nhận còn mở, nên tải lại trang vẫn in được.
      const intakeIds = [
        ...new Set(
          found.map((c) => c.openRequest?.intakeId).filter((v) => v != null),
        ),
      ];
      const intakes = await Promise.all(
        intakeIds.map((id) => svc.getIntake(id)),
      );
      if (mine !== latest.current) return;
      setReceipts(
        intakes.sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt)),
        ),
      );
      setAsked(q);
      setCards(found);
      // Chọn sẵn thẻ khớp trực tiếp (ví dụ đúng serial khách mang tới), chỉ khi chúng cùng một đơn.
      const pick = found.filter((c) => c.matched && selectable(c));
      setPreselect(
        new Set(
          new Set(pick.map((c) => c.orderId)).size === 1
            ? pick.map((c) => c.id)
            : [],
        ),
      );
      setRound((r) => r + 1);
      // Tra ra đúng một đơn thì mở sẵn; tải lại sau thao tác hoặc tải lại trang thì giữ nguyên các đơn đang mở.
      if (keepIntakeId == null && !keepOpen)
        setOpenOrders(
          new Set(
            new Set(found.map((c) => c.orderId)).size === 1
              ? [found[0].orderId]
              : [],
          ),
        );
      // Chỉ tự mở khi tra đúng mã phiếu hoặc vừa tạo/cập nhật phiếu.
      const code = q.trim().toUpperCase();
      const matchedCards = found.filter((c) => c.matched);
      const byCode = matchedCards
        .flatMap((c) => c.requests)
        .find((r) => r.intakeCode === code || r.requestCode === code);
      const target = keepIntakeId ?? byCode?.intakeId;
      if (target != null) await openIntake(target);
      else setIntake(null);
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  // Khóa form trong lúc gửi để không tạo hai lần tiếp nhận khi bấm hai lần.
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
  const create = (payload) =>
    write(async () => {
      if (!payload.warrantyCardIds.length && !payload.outOfWarrantyCardIds.length)
        throw new Error("Chọn ít nhất một linh kiện để tiếp nhận.");
      const created = await svc.createIntake(payload);
      notify("Đã tạo phiếu tiếp nhận.");
      // Tải lại kết quả cũng tải biên nhận của lần tiếp nhận vừa tạo.
      await search(asked, created.id);
    });
  const toggleOrder = (id) =>
    setOpenOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Sau mỗi thao tác, tải lại cả kết quả tra cứu để thấy thẻ nào đã có phiếu, thẻ nào đã trả.
  const act = (action, message) =>
    write(async () => {
      await action();
      notify(message);
      await search(asked, intake.id);
    });
  // Vào trang bằng URL có ?q= (kể cả tải lại trang) thì tra cứu lại và giữ các đơn đang mở trên URL.
  useEffect(() => {
    const q = params.get("q");
    // Gọi trong then để cập nhật state sau khi effect chạy xong; chỉ chạy một lần khi vào trang.
    if (q) Promise.resolve().then(() => search(q, undefined, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Ghi lại từ khóa và các đơn đang mở lên URL sau mỗi lần tra cứu hoặc mở/thu gọn đơn.
  useEffect(() => {
    if (cards === null) return;
    const next = asked ? { q: asked } : {};
    if (openOrders.size) next.open = [...openOrders].join(",");
    setParams(next, { replace: true });
  }, [asked, openOrders, cards, setParams]);
  const view = (id) =>
    svc
      .getRequest(id)
      .then(setDetail)
      .catch((err) => notify(err.message, "danger"));
  const orders = cards ? groupByOrder(cards) : [];
  const partActions = intake
    ? intake.requests.some(
        (r) => r.status === "ready_for_return" || r.status === "received",
      ) ||
      intake.canReturn ||
      intake.canCancel
    : false;
  return (
    <>
      <Heading
        title="Tiếp nhận bảo hành"
        sub="Tra cứu theo đơn hàng, tiếp nhận cả bộ máy hoặc từng linh kiện, trả máy tại quầy."
        eyebrow="VẬN HÀNH / BẢO HÀNH"
      />
      <form
        className="row section-title"
        onSubmit={(e) => {
          e.preventDefault();
          setReceipts([]);
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
      {orders.length ? (
        <fieldset
          className="stack plain-fieldset section intake-page"
          disabled={busy}
        >
          {orders.map((o) => (
            <OrderIntake
              key={o.orderId + "-" + round}
              order={o}
              open={openOrders.has(o.orderId)}
              onToggle={() => toggleOrder(o.orderId)}
              preselected={o.groups
                .flatMap((g) => g.cards)
                .filter((c) => preselect.has(c.id))
                .map((c) => c.id)}
              onHistory={() => setHistory(o)}
              onOpenIntake={(id) =>
                openIntake(id).catch((err) => notify(err.message, "danger"))
              }
              onCreate={create}
              receipts={receipts.filter((r) => r.orderCode === o.orderCode)}
            />
          ))}
          {intake && (
            <Modal className="intake-drawer" title={"Phiếu tiếp nhận " + intake.intakeCode} onClose={() => { latest.current++; setIntake(null); }}>
              <Badge tone="info">{REQUEST_STATUS[intake.status]}</Badge>
              <KV label="Đơn mua">{intake.orderCode}</KV>
              <KV label="Người mang máy">
                {intake.contactName} · {intake.contactPhone}
              </KV>
              <KV label="Tiếp nhận lúc">{dateTime(intake.createdAt)}</KV>
              <KV label="Ngày hẹn trả">{day(intake.expectedReturnDate)}</KV>
              <p className="section">{intake.issueDescription}</p>
              <details className="intake-receipt-toggle section">
                <summary>Xem và in biên nhận</summary>
                <div className="receipt intake-receipt">
                  <h3>Biên nhận {intake.intakeCode}</h3>
                  <KV label="Khách hàng">{intake.customerName}</KV>
                  <KV label="Người mang máy">{intake.contactName} · {intake.contactPhone}</KV>
                  <KV label="Đơn mua">{intake.orderCode}</KV>
                  <KV label="Tiếp nhận lúc">{dateTime(intake.createdAt)}</KV>
                  <KV label="Ngày hẹn trả">{day(intake.expectedReturnDate)}</KV>
                  <h4 className="section">Thiết bị nhận</h4>
                  {intake.requests.map((r) => (
                    <p className="small" key={r.id}>
                      <b className="mono">{r.requestCode}</b> · {r.productName} · <span className="mono">{r.serialNumber}</span>
                      {" · "}Thẻ #{r.warrantyCardId} · Bảo hành: {day(r.warrantyStartDate)} – {day(r.warrantyEndDate)} (hạn hiện tại hoặc dự kiến sau sửa)
                      {r.warrantyRemainingDays != null && ` · Còn ${r.warrantyRemainingDays} ngày tính tại ${day(r.warrantyRemainingAsOf)}`}
                      {r.replacementSerialNumber && ` · Đổi sang ${r.replacementSerialNumber}, hạn mới ${day(r.replacementWarrantyEndDate)}`}
                      {r.replacementWarrantyRemainingDays != null && ` · Còn ${r.replacementWarrantyRemainingDays} ngày tính từ hôm nay`}
                    </p>
                  ))}
                  <p className="section">{intake.issueDescription}</p>
                  <KV label="Ngoại quan">{intake.conditionNote}</KV>
                  <KV label="Phụ kiện">{intake.accessoriesNote}</KV>
                  <div className="row wrap-row section"><Button onClick={printReceipt}>In biên nhận</Button></div>
                </div>
              </details>
              {intake.requests.map((r) => (
                <div className="ticket-preview intake-request-row" key={r.id}>
                  <b className="mono">{r.requestCode}</b>
                  <span className="small intake-request-product">
                    {r.productName} · {r.serialNumber}
                  </span>
                  <div className="intake-request-status">
                    <Badge tone="info">{REQUEST_STATUS[r.status]}</Badge>
                    {r.underWarrantyAtIntake === false && <Badge tone="warning">Ngoài bảo hành</Badge>}
                    {r.resolution && <Badge>{REQUEST_RESOLUTION[r.resolution]}</Badge>}
                  </div>
                  <div className="intake-request-actions">
                    {r.status === "ready_for_return" && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          act(
                            () =>
                              svc.transition(r.id, {
                                toStatus: "inspecting",
                                internalNote: note,
                                publicNote,
                              }),
                            "Đã chuyển linh kiện về kiểm tra lại.",
                          )
                        }
                      >
                        Khách báo còn lỗi
                      </button>
                    )}
                    {r.status === "received" && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          act(
                            () =>
                              svc.transition(r.id, {
                                toStatus: "canceled",
                                internalNote: note,
                                publicNote,
                              }),
                            "Đã hủy phiếu của linh kiện.",
                          )
                        }
                      >
                        Hủy linh kiện
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => view(r.id)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
              {partActions && (
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
                    {intake.canReturn && (
                      <Button
                        onClick={() =>
                          act(
                            () =>
                              svc.returnIntake(intake.id, {
                                internalNote: note,
                                publicNote,
                              }),
                            "Đã trả cả bộ máy cho khách.",
                          )
                        }
                      >
                        Trả cả bộ máy
                      </Button>
                    )}
                    {intake.canCancel && (
                      <Button
                        tone="ghost"
                        onClick={() =>
                          act(
                            () =>
                              svc.cancelIntake(intake.id, {
                                internalNote: note,
                                publicNote,
                              }),
                            "Đã hủy lần tiếp nhận.",
                          )
                        }
                      >
                        Hủy cả lần tiếp nhận
                      </Button>
                    )}
                  </div>
                  {!intake.canReturn && intake.status !== "returned" && (
                    <p className="small muted">
                      Trả máy khi mọi linh kiện đã xử lý xong (chờ trả khách
                      hoặc đã hủy).
                    </p>
                  )}
                </div>
              )}
              {intake.requests.some((r) => r.status === "returned") && <Notice tone="neutral">
              Lần tiếp nhận đã trả máy cho khách. Xem lịch sử từng linh kiện ở
              nút "Xem chi tiết".
              </Notice>}
            </Modal>
          )}
        </fieldset>
      ) : (
        <Empty
          title={cards ? "Không tìm thấy thiết bị" : "Tra cứu thiết bị"}
          description="Nhập đúng serial, mã đơn, số điện thoại hoặc mã phiếu. Không liên kết nhầm thẻ bảo hành."
        />
      )}
      {history && (
        <Modal
          title={"Lịch sử bảo hành · đơn " + history.orderCode}
          onClose={() => setHistory(null)}
        >
          {history.groups
            .flatMap((g) => g.cards)
            .map((c) => (
              <div className="intake-history" key={c.id}>
                <h3>
                  {c.productName} ·{" "}
                  <span className="mono">{c.serialNumber}</span>
                </h3>
                {c.repairedCount >= 3 && (
                  <Notice tone="warning">
                    Thiết bị đã sửa {c.repairedCount} lần. Cân nhắc đổi thiết bị
                    nếu lỗi tái diễn.
                  </Notice>
                )}
                <RequestHistory
                  requests={c.requests || []}
                  onView={(id) => {
                    setHistory(null);
                    view(id);
                  }}
                />
              </div>
            ))}
        </Modal>
      )}
      {detail && (
        <Modal
          title={"Phiếu " + detail.requestCode}
          onClose={() => setDetail(null)}
        >
          <RequestDetail ticket={detail} />
        </Modal>
      )}
    </>
  );
}
