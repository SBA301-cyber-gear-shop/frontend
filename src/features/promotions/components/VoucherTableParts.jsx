import { useState } from "react";
import { Button, Icon } from "@/components/ui";

export function VoucherAudience({ audience }) {
  const assigned = audience === "ASSIGNED";
  return <span className={`voucher-audience ${assigned ? "is-assigned" : "is-public"}`}>
    {assigned ? <Icon name="lock" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg>}
    {assigned ? "Khách được cấp" : "Công khai"}
  </span>;
}

export function VoucherCode({ code, audience }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setMessage(`Đã sao chép ${code}`); }
    catch { setMessage("Không sao chép được. Bạn có thể chọn mã để sao chép."); }
  }
  return <div className="voucher-identity">
    <div className="voucher-code-line"><code className="voucher-code-chip" title={code}>{code}</code><Button tone="ghost" className="voucher-copy" title="Sao chép mã" aria-label={`Sao chép mã ${code}`} onClick={copy}><Icon name="copy" /></Button></div>
    <VoucherAudience audience={audience} />
    <span className="voucher-screen-reader" role="status" aria-live="polite">{message}</span>
  </div>;
}

export function VoucherUsage({ allocated, limit }) {
  const percent = Math.min(100, Math.max(0, limit > 0 ? allocated / limit * 100 : 0));
  return <div className="voucher-usage">
    <span className="voucher-usage-value">{allocated} <span>/ {limit}</span></span>
    <div className={`voucher-usage-progress ${percent >= 100 ? "is-full" : percent >= 70 ? "is-high" : "is-low"}`} role="progressbar" aria-label="Lượt sử dụng" aria-valuemin={0} aria-valuemax={limit || 1} aria-valuenow={Math.min(allocated, limit || 1)} aria-valuetext={`${allocated} / ${limit}`}><span style={{ width: `${percent}%` }} /></div>
  </div>;
}

export function VoucherDates({ start, end, now, format }) {
  const endTime = end ? new Date(end + (/(?:Z|[+-]\d{2}:\d{2})$/i.test(end) ? "" : "+07:00")).getTime() : NaN;
  const remaining = endTime - now;
  const timeLeft = !Number.isFinite(remaining) ? "" : remaining < 0 ? "Đã hết hạn" : remaining < 86400000 ? "Còn dưới 1 ngày" : `Còn ${Math.ceil(remaining / 86400000)} ngày`;
  return <div className="voucher-date-range">
    <div><span>Từ</span>{" "}<time>{format(start)}</time></div>
    <div><span>Đến</span>{" "}<time>{format(end)}</time></div>
    {timeLeft && <small className={remaining < 0 ? "is-ended" : ""}><Icon name="clock" />{timeLeft}</small>}
  </div>;
}

export function VoucherActions({ code, demoMode, busy, onRecipients, onEdit }) {
  return <div className="voucher-row-actions">
    {!demoMode && <Button tone="ghost" title="Khách nhận" aria-label={`Cấp voucher ${code}`} disabled={busy} onClick={onRecipients}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></svg><span>Khách nhận</span></Button>}
    <Button tone="ghost" className="voucher-action-edit" title="Chỉnh sửa" aria-label={`Chỉnh sửa voucher ${code}`} disabled={busy} onClick={onEdit}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" /></svg><span>Chỉnh sửa</span></Button>
  </div>;
}

export function VoucherLoading() {
  return <section className="voucher-loading voucher-list" role="status" aria-label="Đang tải khuyến mãi…" aria-busy="true"><div className="voucher-skeleton-heading" />{[1,2,3,4].map((row) => <div className="voucher-skeleton-row" key={row}>{[1,2,3,4,5].map((cell) => <span key={cell} />)}</div>)}<span className="voucher-screen-reader">Đang tải khuyến mãi…</span></section>;
}
