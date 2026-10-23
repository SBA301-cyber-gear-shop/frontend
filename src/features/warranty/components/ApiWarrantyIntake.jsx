import { useRef, useState } from "react";
import { useStore } from "@/store";
import { dateTime } from "@/utils";
import {
  Art,
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
import { cardBadge, counterSteps, day, today } from "../domain/requests";
import { useAftersales } from "../hooks/useAftersales";
import { RequestDetail, RequestHistory } from "./RequestHistory";

const EMPTY_INTAKE = {
  issueDescription: "",
  conditionNote: "",
  accessoriesNote: "",
  contactName: "",
  contactPhone: "",
  expectedReturnDate: "",
};
export function ApiWarrantyIntake() {
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
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState(null);
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
  // Tải lại phiếu khi mở chi tiết để thấy đủ lịch sử mới nhất.
  const view = (id) =>
    svc
      .getRequest(id)
      .then(setDetail)
      .catch((err) => notify(err.message, "danger"));
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
                  <b className="mono">{card.replacedBySerialNumber}</b>. Tra cứu
                  serial mới để tiếp nhận.
                </Notice>
              )}
            </Panel>
            {open ? (
              <Panel title="Thiết bị đã có yêu cầu đang xử lý">
                <Notice tone="warning">
                  Không tạo trùng ticket cho cùng lần tiếp nhận.
                </Notice>
                <KV label="Mã phiếu">{open.requestCode}</KV>
                <KV label="Trạng thái">{REQUEST_STATUS[open.status]}</KV>
                {open.resolution && (
                  <KV label="Kết quả">{REQUEST_RESOLUTION[open.resolution]}</KV>
                )}
                <KV label="Người mang máy">
                  {open.contactName} · {open.contactPhone}
                </KV>
                <KV label="Phụ kiện nhận giữ">{open.accessoriesNote}</KV>
                <p className="section">{open.issueDescription}</p>
                {open.publicNote && (
                  <p className="small muted">Đã báo khách: {open.publicNote}</p>
                )}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => view(open.id)}
                >
                  Xem chi tiết phiếu
                </button>
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
                <div className="row wrap-row section">
                  <Button onClick={() => window.print()}>In biên nhận</Button>
                  <Button tone="secondary" onClick={() => view(receipt.id)}>
                    Xem chi tiết
                  </Button>
                </div>
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
              <RequestHistory requests={card.requests} onView={view} />
            </Panel>
          </aside>
        </div>
      ) : (
        <Empty
          title={cards ? "Không tìm thấy thiết bị" : "Tra cứu thiết bị"}
          description="Nhập đúng serial, mã đơn, số điện thoại hoặc mã phiếu. Không liên kết nhầm thẻ bảo hành."
        />
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
