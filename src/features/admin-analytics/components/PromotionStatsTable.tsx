import type { FC } from "react";
import { Badge } from "@/components/ui";
import { money } from "@/utils";
import type { PromotionAnalytics } from "../types";

interface PromotionStatsTableProps {
  promotions: PromotionAnalytics[];
}

export const PromotionStatsTable: FC<PromotionStatsTableProps> = ({ promotions }) => {
  const totalUsages = promotions.reduce((sum, p) => sum + p.usageCount, 0);
  const totalDiscount = promotions.reduce((sum, p) => sum + Number(p.totalDiscountAmount || 0), 0);

  return (
    <div className="analytics-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Hiệu quả chương trình khuyến mãi & Giảm giá</h3>
          <p className="section-card-subtitle">
            Tổng cộng: <strong>{promotions.length} chương trình</strong> · Đã áp dụng: <strong>{totalUsages} lượt</strong> · Tổng tiền đã giảm: <strong>{money(totalDiscount)}</strong>
          </p>
        </div>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Mã Voucher</th>
              <th>Tên chương trình</th>
              <th>Mức giảm</th>
              <th className="text-center">Lượt dùng / Giới hạn</th>
              <th>Tỷ lệ sử dụng</th>
              <th className="text-right">Tổng tiền đã giảm</th>
              <th className="text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 muted">
                  Chưa có chương trình khuyến mãi nào trong hệ thống.
                </td>
              </tr>
            ) : (
              promotions.map((p) => {
                const discountText =
                  p.discountType === "PERCENT" || p.discountType === "PERCENTAGE"
                    ? `${p.discountValue}%`
                    : money(p.discountValue);

                return (
                  <tr key={p.id}>
                    <td>
                      <span className="voucher-code-pill">{p.code || "VOUCHER"}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-primary">{p.name}</div>
                      <div className="small text-muted">{p.audience}</div>
                    </td>
                    <td>
                      <span className="font-medium text-warning">{discountText}</span>
                    </td>
                    <td className="text-center">
                      <strong>{p.usageCount}</strong> / {p.usageLimit > 0 ? p.usageLimit : "∞"}
                    </td>
                    <td>
                      <div className="row-center gap-2">
                        <div className="progress-bar-capsule flex-1">
                          <div
                            className="progress-fill fill-brand"
                            style={{ width: `${Math.min(p.usageRate, 100)}%` }}
                          />
                        </div>
                        <span className="small text-muted font-mono">{p.usageRate}%</span>
                      </div>
                    </td>
                    <td className="text-right font-bold text-accent">
                      {money(p.totalDiscountAmount)}
                    </td>
                    <td className="text-center">
                      <Badge tone={p.isActive ? "success" : "neutral"}>
                        {p.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
