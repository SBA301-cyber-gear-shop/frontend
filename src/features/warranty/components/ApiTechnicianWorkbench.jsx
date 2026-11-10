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
import { cardBadge, day, groupByPc, groupRequestsByIntake, stepButtons, today } from "../domain/requests";
import { deviceChain, historyCounts } from "../domain/deviceHistory";
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
  const groups = groupRequestsByIntake(list ?? [], filter);
  const visible = groups.flat();
  const activeId = visible.some((row) => row.id === selectedId) ? selectedId : visible[0]?.id ?? null;
  useEffect(() => {
    let alive = true;
    svc
      .listRequests("")
      .then((rows) => alive && setList(rows))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [svc, tick]);
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
          title="Lần tiếp nhận"
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
          <div className="section">
            {filter && <p className="small muted">Hiển thị cả bộ máy nếu có linh kiện khớp trạng thái đã chọn.</p>}
            {groups.map((rows) => (
              <details className="tech-intake" key={rows[0].intakeId ?? `request-${rows[0].id}`}>
                <summary className="tech-intake-heading">
                  <span className="tech-intake-summary">
                  <b>{rows[0].intakeCode || rows[0].requestCode}</b>
                  <span className="small muted">Đơn {rows[0].orderCode || "chưa rõ"} · {rows[0].contactName || "Chưa có tên liên hệ"}</span>
                  <span className="small muted">Nhận {dateTime(rows[0].createdAt)} · {rows.filter((r) => ["ready_for_return", "returned", "canceled"].includes(r.status)).length}/{rows.length} linh kiện đã xử lý</span>
                  </span>
                  <span className="tech-intake-toggle" aria-hidden="true" />
                </summary>
                {groupByPc(rows).map((group) => <div key={group.id ?? "loose"}>
                  <h4>{group.label}</h4>
                {group.items.map((t) => (
                  <button
                    type="button"
                    className={"selection tech-part " + (t.id === activeId ? "selected" : "")}
                    key={t.id}
                    aria-pressed={t.id === activeId}
                    onClick={() => {
                      setError("");
                      setSelectedId(t.id);
                    }}
                  >
                    <span className="tech-part-identity"><b>{t.productName || "Chưa rõ linh kiện"}</b><span className="small muted">{t.serialNumber || "Chưa có serial"} · {t.requestCode}</span></span>
                    <span className="tech-part-state">
                      <Badge tone={t.underWarrantyAtIntake === false ? "warning" : "success"}>
                        {t.underWarrantyAtIntake === false ? "Ngoài bảo hành lúc nhận" : t.warrantyRemainingDays == null ? "Còn bảo hành lúc nhận" : `Còn ${t.warrantyRemainingDays} ngày (${day(t.warrantyRemainingAsOf)})`}
                      </Badge>
                      <Badge tone="info">{REQUEST_STATUS[t.status] || t.status}</Badge>
                    </span>
                  </button>
                ))}</div>)}
              </details>
            ))}
            {list && !groups.length && (
              <p className="small muted">Không có lần tiếp nhận phù hợp.</p>
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
    [orderCards, setOrderCards] = useState([]),
    [historyState, setHistoryState] = useState("loading"),
    [intake, setIntake] = useState(null),
    [target, setTarget] = useState(""),
    [addTarget, setAddTarget] = useState(""),
    [serial, setSerial] = useState(""),
    [source, setSource] = useState("supplier"),
    [confirming, setConfirming] = useState(false),
    [selectedParts, setSelectedParts] = useState([]),
    [noFaultNote, setNoFaultNote] = useState(""),
    [noFaultPublicNote, setNoFaultPublicNote] = useState(""),
    [confirmingNoFault, setConfirmingNoFault] = useState(false),
    [busy, setBusy] = useState(false);
  const orderCode = t.card.orderCode,
    cardId = t.card.id,
    canRelink = t.canRelinkCard;
  // Các thẻ cùng đơn hàng và các linh kiện cùng lần tiếp nhận: khách mang cả bộ máy, lỗi có thể nằm ở linh kiện khác.
  useEffect(() => {
    let alive = true;
    setHistoryState("loading");
    if (orderCode)
      svc
        .searchCards(orderCode)
        .then((found) => {
          if (alive) {
            setOrderCards(found);
            setHistoryState(found.some((card) => card.id === cardId) ? "ready" : "error");
          }
        })
        .catch(() => alive && setHistoryState("error"));
    else setHistoryState("error");
    svc
      .getIntake(t.intakeId)
      .then((found) => alive && setIntake(found))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [svc, orderCode, cardId, t.intakeId, t.version]);
  const siblings = orderCards.filter(
    (c) => c.id !== cardId && c.status === "active" && !c.replacementPendingReturn,
  );
  // Chỉ thêm thiết bị đã được khách mang tới và chưa có phiếu đang mở.
  const addable = orderCards.filter(
    (c) => c.status === "active" && !c.openRequest && !c.replacementPendingReturn,
  );
  const rest =
    intake?.requests.filter(
      (r) => r.status === "received" || r.status === "inspecting",
    ) ?? [];
  const chosenParts = rest.filter((r) => selectedParts.includes(r.id));
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
  const chain = historyState === "ready" ? deviceChain(orderCards, t.card) : [];
  const counts = historyCounts(chain);
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
        {t.underWarrantyAtIntake === false && (
          <Notice tone="warning">Linh kiện ngoài bảo hành tại thời điểm tiếp nhận. Chỉ ghi nhận kết quả kiểm tra; không tự động sửa bảo hành.</Notice>
        )}
        {t.card.openRequest?.warrantyRemainingDays != null && (
          <KV label="Thời hạn bảo hành còn lại">
            {t.card.openRequest.warrantyRemainingDays} ngày · ngày tính {day(t.card.openRequest.warrantyRemainingAsOf)}
          </KV>
        )}
        {t.card.replacedBySerialNumber && (
          <KV label="Thiết bị thay thế">
            {t.card.replacedBySerialNumber} · hạn {day(t.card.replacedByEndDate)}
          </KV>
        )}
        <KV label="Tiếp nhận">{dateTime(t.createdAt)}</KV>
        <KV label="Ngày hẹn trả">{day(t.expectedReturnDate)}</KV>
        <KV label="Người mang máy">
          {t.contactName || "Chưa ghi nhận"} · {t.contactPhone || ""}
        </KV>
        <KV label="Kỹ thuật viên">{t.assignedTechnicianName || "Chưa có"}</KV>
        <section className="tech-intake-notes section" aria-label="Thông tin khách bàn giao">
          <div>
            <h3>Lỗi khách báo</h3>
            <p>{t.issueDescription || "Chưa ghi nhận"}</p>
          </div>
          <div>
            <h3>Ngoại quan</h3>
            <p>{t.conditionNote || "Chưa ghi nhận"}</p>
          </div>
          <details>
            <summary>Phụ kiện nhận giữ</summary>
            <p>{t.accessoriesNote || "Chưa ghi nhận"}</p>
          </details>
        </section>
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
      {intake && rest.length > 0 && (
        <Panel
          title="Kết luận linh kiện không tìm thấy lỗi"
          action={<Badge tone="info">{REQUEST_STATUS[intake.status]}</Badge>}
        >
          <p className="small muted">Chỉ chọn những linh kiện đã kiểm tra và không phát hiện lỗi. Các linh kiện không chọn giữ nguyên trạng thái.</p>
          <div className="no-fault-parts">
            {groupByPc(rest).map((group) => <div key={group.id ?? "loose"}>
              <h4>{group.label}</h4>
              {group.id !== null && <Button tone="secondary" onClick={() => setSelectedParts((ids) => [...new Set([...ids, ...group.items.map((r) => r.id)])])}>
                Chọn tất cả linh kiện của bộ PC #{group.id}
              </Button>}
            {group.items.map((r) => (
              <label className="no-fault-part" key={r.id}>
                <input type="checkbox" checked={selectedParts.includes(r.id)} onChange={(e) =>
                  setSelectedParts((ids) => e.target.checked ? [...ids, r.id] : ids.filter((id) => id !== r.id))
                } />
                <span><b>{r.productName}</b> · {r.serialNumber} · {r.requestCode}<br />
                  <span className="small muted">{REQUEST_STATUS[r.status]}{r.underWarrantyAtIntake === false ? " · Ngoài bảo hành" : ""}</span>
                </span>
              </label>
            ))}</div>)}
          </div>
          <Field label="Ghi chú kiểm tra chung (bắt buộc)">
            {(id) => <textarea id={id} className="input full" rows="2" value={noFaultNote} onChange={(e) => setNoFaultNote(e.target.value)} />}
          </Field>
          <Field label="Thông tin chung cho khách (không bắt buộc)">
            {(id) => <textarea id={id} className="input full" rows="2" value={noFaultPublicNote} onChange={(e) => setNoFaultPublicNote(e.target.value)} />}
          </Field>
          <Button className="section" tone="secondary" disabled={!chosenParts.length || !noFaultNote.trim()} onClick={() => setConfirmingNoFault(true)}>
            Xem lại {chosenParts.length} linh kiện đã chọn
          </Button>
          {confirmingNoFault && (
            <Modal title="Xác nhận kết quả kiểm tra" onClose={() => setConfirmingNoFault(false)}>
              <p>Chỉ các linh kiện sau sẽ chuyển sang <b>Chờ trả — Không tìm thấy lỗi</b>:</p>
              <ul>{chosenParts.map((r) => <li key={r.id}>{r.productName} · {r.serialNumber} · {r.requestCode}</li>)}</ul>
              <p className="small muted">Linh kiện không được chọn giữ nguyên trạng thái. Ghi chú: {noFaultNote}</p>
              <div className="row section">
                <Button tone="secondary" onClick={() => setConfirmingNoFault(false)}>Quay lại</Button>
                <Button onClick={() => {
                  setConfirmingNoFault(false);
                  run(() => svc.noFaultRest(intake.id, {
                    components: chosenParts.map((r) => ({ id: r.id, version: r.version })),
                    internalNote: noFaultNote,
                    publicNote: noFaultPublicNote,
                  }).then((updated) => {
                    setIntake(updated);
                    setSelectedParts([]);
                    setNoFaultNote("");
                    setNoFaultPublicNote("");
                    return null;
                  }).catch(async (err) => {
                    setSelectedParts([]);
                    try { setIntake(await svc.getIntake(intake.id)); } catch { /* Lỗi gốc được thông báo bên dưới. */ }
                    throw err;
                  }), "Đã kết luận các linh kiện được chọn.");
                }}>Xác nhận kết quả</Button>
              </div>
            </Modal>
          )}
        </Panel>
      )}
      {intake?.canAddComponent && addable.length > 0 && (
        <Panel title="Thêm linh kiện cùng bộ máy">
          <p className="small muted">
            Dùng khi kiểm tra thấy thêm linh kiện khác trong bộ máy khách mang
            tới cũng lỗi. Chỉ chọn linh kiện cùng đơn mà khách đã mang tới;
            linh kiện hết hạn được ghi nhận ngoài bảo hành. Lý do ghi ở ô ghi chú nội bộ phía trên.
          </p>
          <Field label="Linh kiện cần thêm">
            {(id) => (
              <select
                id={id}
                className="input full"
                value={addTarget}
                onChange={(e) => setAddTarget(e.target.value)}
              >
                <option value="">Chọn linh kiện</option>
                {addable.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.serialNumber} · {c.productName}{!c.valid ? " · ngoài bảo hành hoặc chưa có hiệu lực" : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Button
            className="section"
            tone="secondary"
            disabled={!addTarget}
            onClick={() =>
              run(
                () =>
                  svc
                    .addComponent(intake.id, {
                      warrantyCardId: Number(addTarget),
                      internalNote: note,
                    })
                    .then(() => null),
                "Đã thêm linh kiện vào lần tiếp nhận.",
              )
            }
          >
            Thêm linh kiện
          </Button>
        </Panel>
      )}
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
            Dùng khi không sửa được và khách nhận thiết bị khác. Thẻ mới giữ thời hạn
            bảo hành còn lại, cộng thời gian xử lý đến ngày đổi. Chọn hàng đang bán thì hệ thống tự trừ 1 tồn
            kho.
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
                <option value="stock" disabled={!t.replacementInStock}>
                  {t.replacementInStock
                    ? "Lấy từ hàng đang bán (trừ 1 tồn kho)"
                    : "Lấy từ hàng đang bán (đã hết hàng)"}
                </option>
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
            <b className="mono">{serial.trim().toUpperCase()}</b>.
            {source === "stock" && " Tồn kho của phiên bản này sẽ giảm 1."} Thao
            tác này không hoàn tác được.
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
      <Panel title="Lịch sử linh kiện trong đơn">
        {historyState === "loading" && <p>Đang tải lịch sử linh kiện...</p>}
        {historyState === "error" && <Notice tone="danger">Không tải được lịch sử linh kiện. Vui lòng làm mới và thử lại.</Notice>}
        {historyState === "ready" && <>
          <p>Chuỗi serial: {chain.map((card) => card.serialNumber).join(" → ")}</p>
          <p>{counts.received} lần tiếp nhận · {counts.repaired} lần sửa · {counts.replaced} lần đổi</p>
          {chain.map((card) => <div key={card.id} className="section">
            <h4>Serial {card.serialNumber}{card.id === cardId ? " (phiếu hiện tại)" : ""}</h4>
            <RequestHistory requests={card.requests || []} />
          </div>)}
        </>}
      </Panel>
      <Notice tone="neutral">
        Ghi chú nội bộ không hiển thị ở trang khách. Trả cả bộ máy cho khách
        thực hiện ở màn hình Tiếp nhận bảo hành.
      </Notice>
    </fieldset>
  );
}
