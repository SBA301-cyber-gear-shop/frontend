import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Button, Empty, Heading, Notice } from "@/components/ui";
import { promotionsApi } from "../api/promotionsApi";
import { PromotionListFilters } from "./PromotionListFilters";
import { usePromotionListFilters, promotionListStatus, listStatusLabels } from "../hooks/usePromotionListFilters";
import { VoucherCode, VoucherDates, VoucherUsage } from "./VoucherTableParts";
import "./PromotionManagement.css";
import "./VoucherList.css";
import "./StaffVoucherLookup.css";

function displayDate(value) {
  if (!value) return "—";
  const [date, time] = value.split("T");
  return `${date.split("-").reverse().join("/")} · ${time?.slice(0, 5) || "00:00"}`;
}

export function StaffVoucherLookup() {
  const { demoMode } = useStore();
  const [resource, setResource] = useState(null);
  const [version, setVersion] = useState(0);
  const filters = usePromotionListFilters(resource?.items || [], "voucher");
  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    promotionsApi.staffList(abort.signal).then((items) => {
      if (!abort.signal.aborted) setResource({ items, error: "" });
    }).catch((error) => {
      if (!abort.signal.aborted) setResource({ items: [], error: error.message || "Không tải được danh sách voucher." });
    });
    return () => abort.abort();
  }, [version, demoMode]);
  return <div className="promotion-management staff-voucher-lookup stack">
    <Heading title="Tra cứu voucher" eyebrow="NHÂN VIÊN / KHUYẾN MÃI" sub="Xem thông tin và sao chép mã để hỗ trợ khách hàng." action={!demoMode && <Button tone="secondary" onClick={() => setVersion((value) => value + 1)}>Cập nhật danh sách</Button>} />
    <Notice>Nhân viên chỉ được xem và sao chép mã. Voucher cấp riêng chỉ sử dụng được bởi tài khoản đã được Admin cấp, dù người khác biết mã.</Notice>
    {demoMode ? <Notice>Tra cứu voucher sử dụng dữ liệu backend. Vui lòng đăng nhập tài khoản nhân viên kết nối API.</Notice> : !resource ? <Notice>Đang tải voucher…</Notice> : resource.error ? <Notice tone="danger">{resource.error}<Button tone="secondary" onClick={() => setVersion((value) => value + 1)}>Thử lại</Button></Notice> : <>
      <PromotionListFilters kind="voucher" model={filters} />
      <section className="voucher-list" aria-label="Danh sách voucher tra cứu">
        <div className="promotion-list-header"><h2>Danh sách voucher <span className="voucher-total-badge">{resource.items.length}</span></h2><span className="small muted">Hiển thị {filters.filtered.length} / {resource.items.length} voucher</span></div>
        {filters.filtered.length ? <div className="staff-voucher-grid">{filters.filtered.map((voucher) => {
          const status = promotionListStatus(voucher, "voucher", filters.now);
          return <article className="staff-voucher-card" key={voucher.id} aria-label={`Voucher ${voucher.code}`}>
            <div className="staff-voucher-card-top"><VoucherCode code={voucher.code} audience={voucher.audience} /><span className={`promotion-status voucher-status-${status}`}><span className="voucher-status-dot" aria-hidden="true" />{listStatusLabels[status]}</span></div>
            <h3 title={voucher.name}>{voucher.name}</h3>
            <div className="staff-voucher-amount"><span>Giá trị giảm</span><strong>{voucher.type === "percentage" || voucher.type === "percent" ? `${voucher.value}%` : `${new Intl.NumberFormat("vi-VN").format(Number(voucher.value))} ₫`}</strong></div>
            <VoucherDates start={voucher.start} end={voucher.end} now={filters.now} format={displayDate} />
            <div className="staff-voucher-quota"><span>Lượt sử dụng</span><VoucherUsage allocated={(voucher.used || 0) + (voucher.reserved || 0)} limit={voucher.limit} /></div>
          </article>;
        })}</div> : <Empty title="Không có voucher phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc để tra cứu voucher." />}
      </section>
    </>}
  </div>;
}
