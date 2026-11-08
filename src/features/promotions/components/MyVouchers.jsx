import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Badge, Button, Empty, Heading, Notice } from "@/components/ui";
import { money, dateTime } from "@/utils";
import { promotionsApi } from "../api/promotionsApi";
import "./MyVouchers.css";

const labels = { AVAILABLE: "Có thể dùng", USED: "Đã dùng", EXPIRED: "Hết hạn", RESERVED: "Đang giữ cho đơn", UPCOMING: "Chưa đến ngày dùng", UNAVAILABLE: "Tạm không khả dụng", REVOKED: "Đơn đã hủy · Không dùng lại" };
const matches = (item, tab) => tab === "ALL" || (tab === "USED" ? ["USED", "REVOKED"].includes(item.status) : item.status === tab);
export function MyVouchers() {
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
  return <div className="my-vouchers stack">
    <Heading title="Voucher của tôi" sub="Ưu đãi được cấp cho bạn và lịch sử voucher đã sử dụng. Mỗi mã dùng một lần cho mỗi tài khoản." />
    {!resource ? <Notice>Đang tải voucher…</Notice> : resource.error ? <Notice tone="danger">{resource.error} <Button tone="secondary" onClick={() => setVersion((value) => value + 1)}>Tải lại voucher</Button></Notice> : <>
      <div className="voucher-wallet-tabs" role="group" aria-label="Trạng thái voucher của tôi">{[["ALL", "Tất cả"], ["AVAILABLE", "Có thể dùng"], ["USED", "Đã dùng"], ["EXPIRED", "Hết hạn"]].map(([value, label]) => <Button key={value} tone={tab === value ? "primary" : "secondary"} aria-pressed={tab === value} onClick={() => setTab(value)}>{label} ({items.filter((item) => matches(item, value)).length})</Button>)}</div>
      <input className="input" aria-label="Tìm voucher của tôi" placeholder="Tìm theo mã voucher hoặc tên ưu đãi…" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} />
      {copyError && <Notice tone="danger">{copyError}</Notice>}
      <div className="voucher-wallet-list">{visible.length ? visible.map((item) => <article key={item.id} className={`voucher-wallet-card ${item.status === "AVAILABLE" ? "" : "is-unavailable"}`}>
        <div className="voucher-wallet-discount"><span aria-hidden="true">🎟</span><strong>{item.type === "percentage" || item.type === "percent" ? `${item.value}%` : money(item.value)}</strong><span>Giảm đơn hàng</span></div>
        <div className="voucher-wallet-content"><div className="between wrap-row"><strong className="voucher-wallet-code">{item.code}</strong><Badge tone={item.status === "AVAILABLE" ? "success" : item.status === "EXPIRED" ? "danger" : "neutral"}>{labels[item.status] || item.status}</Badge></div><h3>{item.name}</h3><p className="small muted">Từ {dateTime(item.start)} đến {dateTime(item.end)} (UTC+07)</p>
          {item.status === "RESERVED" && <p className="small muted">Voucher đang giữ cho đơn này; không thể dùng cho đơn khác.</p>}
          {item.status === "REVOKED" && <p className="small muted">Đơn đã hủy. Theo chính sách hiện tại, tài khoản không được dùng lại mã này.</p>}
          {item.status === "UNAVAILABLE" && <p className="small muted">Chương trình đang tắt hoặc đã hết lượt sử dụng chung.</p>}
          <div className="row wrap-row">{item.status === "AVAILABLE" && <Button tone="secondary" onClick={() => copy(item.code)}>{copied === item.code ? "Đã sao chép" : "Sao chép mã"}</Button>}{item.orderCode && <Button tone="ghost" to={`/don-hang/${encodeURIComponent(item.orderCode)}`}>Xem đơn hàng</Button>}</div>
        </div>
      </article>) : <Empty title={items.length ? "Không có voucher phù hợp" : "Bạn chưa có voucher"} description={items.length ? "Thử chọn trạng thái khác hoặc thay đổi từ khóa." : "Voucher sẽ xuất hiện khi cửa hàng cấp ưu đãi cho tài khoản của bạn."} />}</div>
    </>}
  </div>;
}
