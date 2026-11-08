import { dateTime, money, formatShortOrderCode, formatOrderSuffix } from "@/utils";
import { useEffect, useState } from "react";
import { OrderSelector } from "./OrderSelector";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants";
import { OrderLines } from "@/features/products";
import { warrantyRemainingText } from "@/features/warranty";
import {
  Badge,
  Button,
  Heading,
  KV,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { Field } from "@/components/form";
import { useOrderOperations } from "../hooks/useOrderOperations";
import { ordersApi } from "../api/ordersApi";
import { CashCollectionModal } from "./CashCollectionModal";
import { CancelOrderModal } from "./CancelOrderModal";

export function OrderOperations({ handover = false }) {
  const {
    data,
    setParams,
    search,
    setSearch,
    status,
    setStatus,
    confirm,
    setConfirm,
    navigate,
    filtered,
    statusCounts,
    selected,
    serials,
    setSerials,
    checked,
    setChecked,
    update,
    count,
    finish,
    demoMode,
    busy,
    loading,
    error,
    refresh,
    warrantyLines,
    recipientPhone,
    setRecipientPhone,
    receivedAmount,
    setReceivedAmount,
    reference,
    setReference,
    cancelConfirm,
    setCancelConfirm,
  } = useOrderOperations();
  
  const [copied, setCopied] = useState(false);
  const [warranties, setWarranties] = useState({ order: null, cards: [], error: null, loading: false });
  const selectedCode = selected?.id;
  const selectedStatus = selected?.status;
  useEffect(() => {
    if (demoMode || !selectedCode || selectedStatus !== "completed") return;
    const controller = new AbortController();
    setWarranties({ order: selectedCode, cards: [], error: null, loading: true });
    ordersApi.warrantyCards(selectedCode, controller.signal).then(
      (cards) => { if (!controller.signal.aborted) setWarranties({ order: selectedCode, cards, error: null, loading: false }); },
      () => { if (!controller.signal.aborted) setWarranties({ order: selectedCode, cards: [], error: "Không tải được thẻ bảo hành.", loading: false }); },
    );
    return () => controller.abort();
  }, [demoMode, selectedCode, selectedStatus]);

  const handleAutoFillHandover = () => {
    if (!selected) return;
    const nextSerials = { ...serials };
    const prefix = Date.now().toString(36).slice(-4).toUpperCase();

    warrantyLines
      .flatMap((l) =>
        Array.from({ length: l.quantity }, (_, i) => ({
          line: l,
          index: i,
        })),
      )
      .forEach((u, i) => {
        const cleanName = (u.line.name || "DEV")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8);
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        nextSerials[`${selected.id}-${i}`] = `SN-${cleanName}-${prefix}${rand}`;
      });

    setSerials(nextSerials);
    if (selected.pickupPhone) {
      setRecipientPhone(selected.pickupPhone);
    }
    setChecked(true);
  };

  if (loading) return <Notice>Đang tải danh sách đơn hàng…</Notice>;
  if (error)
    return (
      <div className="stack">
        <Notice tone="danger">{error}</Notice>
        <Button onClick={refresh}>Tải lại đơn hàng</Button>
      </div>
    );
  return (
    <>
      <Heading
        title={handover ? "Bàn giao đơn hàng" : "Xử lý đơn hàng"}
        sub="Đối chiếu đơn, thu tiền và chuẩn bị bàn giao tại cửa hàng."
        eyebrow="VẬN HÀNH / ĐƠN HÀNG"
      />
      <OrderSelector
        orders={filtered}
        statusCounts={statusCounts}
        selected={selected}
        busy={busy}
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        onSelect={(o) => {
          setParams({ id: o.id });
          setChecked(false);
        }}
      />
      {selected && (
        <div className="split section">
          <div className="stack">
            <Panel
              title={
                <div className="order-detail-header-code">
                  <span>{formatShortOrderCode(selected.id)}</span>
                  <span className="order-full-code-chip" title="Mã đơn đầy đủ">
                    {selected.id}
                    <button
                      type="button"
                      className="order-copy-action-btn"
                      title="Sao chép toàn bộ mã đơn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(selected.id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "✓ Đã chép" : "📋"}
                    </button>
                  </span>
                  <span className="order-ref-suffix">
                    Đuôi: #{formatOrderSuffix(selected.id)}
                  </span>
                </div>
              }
              action={
                <Badge
                  tone={
                    {
                      pending: "warning",
                      confirmed: "info",
                      preparing: "info",
                      ready_for_pickup: "success",
                      completed: "success",
                      canceled: "danger",
                    }[selected.status] || "info"
                  }
                >
                  {ORDER_STATUS[selected.status]}
                </Badge>
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
              {!demoMode && selected.lines.map((line) => (
                <div key={line.orderItemId} className="section small">
                  <b>{line.name}</b> · Dòng đơn #{line.orderItemId} · Phiên bản #{line.id}
                  {selected.status !== "completed" ? (
                    <p>Chưa bàn giao; chưa có thẻ bảo hành.</p>
                  ) : warranties.order === selected.id && warranties.error ? (
                    <p role="alert">{warranties.error}</p>
                  ) : warranties.order !== selected.id || warranties.loading ? (
                    <p>Đang tải thẻ bảo hành…</p>
                  ) : !warranties.cards.some((card) => card.orderItemId === line.orderItemId) ? (
                    <p>Không có thẻ bảo hành cho dòng hàng này.</p>
                  ) : warranties.order === selected.id && warranties.cards.filter((card) => card.orderItemId === line.orderItemId).map((card) => (
                    <p key={card.id}>Thẻ #{card.id} · Serial {card.serialNumber} · Hạn {dateTime(card.endDate)} · {warrantyRemainingText(card)}{card.replacedBySerialNumber ? ` · Đổi sang ${card.replacedBySerialNumber}` : ""}</p>
                  ))}
                </div>
              ))}
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
            {selected.status === "canceled" && (
              <Panel title="Lý do hủy đơn">
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.cancelReason || "Đơn cũ chưa ghi nhận lý do hủy."}</p>
              </Panel>
            )}
            {handover && (
              <Panel
                title={"Serial từng thiết bị · " + count + " thiết bị"}
                action={
                  // Serial giả chỉ để thử trên máy dev; bản build không có nút này.
                  import.meta.env.DEV && (
                    <Button
                      tone="secondary"
                      onClick={handleAutoFillHandover}
                      disabled={busy}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      ⚡ Điền nhanh Serial & SĐT
                    </Button>
                  )
                }
              >
                <Notice>
                  Nhập số serial từ tem/vỏ hộp của từng thiết bị bàn giao. Mỗi thiết bị có một mã duy nhất để kích hoạt bảo hành điện tử.
                </Notice>
                <div className="stack section">
                  {warrantyLines
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
                        placeholder="VD: SN-8823901 (hoặc quét mã vạch trên vỏ hộp)"
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
                {!demoMode && (
                  <div className="section">
                    <Field
                      label="Số điện thoại người đến nhận để đối chiếu"
                      placeholder="VD: 0987654321"
                      value={recipientPhone}
                      maxLength={20}
                      onChange={(event) =>
                        setRecipientPhone(event.target.value)
                      }
                    />
                  </div>
                )}
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
                    <Button
                      className="full"
                      disabled={busy}
                      onClick={() => setConfirm(true)}
                    >
                      Xác nhận đã thu đủ
                    </Button>
                    <p className="tiny muted section">
                      {demoMode
                        ? "Demo: chỉ xác nhận sau khi đối chiếu khoản thu."
                        : "Chỉ xác nhận sau khi thực tế đã nhận đủ tiền của khách."}
                    </p>
                  </>
                )}
            </Panel>
            <Panel title="Bước tiếp theo" className="summary">
              {["pending", "confirmed", "preparing"].includes(
                selected.status,
              ) && (
                <Button
                  className="full"
                  disabled={busy}
                  onClick={() => update("advance")}
                >
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
                    !checked ||
                    busy
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
                    selected.payment !== "SUCCESS" ||
                    busy
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
                  {warrantyLines.length
                    ? "Đã bàn giao và kích hoạt bảo hành."
                    : "Đã bàn giao đơn hàng."}
                </Notice>
              )}
              {!demoMode &&
                !["completed", "canceled"].includes(selected.status) && (
                  <Button
                    tone="ghost"
                    className="full"
                    disabled={
                      busy ||
                      (selected.payment === "SUCCESS" && selected.final > 0)
                    }
                    onClick={() => setCancelConfirm(true)}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
            </Panel>
          </aside>
        </div>
      )}
      {confirm && selected && (
        <CashCollectionModal
          key={selected.id}
          order={selected}
          demoMode={demoMode}
          busy={busy}
          receivedAmount={receivedAmount}
          setReceivedAmount={setReceivedAmount}
          reference={reference}
          setReference={setReference}
          onClose={() => setConfirm(false)}
          onConfirm={() => update("pay")}
        />
      )}
      {cancelConfirm && selected && (
        <CancelOrderModal key={selected.id} orderId={selected.id} busy={busy} onClose={() => setCancelConfirm(false)} onConfirm={(reason) => update("cancel", reason)} />
      )}
    </>
  );
}
