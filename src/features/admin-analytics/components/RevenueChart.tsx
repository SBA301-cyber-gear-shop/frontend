import { useState, type FC } from "react";
import { money } from "@/utils";
import type { MonthlyRevenue } from "../types";

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export const RevenueChart: FC<RevenueChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="analytics-card chart-card">
        <h3 className="section-card-title">Doanh thu & Số lượng hàng bán theo tháng</h3>
        <div className="analytics-empty">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue) || 0), 1);
  const totalRevenuePeriod = data.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const totalItemsSoldPeriod = data.reduce((sum, d) => sum + (Number(d.itemsSold) || 0), 0);

  return (
    <div className="analytics-card chart-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Doanh thu & Hàng hóa đã bán theo tháng</h3>
          <p className="section-card-subtitle">
            Tổng chu kỳ: <strong>{money(totalRevenuePeriod)}</strong> · Đã bán: <strong>{totalItemsSoldPeriod.toLocaleString("vi-VN")} món</strong>
          </p>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot color-revenue" /> Doanh thu (VNĐ)</span>
          <span className="legend-item"><span className="legend-dot color-items" /> Số lượng bán</span>
        </div>
      </div>

      <div className="chart-container">
        <div className="bars-wrapper">
          {data.map((item, idx) => {
            const rev = Number(item.revenue) || 0;
            const heightPercent = Math.max(Math.round((rev / maxRevenue) * 100), 4);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.month}
                className={`bar-column ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="bar-tooltip">
                    <div className="tooltip-title">Tháng {item.month}</div>
                    <div className="tooltip-row">
                      <span>Doanh thu:</span>
                      <strong>{money(rev)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Số lượng bán:</span>
                      <strong>{item.itemsSold} món</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Số đơn hàng:</span>
                      <strong>{item.orderCount} đơn</strong>
                    </div>
                  </div>
                )}

                {/* Value pill */}
                <span className="bar-val-label">
                  {rev >= 1_000_000 ? `${(rev / 1_000_000).toFixed(1)}Tr` : rev > 0 ? `${Math.round(rev / 1000)}k` : "0"}
                </span>

                {/* Track & Bar */}
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <span className="bar-badge-items">{item.itemsSold > 0 ? `${item.itemsSold}` : ""}</span>
                  </div>
                </div>

                {/* X-axis label */}
                <span className="bar-label">{item.month.slice(5)}/{item.month.slice(2, 4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
