import { money } from "@/utils";
import { Badge, Button, Heading, KV, Notice, Panel } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { usePromotionManagement } from "../hooks/usePromotionManagement";

export function PromotionManagement() {
  const { p, set, used, reserved, save } = usePromotionManagement();
  return (
    <>
      <Heading
        title={"Chương trình " + p.code}
        sub="Quản lý mã giảm giá và banner liên kết."
        eyebrow="QUẢN TRỊ / KHUYẾN MÃI"
      />
      <form onSubmit={save}>
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
                  onChange={(e) => set("code", e.target.value)}
                />
                <Field
                  label="Tên chương trình"
                  value={p.name}
                  required
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
                <Field
                  label={
                    "Giá trị giảm " + (p.type === "percentage" ? "(%)" : "(₫)")
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
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  Kích hoạt chương trình
                </label>
                <Field
                  label="Bắt đầu"
                  type="datetime-local"
                  value={p.start}
                  required
                  onChange={(e) => set("start", e.target.value)}
                />
                <Field
                  label="Kết thúc"
                  type="datetime-local"
                  value={p.end}
                  required
                  onChange={(e) => set("end", e.target.value)}
                />
              </div>
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
                required
                onChange={(e) => set("bannerTitle", e.target.value)}
              />
              <Field
                label="Ảnh banner"
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
                  {p.type === "percentage" ? p.value + "%" : money(p.value)} cho
                  đơn hàng
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
              <KV label="Còn lại">{Math.max(0, p.limit - used - reserved)}</KV>
              <p className="small muted section">
                Lượt đang giữ được tính vào hạn mức để tránh cấp vượt số lượng.
              </p>
            </Panel>
            <Panel title="Lưu cấu hình">
              <Button type="submit" className="full">
                Lưu thay đổi
              </Button>
              <p className="small muted section">
                Thay đổi có hiệu lực trong dữ liệu demo trên thiết bị này.
              </p>
            </Panel>
          </aside>
        </div>
      </form>
    </>
  );
}
