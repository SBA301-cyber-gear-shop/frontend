import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Badge, Button, Heading, Notice } from "@/components/ui";
import { money, dateTime } from "@/utils";
import { promotionsApi } from "../api/promotionsApi";
import "./MyVouchers.css";

const labels = { AVAILABLE: "Có thể dùng", USED: "Đã dùng", EXPIRED: "Hết hạn", RESERVED: "Đang giữ cho đơn", UPCOMING: "Chưa đến ngày dùng", UNAVAILABLE: "Tạm không khả dụng", REVOKED: "Đơn đã hủy · Không dùng lại" };
const matches = (item, tab) => tab === "ALL" || (tab === "USED" ? ["USED", "REVOKED"].includes(item.status) : item.status === tab);
export function MyVouchers({ embedded = false, onSelect = () => {}, applied = "", selecting = false }) {
  const { demoMode } = useStore();
  const [resource, setResource] = useState(null);
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    promotionsApi.mine(abort.signal).then((items) => { if (!abort.signal.aborted) setResource({ items, error: "" }); })
      .catch((error) => { if (!abort.signal.aborted) setResource({ items: [], error: error.message || "Không tải được voucher của bạn." }); });
    return () => abort.abort();
  }, [version, demoMode]);
  if (demoMode) return <Notice>Đăng nhập bằng tài khoản kết nối backend để xem voucher được cấp riêng cho bạn.</Notice>;
  const items = resource?.items || [];
  const visible = items.filter((item) => matches(item, tab) && `${item.code} ${item.name}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setCopyError(""); }
    catch { setCopyError("Không sao chép được. Bạn có thể chọn và sao chép mã hiển thị trên thẻ."); }
  }
  return <div className={`my-vouchers stack ${embedded ? "is-embedded" : "is-page"}`}>
    {!embedded && <Heading title="Voucher của tôi" sub="Ưu đãi được cấp cho bạn và lịch sử voucher đã sử dụng. Mỗi mã dùng một lần cho mỗi tài khoản." />}
    {!resource ? <Notice>Đang tải voucher…</Notice> : resource.error ? <Notice tone="danger">{resource.error} <Button tone="secondary" onClick={() => setVersion((value) => value + 1)}>Tải lại voucher</Button></Notice> : <>
      <div className="voucher-wallet-filters">
      <input className="input" aria-label="Tìm voucher của tôi" placeholder="Tìm theo mã voucher hoặc tên ưu đãi…" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} />
      <select className="input" aria-label="Trạng thái voucher của tôi" value={tab} onChange={(event) => setTab(event.target.value)}>
        {[["ALL", "Tất cả trạng thái"], ["AVAILABLE", "Có thể dùng"], ["USED", "Đã dùng"], ["EXPIRED", "Hết hạn"]].map(([value, label]) => <option key={value} value={value}>{label} ({items.filter((item) => matches(item, value)).length})</option>)}
      </select>
      </div>
      {copyError && <Notice tone="danger">{copyError}</Notice>}
      <div className="voucher-wallet-list">{visible.length ? visible.map((item) => <article key={item.id} className={`voucher-wallet-card ${item.status === "AVAILABLE" ? "" : "is-unavailable"}`}>
        <div className="voucher-wallet-discount"><span aria-hidden="true">🎟</span><strong>{item.type === "percentage" || item.type === "percent" ? `${item.value}%` : money(item.value)}</strong><span>Giảm đơn hàng</span></div>
        <div className="voucher-wallet-content"><div className="between wrap-row"><strong className="voucher-wallet-code">{item.code}</strong><Badge tone={item.status === "AVAILABLE" ? "success" : item.status === "EXPIRED" ? "danger" : "neutral"}>{labels[item.status] || item.status}</Badge></div><h3>{item.name}</h3><p className="small muted">Từ {dateTime(item.start)} đến {dateTime(item.end)} (UTC+07)</p>
          {item.status === "RESERVED" && <p className="small muted">Voucher đang giữ cho đơn này; không thể dùng cho đơn khác.</p>}
          {item.status === "REVOKED" && <p className="small muted">Đơn đã hủy. Theo chính sách hiện tại, tài khoản không được dùng lại mã này.</p>}
          {item.status === "UNAVAILABLE" && <p className="small muted">Chương trình đang tắt hoặc đã hết lượt sử dụng chung.</p>}
          <div className="row wrap-row">
            {item.status === "AVAILABLE" && (embedded
              ? <Button tone="primary" disabled={selecting || applied === item.code} onClick={() => onSelect(item.code)}>{applied === item.code ? "Đang dùng" : "Dùng mã"}</Button>
              : <Button tone="secondary" onClick={() => copy(item.code)}>{copied === item.code ? "Đã sao chép" : "Sao chép mã"}</Button>)}
            {!embedded && item.orderCode && <Button tone="ghost" to={`/don-hang/${encodeURIComponent(item.orderCode)}`}>Xem đơn hàng</Button>}
          </div>
        </div>
      </article>) : <div className="voucher-wallet-empty">
        <span className="voucher-wallet-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M10 8v.01M10 12v.01M10 16v.01"/></svg></span>
        <h2>{items.length ? "Không có voucher phù hợp" : "Bạn chưa có voucher"}</h2>
        <p>{items.length ? "Thử chọn trạng thái khác hoặc thay đổi từ khóa." : "Voucher sẽ xuất hiện khi cửa hàng cấp ưu đãi cho tài khoản của bạn."}</p>
      </div>}</div>
    </>}
  </div>;
}
