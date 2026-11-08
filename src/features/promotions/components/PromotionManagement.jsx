import { useState } from "react";
import { money } from "@/utils";
import {
  Badge,
  Button,
  Heading,
  Icon,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { Field, Select } from "@/components/form";
import { usePromotionManagement } from "../hooks/usePromotionManagement";
import "./PromotionManagement.css";
import "./VoucherList.css";
import { VoucherActions, VoucherCode, VoucherDates, VoucherLoading, VoucherUsage } from "./VoucherTableParts";
import { ProductSaleManagement } from "./ProductSaleManagement";
import { PromotionUsageHistory } from "./PromotionUsageHistory";
import { VoucherRecipients } from "./VoucherRecipients";
import { PromotionListFilters } from "./PromotionListFilters";
import {
  usePromotionListFilters,
  promotionListStatus,
  listStatusLabels,
  listStatusTones,
} from "../hooks/usePromotionListFilters";

function promotionStatus(promotion, now) {
  const status = promotionListStatus(promotion, "voucher", now);
  return { label: listStatusLabels[status], tone: listStatusTones[status], key: status };
}

function displayDate(value) {
  if (!value) return "—";
  const [date, time] = value.split("T");
  return `${date.split("-").reverse().join("/")} · ${time?.slice(0, 5) || "00:00"}`;
}

export function PromotionManagement() {
  const [tab, setTab] = useState("vouchers");
  return (
    <div className="promotion-management">
      <div
        className="row wrap-row section-title"
        role="group"
        aria-label="Loại khuyến mãi"
      >
        <Button
          tone={tab === "vouchers" ? "primary" : "secondary"}
          aria-pressed={tab === "vouchers"}
          onClick={() => setTab("vouchers")}
        >
          Voucher đơn hàng
        </Button>
        <Button
          tone={tab === "products" ? "primary" : "secondary"}
          aria-pressed={tab === "products"}
          onClick={() => setTab("products")}
        >
          Sale theo mã sản phẩm
        </Button>
      </div>
      {tab === "products" ? <ProductSaleManagement /> : <VoucherManagement />}
    </div>
  );
}

function VoucherManagement() {
  const [editing, setEditing] = useState(false);
  const [usageVoucher, setUsageVoucher] = useState(null);
  const [recipientVoucher, setRecipientVoucher] = useState(null);
  const {
    p,
    set,
    used,
    reserved,
    save,
    demoMode,
    promotions = [],
    select,
    create,
    busy,
    loading,
    error,
    refresh,
  } = usePromotionManagement();
  const listFilters = usePromotionListFilters(promotions, "voucher");
  if (loading) return <VoucherLoading />;
  if (error)
    return (
      <div className="voucher-list voucher-list-error stack">
        <Notice tone="danger"><Icon name="alertCircle" />{error}</Notice>
        {refresh && <Button tone="secondary" onClick={refresh}>Thử lại</Button>}
      </div>
    );
  return (
    <div className="promotion-management">
      <Heading
        title="Quản lý voucher"
        sub="Quản lý mã giảm giá và banner liên kết."
        eyebrow="QUẢN TRỊ / KHUYẾN MÃI"
        action={
          !demoMode && (
            <Button
              disabled={busy}
              onClick={() => {
                create();
                setEditing(true);
              }}
            >
              Tạo mã mới
            </Button>
          )
        }
      />
      <PromotionListFilters kind="voucher" model={listFilters} />
      <section
        className="promotion-list voucher-list section"
        aria-labelledby="promotion-list-title"
      >
        <div className="promotion-list-header">
          <h2 id="promotion-list-title" aria-label={`Danh sách voucher (${promotions.length})`}>
            Danh sách voucher <span className="voucher-total-badge" aria-label={`${promotions.length} voucher`}>{promotions.length}</span>
          </h2>
          <div className="promotion-list-tools">
            <span>
              Hiển thị <strong>{listFilters.filtered.length}</strong> /{" "}
              {promotions.length} voucher
            </span>
          </div>
        </div>
        <div className="promotion-table-scroll voucher-table-scroll" tabIndex={0} role="region" aria-label="Danh sách voucher" >
          <table className="promotion-table promotion-voucher-table">
            <thead>
              <tr>
                <th scope="col">Mã voucher</th>
                <th scope="col">Tên chương trình</th>
                <th scope="col">Giá trị giảm</th>
                <th scope="col">Thời gian (UTC+07)</th>
                <th scope="col">Lượt sử dụng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {listFilters.filtered.map((promotion) => {
                const status = promotionStatus(promotion, listFilters.now);
                const allocated =
                  (promotion.used || 0) + (promotion.reserved || 0);
                return (
                  <tr key={promotion.id}>
                    <td className="voucher-code-cell" data-label="Mã voucher">
                      <VoucherCode code={promotion.code} audience={promotion.audience} />
                    </td>
                    <td className="promotion-program-name" data-label="Tên chương trình"><span title={promotion.name}>{promotion.name}</span></td>
                    <td className="voucher-value-cell" data-label="Giá trị giảm">
                      <strong className="promotion-value">
                        {promotion.type === "percentage"
                          ? `${promotion.value}%`
                          : `${new Intl.NumberFormat("vi-VN").format(Number(promotion.value))} ₫`}
                      </strong>
                    </td>
                    <td className="voucher-dates-cell" data-label="Thời gian (UTC+07)">
                      <VoucherDates start={promotion.start} end={promotion.end} now={listFilters.now} format={displayDate} />
                    </td>
                    <td className="voucher-usage-cell" data-label="Lượt sử dụng">
                      <VoucherUsage allocated={allocated} limit={promotion.limit} />
                      <Button tone="ghost" className="voucher-usage-details" title="Lượt dùng" aria-label={`Xem lượt sử dụng voucher ${promotion.code}`} disabled={busy} onClick={() => setUsageVoucher(promotion)}><Icon name="fileText" /><span>Lượt dùng</span></Button>
                    </td>
                    <td className="voucher-status-cell" data-label="Trạng thái">
                      <span
                        className={`promotion-status voucher-status-${status.key}`}
                      >
                        <span className="voucher-status-dot" aria-hidden="true" />{status.label}
                      </span>
                    </td>
                    <td className="promotion-actions">
                      <VoucherActions code={promotion.code} demoMode={demoMode} busy={busy} onRecipients={() => setRecipientVoucher(promotion)} onEdit={() => {
                          select(promotion.id);
                          setEditing(true);
                        }} />
                    </td>
                  </tr>
                );
              })}
              {!listFilters.filtered.length && (
                <tr>
                  <td colSpan={7} className="promotion-empty">
                    <Icon name="fileText" />
                    <strong>{promotions.length ? "Không có voucher phù hợp với tìm kiếm và bộ lọc." : "Chưa có voucher nào"}</strong>
                    <p>
                    {promotions.length
                      ? "Thử thay đổi từ khóa hoặc bộ lọc để xem các voucher khác."
                      : "Chưa có voucher. Nhấn “Tạo mã mới” để thêm chương trình khuyến mãi."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {usageVoucher && (
        <PromotionUsageHistory
          key={usageVoucher.id}
          voucher={usageVoucher}
          onClose={() => setUsageVoucher(null)}
        />
      )}
      {recipientVoucher && <VoucherRecipients key={recipientVoucher.id} voucher={recipientVoucher} onClose={() => setRecipientVoucher(null)} />}
      {editing && (
        <Modal
          title={p.id ? `Chỉnh sửa voucher ${p.code}` : "Tạo voucher mới"}
          className="promotion-editor"
          onClose={() => {
            if (!busy) setEditing(false);
          }}
        >
          <form
            onSubmit={async (event) => {
              if (await save(event)) setEditing(false);
            }}
          >
            <div className="split">
              <div className="stack">
                <Panel
                  title="Thông tin khuyến mãi"
                  action={
                    <Badge tone={p.active ? "success" : "neutral"}>
                      {p.active ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  }
                >
                  <div className="two-col">
                    <Field
                      label="Mã giảm giá"
                      value={p.code}
                      required
                      maxLength={50}
                      onChange={(e) => set("code", e.target.value)}
                    />
                    <Field
                      label="Tên chương trình"
                      value={p.name}
                      required
                      maxLength={150}
                      onChange={(e) => set("name", e.target.value)}
                    />
                    <Select
                      label="Loại giảm giá"
                      value={p.type}
                      onChange={(e) => set("type", e.target.value)}
                      options={[
                        { value: "fixed_amount", label: "Số tiền cố định" },
                        { value: "percentage", label: "Phần trăm" },
                      ]}
                    />
                    {!demoMode && <Select label="Đối tượng nhận voucher" value={p.audience || "PUBLIC"} onChange={(event) => set("audience", event.target.value)} options={[{ value: "ASSIGNED", label: "Khách được cấp (riêng từng tài khoản)" }, { value: "PUBLIC", label: "Công khai (mọi khách có mã)" }]} />}
                    <Field
                      label={
                        "Giá trị giảm " +
                        (p.type === "percentage" ? "(%)" : "(₫)")
                      }
                      type="number"
                      min="1"
                      value={p.value}
                      required
                      onChange={(e) => set("value", e.target.value)}
                    />
                    <Field
                      label="Tổng lượt sử dụng"
                      type="number"
                      min="1"
                      value={p.limit}
                      required
                      onChange={(e) => set("limit", e.target.value)}
                    />
                    <Field
                      label={demoMode ? "Bắt đầu" : "Bắt đầu (UTC+07)"}
                      type="datetime-local"
                      value={p.start}
                      required
                      onChange={(e) => set("start", e.target.value)}
                    />
                    <Field
                      label={demoMode ? "Kết thúc" : "Kết thúc (UTC+07)"}
                      type="datetime-local"
                      value={p.end}
                      required
                      onChange={(e) => set("end", e.target.value)}
                    />
                  </div>
                  <label className="filter-option section">
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) => set("active", e.target.checked)}
                    />
                    Kích hoạt chương trình
                  </label>
                  <div className="section">
                    <Notice>
                      Mỗi đơn áp dụng một mã. Mỗi khách sử dụng chương trình một
                      lần.
                    </Notice>
                  </div>
                </Panel>
                <Panel title="Banner liên kết">
                  <Field
                    label="Tiêu đề"
                    value={p.bannerTitle}
                    required={p.bannerActive}
                    maxLength={150}
                    onChange={(e) => set("bannerTitle", e.target.value)}
                  />
                  <Field
                    label="Ảnh banner"
                    required={p.bannerActive}
                    maxLength={255}
                    value={p.bannerImage}
                    onChange={(e) => set("bannerImage", e.target.value)}
                  />
                  <div className="two-col section">
                    <Field
                      label="Đường dẫn khi nhấn"
                      value={p.bannerLink}
                      required
                      onChange={(e) => set("bannerLink", e.target.value)}
                    />
                    <Field
                      label="Thứ tự hiển thị"
                      type="number"
                      min="0"
                      value={p.bannerOrder}
                      onChange={(e) => set("bannerOrder", e.target.value)}
                    />
                  </div>
                  <label className="filter-option section">
                    <input
                      type="checkbox"
                      checked={p.bannerActive}
                      onChange={(e) => set("bannerActive", e.target.checked)}
                    />
                    Hiển thị banner
                  </label>
                  <div className="coupon-preview">
                    <span>TECHZONE · THÁNG NÂNG CẤP</span>
                    <h2>{p.code}</h2>
                    <p>
                      Giảm{" "}
                      {p.type === "percentage" ? p.value + "%" : money(p.value)}{" "}
                      cho đơn hàng
                    </p>
                  </div>
                </Panel>
              </div>
              <aside className="stack">
                <Panel title="Lượt sử dụng">
                  <div className="price">
                    {used + reserved} / {p.limit} lượt
                  </div>
                  <progress
                    className="usage-meter"
                    max={p.limit || 1}
                    value={used + reserved}
                  />
                  <KV label="Đã dùng">{used}</KV>
                  <KV label="Đang giữ">{reserved}</KV>
                  <KV label="Còn lại">
                    {Math.max(0, p.limit - used - reserved)}
                  </KV>
                  <p className="small muted section">
                    Lượt đang giữ được tính vào hạn mức để tránh cấp vượt số
                    lượng.
                  </p>
                </Panel>
                <Panel title="Lưu cấu hình">
                  <Button type="submit" className="full" disabled={busy}>
                    {busy ? "Đang lưu…" : "Lưu thay đổi"}
                  </Button>
                  <Button
                    tone="secondary"
                    className="full section"
                    disabled={busy}
                    onClick={() => setEditing(false)}
                  >
                    Hủy
                  </Button>
                  <p className="small muted section">
                    {demoMode
                      ? "Thay đổi có hiệu lực trong dữ liệu demo trên thiết bị này."
                      : "Đơn đã tạo giữ nguyên số tiền giảm đã chốt. Hạn mức bao gồm lượt đang giữ."}
                  </p>
                </Panel>
              </aside>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
