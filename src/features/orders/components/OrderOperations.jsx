import { dateTime, money } from "@/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants";
import { OrderLines } from "@/features/products";
import {
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { Field } from "@/components/form";
import { useOrderOperations } from "../hooks/useOrderOperations";

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
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tra cứu đơn hàng"
          placeholder="Mã đơn, số điện thoại hoặc tên khách"
          value={search}
          disabled={busy}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Lọc trạng thái đơn"
          disabled={busy}
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
            disabled={busy}
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
              <Panel
                title={"Serial từng thiết bị · " + count + " thiết bị"}
                action={
                  <Button
                    tone="secondary"
                    onClick={handleAutoFillHandover}
                    disabled={busy}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ⚡ Điền nhanh Serial & SĐT
                  </Button>
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
        <Modal
          title="Xác nhận đã nhận đủ tiền?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Đơn {selected.id} · {money(selected.final)}. Thao tác cập nhật khoản
            thu {demoMode ? "trong dữ liệu demo" : "thực tế tại cửa hàng"}.
          </p>
          {!demoMode && (
            <div className="stack section">
              <Field
                label="Số tiền thực tế đã nhận (VND)"
                type="number"
                min="0"
                value={receivedAmount}
                onChange={(event) => setReceivedAmount(event.target.value)}
              />
              <Field
                label="Mã chứng từ thu tiền (nếu có)"
                maxLength={255}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>
          )}
          <div className="row section">
            <Button tone="secondary" onClick={() => setConfirm(false)}>
              Quay lại
            </Button>
            <Button disabled={busy} onClick={() => update("pay")}>
              Đã thu đủ tiền
            </Button>
          </div>
        </Modal>
      )}
      {cancelConfirm && selected && (
        <Modal title="Hủy đơn hàng?" onClose={() => setCancelConfirm(false)}>
          <p>Hủy đơn {selected.id} và hoàn lại số lượng đã giữ vào kho.</p>
          <div className="row section">
            <Button tone="secondary" onClick={() => setCancelConfirm(false)}>
              Giữ đơn
            </Button>
            <Button disabled={busy} onClick={() => update("cancel")}>
              Xác nhận hủy
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
