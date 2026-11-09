import { useEffect, useRef, useState } from "react";
import { Button, Modal, Notice } from "@/components/ui";
import { money, dateTime } from "@/utils";
import { promotionsApi } from "../api/promotionsApi";
import { MyVouchers } from "./MyVouchers";
import "./CheckoutVoucherPicker.css";

export function CheckoutVoucherPicker({ applied, disabled = false, onSelect }) {
  const [resource, setResource] = useState(null);
  const [version, setVersion] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    promotionsApi.mine(abort.signal).then((items) => {
      if (!abort.signal.aborted) setResource({ items: items.filter((item) => item.status === "AVAILABLE"), error: "" });
    }).catch((error) => {
      if (!abort.signal.aborted) setResource({ items: [], error: error.message || "Không tải được voucher của bạn." });
    });
    return () => abort.abort();
  }, [version]);
  async function select(code) {
    if (pending.current || disabled || code === applied) return;
    pending.current = true; setSelecting(true); setSelectionError("");
    try {
      const success = await onSelect(code);
      if (success === false) {
        setVersion((value) => value + 1);
        setSelectionError("Không thể áp dụng voucher này cho đơn hàng. Vui lòng kiểm tra điều kiện và thử lại.");
      }
      else setShowWallet(false);
    } finally { pending.current = false; setSelecting(false); }
  }
  return <section className="checkout-voucher-picker" aria-label="Voucher có thể áp dụng">
    <div className="between wrap-row"><strong>Voucher của bạn{resource && !resource.error ? ` (${resource.items.length})` : ""}</strong><Button tone="ghost" disabled={disabled || selecting} onClick={() => setVersion((value) => value + 1)}>Cập nhật voucher</Button></div>
    {!resource ? <p className="small muted">Đang tải voucher…</p> : resource.error ? <Notice tone="danger">{resource.error}</Notice> : resource.items.length ? <div className="checkout-voucher-list">{resource.items.map((item) => <article className={`checkout-voucher-option ${applied === item.code ? "is-selected" : ""}`} key={item.id}>
      <div><strong>{item.code}</strong><span className="checkout-voucher-value">Giảm {item.type === "percentage" || item.type === "percent" ? `${item.value}%` : money(item.value)}</span><p className="small">{item.name}</p><p className="tiny muted">HSD: {dateTime(item.end)} (UTC+07)</p></div>
      <Button tone={applied === item.code ? "secondary" : "primary"} disabled={disabled || selecting || applied === item.code} aria-label={`${applied === item.code ? "Đang dùng" : "Dùng mã"} ${item.code}`} onClick={() => select(item.code)}>{applied === item.code ? "Đang dùng" : "Dùng mã"}</Button>
    </article>)}</div> : <p className="small muted">Bạn chưa có voucher có thể dùng cho tài khoản này.</p>}
    <Button tone="ghost" onClick={() => { setSelectionError(""); setShowWallet(true); }}>Xem tất cả voucher của tôi</Button>
    {showWallet && <Modal title="Voucher của tôi" className="checkout-voucher-modal" onClose={() => setShowWallet(false)}>
      {selectionError && <Notice tone="danger">{selectionError}</Notice>}
      <MyVouchers embedded onSelect={select} applied={applied} selecting={disabled || selecting} />
    </Modal>}
  </section>;
}
