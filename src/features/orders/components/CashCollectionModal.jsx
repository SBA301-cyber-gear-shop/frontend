import { useState } from "react";
import { money } from "@/utils";
import { Button, KV, Modal, Notice } from "@/components/ui";
import { Field } from "@/components/form";

export function CashCollectionModal({
  order,
  demoMode,
  busy,
  receivedAmount,
  setReceivedAmount,
  reference,
  setReference,
  onClose,
  onConfirm,
}) {
  const [changeReturned, setChangeReturned] = useState(false);
  const entered = String(receivedAmount).trim() !== "";
  const received = Number(receivedAmount);
  const valid = entered && Number.isSafeInteger(received) && received >= 0;
  const enough = valid && received >= order.final;
  const change = enough ? received - order.final : 0;
  const suggestions = [
    ...new Set([
      order.final,
      ...[50000, 100000, 500000].map(
        (step) => Math.ceil(order.final / step) * step,
      ),
    ]),
  ];

  function changeAmount(value) {
    setReceivedAmount(value);
    setChangeReturned(false);
  }

  return (
    <Modal
      title="Xác nhận đã nhận đủ tiền?"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>
        Đơn {order.id}. Chỉ xác nhận sau khi đã đối chiếu tiền thực tế
        {demoMode ? " trong dữ liệu demo" : " tại cửa hàng"}.
      </p>
      {!demoMode && (
        <div className="stack section">
          <KV label="Số tiền cần thanh toán" total>
            {money(order.final)}
          </KV>
          <Field
            label="Số tiền thực tế đã nhận (VND)"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            disabled={busy}
            value={receivedAmount}
            onChange={(event) => changeAmount(event.target.value)}
            hint="Nhập số tiền khách đưa, chưa trừ tiền thối."
            error={
              entered && !valid
                ? "Nhập số tiền VND nguyên, không âm và trong phạm vi hợp lệ."
                : undefined
            }
          />
          <div
            className="row wrap-row gap8"
            role="group"
            aria-label="Chọn nhanh tiền khách đưa"
          >
            {suggestions.map((amount) => (
              <Button
                key={amount}
                tone="secondary"
                disabled={busy}
                onClick={() => changeAmount(String(amount))}
              >
                {amount === order.final ? "Vừa đủ" : money(amount)}
              </Button>
            ))}
          </div>
          <div aria-live="polite" aria-atomic="true">
            {!entered ? (
              <Notice>Nhập tiền khách đưa để tính số tiền cần thối lại.</Notice>
            ) : valid && !enough ? (
              <Notice tone="danger">
                Chưa nhận đủ tiền. Còn thiếu {money(order.final - received)}.
              </Notice>
            ) : enough ? (
              <Notice tone="success">
                <KV label="Tiền khách đưa">{money(received)}</KV>
                <KV label="Tiền thối lại khách" total>
                  {money(change)}
                </KV>
                {change === 0 && (
                  <p className="small">
                    Khách đưa vừa đủ, không cần thối tiền.
                  </p>
                )}
              </Notice>
            ) : null}
          </div>
          {change > 0 && (
            <label className="filter-option">
              <input
                type="checkbox"
                disabled={busy}
                checked={changeReturned}
                onChange={(event) => setChangeReturned(event.target.checked)}
              />
              Đã trả lại {money(change)} tiền thối cho khách.
            </label>
          )}
          <Field
            label="Mã chứng từ thu tiền (nếu có)"
            maxLength={255}
            disabled={busy}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </div>
      )}
      {demoMode && (
        <KV label="Số tiền cần thanh toán" total>
          {money(order.final)}
        </KV>
      )}
      <div className="row section">
        <Button tone="secondary" disabled={busy} onClick={onClose}>
          Quay lại
        </Button>
        <Button
          disabled={
            busy || (!demoMode && (!enough || (change > 0 && !changeReturned)))
          }
          onClick={onConfirm}
        >
          {busy ? "Đang xác nhận…" : "Đã thu đủ tiền"}
        </Button>
      </div>
    </Modal>
  );
}
