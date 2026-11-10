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
  Icon,
  KV,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { Field } from "@/components/form";
import { useOrderOperations } from "../hooks/useOrderOperations";
import { useStore } from "@/store";
import { shippingApi } from "../api/shippingApi";
import { ordersApi } from "../api/ordersApi";
import { CashCollectionModal } from "./CashCollectionModal";
import { CancelOrderModal } from "./CancelOrderModal";
import { EditShippingAddressModal } from "./EditShippingAddressModal";

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

  const { notify } = useStore();
  const [copied, setCopied] = useState(false);
  const [shippingActionBusy, setShippingActionBusy] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [warranties, setWarranties] = useState({ order: null, cards: [], error: null, loading: false });
  const [cashCollection, setCashCollection] = useState(null);

  const selectedCode = selected?.id;
  const selectedStatus = selected?.status;
  const isCounterCash =
    (selected?.deliveryType ?? "store") === "store" && selected?.method === "store";
  const canCollect =
    isCounterCash && selected?.payment === "PENDING" &&
    !["canceled", "completed"].includes(selectedStatus);
  const showCashCollection =
    !demoMode && isCounterCash && selected?.payment === "SUCCESS" && selected.final > 0;
  const collection = cashCollection?.code === selectedCode ? cashCollection : null;

  useEffect(() => {
    if (!showCashCollection || !selectedCode) return;
    const controller = new AbortController();
    ordersApi.cashCollection(selectedCode, controller.signal).then(
      (receipt) => {
        if (!controller.signal.aborted) setCashCollection({ code: selectedCode, receipt });
      },
      () => {
        if (!controller.signal.aborted) setCashCollection({ code: selectedCode, error: true });
      },
    );
    return () => controller.abort();
  }, [selectedCode, showCashCollection]);

  useEffect(() => {
    if (selected?.deliveryType === "shipping" && selected?.trackingCode) {
      shippingApi
        .getTracking(selected.id)
        .then((res) => setTrackingInfo(res))
        .catch(() => setTrackingInfo(null));
    } else {
      setTrackingInfo(null);
    }
  }, [selected?.id, selected?.trackingCode]);

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

  const handleCreateShipment = async () => {
    if (!selected) return;
    setShippingActionBusy(true);
    try {
      const res = await shippingApi.createShipment(selected.id);
      notify(`Đã tạo vận đơn GHN thành công! Mã: ${res.trackingCode}`, "success");
      setTrackingInfo(res);
      if (selected.status === "preparing") {
        await update("advance");
      } else {
        refresh();
      }
    } catch (err) {
      notify(err.message || "Không thể tạo vận đơn GHN", "danger");
    } finally {
      setShippingActionBusy(false);
    }
  };

  const handlePrintA5 = async () => {
    if (!selected) return;
    setShippingActionBusy(true);
    try {
      const res = await shippingApi.getPrintToken(selected.id);
      if (res.printUrl) {
        window.open(res.printUrl, "_blank", "noopener,noreferrer");
      } else {
        notify("Không lấy được đường dẫn in tem", "warning");
      }
    } catch (err) {
      notify(err.message || "Lỗi tạo link in tem", "danger");
    } finally {
      setShippingActionBusy(false);
    }
  };

  const handleSyncTracking = async () => {
    if (!selected) return;
    setShippingActionBusy(true);
    try {
      const res = await shippingApi.getTracking(selected.id);
      setTrackingInfo(res);
      notify("Đã đồng bộ thông tin mới nhất từ GHN!", "success");
      refresh();
    } catch (err) {
      notify(err.message || "Lỗi đồng bộ GHN", "danger");
    } finally {
      setShippingActionBusy(false);
    }
  };

  const handleSwitchStatus = async (targetStatus) => {
    if (!selected) return;
    setShippingActionBusy(true);
    try {
      const res = await shippingApi.switchStatus(
        selected.id,
        targetStatus,
        "Cập nhật thử nghiệm từ trang quản trị",
      );
      setTrackingInfo(res);
      notify(`[Sandbox] Đã chuyển trạng thái GHN sang: ${targetStatus}`, "success");
      refresh();
    } catch (err) {
      notify(err.message || "Lỗi chuyển trạng thái", "danger");
    } finally {
      setShippingActionBusy(false);
    }
  };

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
        sub="Đối chiếu đơn, thu tiền và chuẩn bị bàn giao tại cửa hàng hoặc gửi vận chuyển."
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
                      {copied ? "✓ Đã chép" : <Icon name="copy" />}
                    </button>
                  </span>
                  <span className="order-ref-suffix">
                    Đuôi: #{formatOrderSuffix(selected.id)}
                  </span>
                </div>
              }
              action={
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {selected.deliveryType === "shipping" ? (
                    <Badge tone="info"><Icon name="truck" style={{ verticalAlign: "-2px", marginRight: "4px" }} /> GHN Express</Badge>
                  ) : (
                    <Badge tone="neutral"><Icon name="store" style={{ verticalAlign: "-2px", marginRight: "4px" }} /> Tại quầy</Badge>
                  )}
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
                </div>
              }
            >
              <p className="small muted">
                Đặt ngày {dateTime(selected.createdAt)}
              </p>
              <div className="section">
                <Steps
                  labels={
                    selected.deliveryType === "shipping"
                      ? ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao hàng", "Đã giao hàng"]
                      : ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Sẵn sàng nhận", "Đã nhận hàng"]
                  }
                  current={
                    selected.deliveryType === "shipping"
                      ? ({
                          pending: 0,
                          confirmed: 1,
                          preparing: 2,
                          ready_for_pickup: 2,
                          delivering: 3,
                          completed: 4,
                        }[selected.status] ?? -1)
                      : ({
                          pending: 0,
                          confirmed: 1,
                          preparing: 2,
                          ready_for_pickup: 3,
                          completed: 4,
                        }[selected.status] ?? -1)
                  }
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

            <Panel
              title="Thông tin nhận hàng"
              action={
                selected.deliveryType === "shipping" &&
                !selected.trackingCode &&
                !["completed", "canceled"].includes(selected.status) && (
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setEditAddressOpen(true)}
                  >
                    ✏️ Sửa địa chỉ
                  </Button>
                )
              }
            >
              <div className="two-col">
                <KV label="Người nhận">{selected.pickupName}</KV>
                <KV label="Điện thoại">{selected.pickupPhone}</KV>
              </div>
              {selected.deliveryType === "shipping" && (
                <div className="section">
                  <KV label="Địa chỉ giao">{selected.shippingAddress || "Chưa có địa chỉ"}</KV>
                </div>
              )}
              <p className="small muted section">
                {selected.note || "Không có ghi chú."}
              </p>
            </Panel>
            {selected.deliveryType === "shipping" && (
              <Panel
                title="Vận chuyển Giao Hàng Nhanh (GHN)"
                action={
                  selected.trackingCode ? (
                    <Badge tone="success">Đã tạo vận đơn</Badge>
                  ) : (
                    <Badge tone="warning">Chưa tạo vận đơn</Badge>
                  )
                }
              >
                <div className="two-col">
                  <KV label="Hình thức">Giao hàng tận nơi (GHN)</KV>
                  <KV label="Cước phí GHN">{money(selected.shippingFee || 0)}</KV>
                  <KV label="Mã vận đơn">
                    {selected.trackingCode ? (
                      <div>
                        <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "15px" }}>
                          {selected.trackingCode}
                        </span>
                        <div style={{ marginTop: "4px" }}>
                          <a
                            href={`https://tracking.ghn.dev/?order_code=${selected.trackingCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "#0284c7",
                              textDecoration: "underline",
                            }}
                          >
                            Tra cứu trên GHN Express ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="muted">Chưa tạo mã</span>
                    )}
                  </KV>
                  <KV label="Trạng thái GHN">
                    {trackingInfo ? (
                      <Badge tone="info">{trackingInfo.statusText || trackingInfo.status}</Badge>
                    ) : selected.trackingCode ? (
                      <Badge tone="info">Đang vận chuyển</Badge>
                    ) : (
                      <span className="muted">Chờ đẩy đơn</span>
                    )}
                  </KV>
                </div>

                {!selected.trackingCode ? (
                  <div className="section">
                    <Notice tone="info">
                      {selected.status === "preparing"
                        ? "Đơn đang đóng gói. Bấm 'Đóng gói xong & Tạo vận đơn GHN' ở panel Bước tiếp theo để tự động cấp mã vận đơn."
                        : "Vận đơn GHN sẽ được tự động tạo khi nhân viên đóng gói xong hàng."}
                    </Notice>
                  </div>
                ) : (
                  <div className="section stack">
                    <div className="row" style={{ gap: "8px", flexWrap: "wrap" }}>
                      <Button
                        tone="secondary"
                        disabled={busy || shippingActionBusy}
                        onClick={handlePrintA5}
                      >
                        In tem vận đơn (A5)
                      </Button>
                      <Button
                        tone="secondary"
                        disabled={busy || shippingActionBusy}
                        onClick={handleSyncTracking}
                      >
                        {shippingActionBusy ? "Đang đồng bộ..." : "Làm mới hành trình"}
                      </Button>
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: "8px",
                        border: "1px dashed #cbd5e1",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: "8px",
                        }}
                      >
                        ⚡ Giả lập Sandbox (Thử nghiệm chuyển trạng thái):
                      </div>
                      <div className="row" style={{ gap: "6px", flexWrap: "wrap" }}>
                        <Button
                          tone="ghost"
                          disabled={busy || shippingActionBusy}
                          onClick={() => handleSwitchStatus("delivering")}
                        >
                          Shipper đang giao
                        </Button>
                        <Button
                          tone="ghost"
                          disabled={busy || shippingActionBusy}
                          onClick={() => handleSwitchStatus("delivered")}
                        >
                          ✅ Giao thành công
                        </Button>
                        <Button
                          tone="ghost"
                          disabled={busy || shippingActionBusy}
                          onClick={() => handleSwitchStatus("cancel")}
                        >
                          ❌ Hủy giao
                        </Button>
                      </div>
                    </div>

                    {trackingInfo?.logs?.length > 0 && (
                      <div style={{ marginTop: "12px", fontSize: "13px" }}>
                        <span className="muted">Hành trình gần nhất: </span>
                        <strong>{trackingInfo.logs[0].description}</strong>
                        {trackingInfo.logs[0].time && (
                          <span className="tiny muted"> ({trackingInfo.logs[0].time})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {selected.status === "canceled" && (
              <Panel title="Lý do hủy đơn">
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.cancelReason || "Đơn cũ chưa ghi nhận lý do hủy."}</p>
              </Panel>
            )}
            {!demoMode && selected.deliveryType === "shipping" && selected.status === "completed" && count > 0 && (
              <Panel title="Serial thiết bị giao hàng">
                <Notice>Nhập serial thật trên từng thiết bị để kích hoạt bảo hành.</Notice>
                {warrantyLines.flatMap((line) => Array.from({ length: line.quantity }, () => line)).map((line, index) => (
                  <Field key={index} label={line.name + " ? " + (index + 1)}
                    value={serials[selected.id + "-" + index] || ""}
                    onChange={(e) => setSerials({ ...serials, [selected.id + "-" + index]: e.target.value })} />
                ))}
                <Button disabled={busy} onClick={() => update("shippingSerials")}>Lưu serial</Button>
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
              <p className="small muted section">Tổng thanh toán</p>
              <div className="price">{money(selected.final)}</div>
              <div className="divider" />
              <KV label="Tiền hàng">{money(selected.total)}</KV>
              <KV label={"Giảm giá " + (selected.promotion || "")}>
                {money(selected.discount)}
              </KV>
              {selected.shippingFee > 0 && (
                <KV label="Phí giao hàng (GHN)">{money(selected.shippingFee)}</KV>
              )}
              <KV label="Thanh toán">
                {selected.method === "cod"
                  ? "COD (Thu tiền khi giao)"
                  : selected.method === "vnpay"
                    ? "VNPay"
                    : selected.method === "cash"
                      ? "Tiền mặt"
                      : "Tại quầy"}
              </KV>
              <KV label="Thành tiền">{money(selected.final)}</KV>
              {showCashCollection && (
                <>
                  <div className="divider" />
                  {collection?.receipt ? (
                    <>
                      <KV label="Người xác nhận">
                        {collection.receipt.collectorName || `Tài khoản #${collection.receipt.collectorUserId}`}
                      </KV>
                      <KV label="Thời điểm thu">{dateTime(collection.receipt.collectedAt)}</KV>
                      <KV label="Thực nhận">{money(collection.receipt.receivedAmount)}</KV>
                      <KV label="Tiền thối">{money(collection.receipt.changeAmount)}</KV>
                      {collection.receipt.reference && (
                        <KV label="Mã chứng từ">{collection.receipt.reference}</KV>
                      )}
                    </>
                  ) : (
                    <p className="tiny muted section">
                      {!collection
                        ? "Đang tải thông tin thu tiền…"
                        : collection.error
                          ? "Không tải được thông tin thu tiền."
                          : "Đơn này chưa có bản ghi người xác nhận thu tiền."}
                    </p>
                  )}
                </>
              )}
              {canCollect && (
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
              {selected.deliveryType === "shipping" ? (
                <>
                  {["pending", "confirmed"].includes(selected.status) && (
                    <Button
                      className="full"
                      disabled={busy || shippingActionBusy}
                      onClick={() => update("advance")}
                    >
                      {selected.status === "pending"
                        ? "Xác nhận đơn"
                        : "Bắt đầu chuẩn bị"}
                    </Button>
                  )}
                  {selected.status === "preparing" && (
                    <Button
                      tone="primary"
                      className="full"
                      disabled={busy || shippingActionBusy}
                      onClick={handleCreateShipment}
                    >
                      {shippingActionBusy
                        ? "Đang kết nối GHN..."
                        : "Đóng gói xong & Tạo vận đơn GHN"}
                    </Button>
                  )}
                  {selected.status === "ready_for_pickup" && (
                    <>
                      {!selected.trackingCode ? (
                        <Button
                          tone="primary"
                          className="full"
                          disabled={busy || shippingActionBusy}
                          onClick={handleCreateShipment}
                        >
                          {shippingActionBusy
                            ? "Đang kết nối GHN..."
                            : "Tạo vận đơn GHN"}
                        </Button>
                      ) : (
                        <Button
                          className="full"
                          disabled={busy || shippingActionBusy}
                          onClick={() => update("advance")}
                        >
                          Shipper đã lấy hàng (Bắt đầu giao)
                        </Button>
                      )}
                    </>
                  )}
                  {selected.status === "delivering" && (
                    <Button
                      className="full"
                      disabled={busy}
                      onClick={() => update("advance")}
                    >
                      ✅ Xác nhận đã giao thành công
                    </Button>
                  )}
                  {selected.status === "completed" && (
                    <Notice tone="success">
                      Đơn hàng giao qua GHN đã hoàn tất thành công.
                    </Notice>
                  )}
                </>
              ) : (
                <>
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
                          : "Đóng gói xong (sẵn sàng giao)"}
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
                </>
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
      {confirm && canCollect && (
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
      {editAddressOpen && selected && (
        <EditShippingAddressModal
          key={selected.id}
          order={selected}
          onClose={() => setEditAddressOpen(false)}
          onSuccess={() => {
            refresh();
          }}
        />
      )}
    </>
  );
}
