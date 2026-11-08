import { useEffect, useRef, useState } from "react";
import { Badge, Button, Modal, Notice } from "@/components/ui";
import { promotionsApi } from "../api/promotionsApi";
import "./MyVouchers.css";

export function VoucherRecipients({ voucher, onClose }) {
  const [search, setSearch] = useState("");
  const [assignedOnly, setAssignedOnly] = useState(true);
  const [resource, setResource] = useState(null);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const key = JSON.stringify([voucher.id, search, assignedOnly, version]);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      promotionsApi.recipients(voucher.id, search.trim(), assignedOnly, abort.signal).then((items) => { if (!abort.signal.aborted) setResource({ key, items, error: "" }); })
        .catch((failure) => { if (!abort.signal.aborted) setResource({ key, items: [], error: failure.message || "Không tải được danh sách khách." }); });
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [voucher.id, search, assignedOnly, version, key]);
  const result = resource?.key === key ? resource : null;
  async function mutate(action) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try { await action(); setSelected([]); setVersion((value) => value + 1); setMessage("Đã cập nhật danh sách khách nhận voucher."); }
    catch (failure) { setError(failure.message || "Không cập nhật được khách nhận voucher."); }
    finally { pending.current = false; setBusy(false); }
  }
  const close = (event) => { if (pending.current) { event?.preventDefault(); return; } onClose(); };
  return <Modal title={`Khách nhận voucher ${voucher.code}`} className="promotion-editor" onClose={close}>
    <div className="stack">
      <Notice>{voucher.audience === "ASSIGNED" ? "Chỉ tài khoản được cấp voucher mới thấy ưu đãi trong ví và được dùng mã. Biết mã cũng không dùng được nếu chưa được cấp." : "Voucher công khai: mọi khách có mã đều có thể dùng. Cấp cho tài khoản sẽ đưa mã vào ví của người đó; chọn Khách được cấp trong form voucher nếu muốn giới hạn người dùng."}</Notice>
      <p className="small muted">Cấp voucher không trừ lượt sử dụng. Hạn mức vẫn dùng chung cho chương trình. Mỗi lần hiển thị tối đa 50 khách; tìm theo ID, tên hoặc email để thu hẹp kết quả.</p>
      <div className="row wrap-row"><Button tone={assignedOnly ? "primary" : "secondary"} aria-pressed={assignedOnly} onClick={() => setAssignedOnly(true)}>Đã cấp</Button><Button tone={!assignedOnly ? "primary" : "secondary"} aria-pressed={!assignedOnly} onClick={() => setAssignedOnly(false)}>Chọn khách nhận</Button></div>
      <input className="input" aria-label="Tìm khách nhận voucher" placeholder="Tìm theo ID, tên hoặc email khách hàng…" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} />
      {error && <Notice tone="danger">{error}</Notice>}{message && <Notice>{message}</Notice>}
      {!result ? <Notice>Đang tải khách hàng…</Notice> : result.error ? <Notice tone="danger">{result.error}<Button tone="ghost" onClick={() => setVersion((value) => value + 1)}>Tải lại khách hàng</Button></Notice> : result.items.length ? <div>{result.items.map((customer) => <div className="voucher-recipient-row" key={customer.id}>
        {!customer.assigned && <input type="checkbox" aria-label={`Cấp voucher cho ${customer.email}`} disabled={busy || selected.length >= 100 && !selected.includes(customer.id)} checked={selected.includes(customer.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, customer.id] : current.filter((id) => id !== customer.id))} />}
        <div><strong>#{customer.id} · {customer.name}</strong><p className="small muted">{customer.email}</p></div>
        {customer.assigned && <><Badge tone="success">Đã cấp</Badge><Button tone="ghost" disabled={busy || customer.used} onClick={() => mutate(() => promotionsApi.revoke(voucher.id, customer.id))}>{customer.used ? "Đã gắn đơn" : "Thu hồi"}</Button></>}
      </div>)}</div> : <Notice>{assignedOnly ? "Chưa có khách nhận voucher phù hợp." : "Không tìm thấy khách hàng phù hợp."}</Notice>}
      <div className="row wrap-row"><Button tone="secondary" disabled={busy} onClick={close}>Đóng</Button>{!assignedOnly && <Button disabled={busy || !selected.length} onClick={() => mutate(() => promotionsApi.grant(voucher.id, selected))}>{busy ? "Đang cập nhật…" : `Cấp voucher (${selected.length})`}</Button>}</div>
    </div>
  </Modal>;
}
