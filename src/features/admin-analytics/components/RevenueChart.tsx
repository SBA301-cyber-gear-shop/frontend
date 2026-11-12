import { useMemo, type FC } from "react";
import { money } from "@/utils";
import type { MonthlyRevenue } from "../types";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  expectedMonths?: number;
}

export const RevenueChart: FC<RevenueChartProps> = ({ data, expectedMonths = 12 }) => {
  // Chuẩn hóa dữ liệu: đảm bảo đủ đúng số tháng liên tiếp (mặc định 12 hoặc 6 tháng)
  // Tháng nào chưa có doanh thu sẽ hiển thị là 0
  const chartData = useMemo(() => {
    const count = expectedMonths > 0 ? expectedMonths : 12;
    const map = new Map<string, MonthlyRevenue>();
    (data || []).forEach((d) => map.set(d.month, d));

    const result: MonthlyRevenue[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${yyyy}-${mm}`;
      if (map.has(key)) {
        result.push(map.get(key)!);
      } else {
        result.push({
          month: key,
          revenue: 0,
          itemsSold: 0,
          orderCount: 0,
        });
      }
    }
    return result;
  }, [data, expectedMonths]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="analytics-card chart-card">
        <h3 className="section-card-title">Doanh thu & Hàng hóa đã bán theo tháng</h3>
        <div className="analytics-empty">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => Number(d.revenue) || 0), 1);
  const totalRevenuePeriod = chartData.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const totalItemsSoldPeriod = chartData.reduce((sum, d) => sum + (Number(d.itemsSold) || 0), 0);

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
          {chartData.map((item) => {
            const rev = Number(item.revenue) || 0;
            const heightPercent = rev > 0 ? Math.max(Math.round((rev / maxRevenue) * 100), 4) : 0;

            return (
              <div
                key={item.month}
                className="bar-column"
              >
                {/* Value pill: Tháng không có doanh thu hiển thị 0 */}
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
