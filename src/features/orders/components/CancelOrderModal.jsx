import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import { Field } from "@/components/form";

export function CancelOrderModal({ orderId, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Hủy đơn hàng?"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>
        Hủy đơn {orderId} và hoàn lại số lượng đã giữ vào kho. Lý do hủy sẽ được
        lưu trong chi tiết đơn hàng.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy && reason.trim()) onConfirm(reason.trim());
        }}
      >
        <Field label="Lý do hủy đơn" hint={`${reason.length}/500 ký tự`}>
          {(id) => (
            <textarea
              id={id}
              className="input"
              rows={4}
              required
              maxLength={500}
              disabled={busy}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Khách thay đổi nhu cầu, đặt nhầm sản phẩm…"
            />
          )}
        </Field>
        <p className="small muted">
          Voucher đã gắn đơn không được dùng lại theo chính sách mỗi khách dùng
          một lần.
        </p>
        <div className="row section">
          <Button tone="secondary" disabled={busy} onClick={onClose}>
            Giữ đơn
          </Button>
          <Button type="submit" disabled={busy || !reason.trim()}>
            {busy ? "Đang hủy…" : "Xác nhận hủy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
