import { useEffect, useState } from "react";
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
import { cardBadge, day, stepButtons, today } from "../domain/requests";
import { useAftersales } from "../hooks/useAftersales";
import { RequestHistory, Timeline } from "./RequestHistory";

export function ApiTechnicianWorkbench() {
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
            {Object.entries(REQUEST_STATUS).map(([k, v]) => (
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
                  <Badge tone="info">{REQUEST_STATUS[t.status]}</Badge>
                </div>
              </button>
            ))}
            {list && !list.length && (
              <p className="small muted">Không có phiếu nào.</p>
            )}
          </div>
        </Panel>
        {ticket ? (
          <ApiTicketEditor
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
function ApiTicketEditor({ ticket: t, svc, onChanged }) {
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
            <Badge tone="info">{REQUEST_STATUS[t.status]}</Badge>
            {t.resolution && <Badge>{REQUEST_RESOLUTION[t.resolution]}</Badge>}
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
        <KV label="Kỹ thuật viên">{t.assignedTechnicianName || "Chưa có"}</KV>
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
