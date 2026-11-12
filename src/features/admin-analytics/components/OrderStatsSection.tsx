import { useState, type FC } from "react";
import { Badge } from "@/components/ui";
import type { DailyOrderStats, MonthlyOrderStats } from "../types";

interface OrderStatsSectionProps {
  dailyOrders: DailyOrderStats[];
  monthlyOrders: MonthlyOrderStats[];
}

const formatDateLabel = (raw: string, isDaily: boolean): string => {
  if (!raw) return "";
  const parts = raw.split("-");
  if (isDaily && parts.length === 3) {
    // Chuyển YYYY-MM-DD sang DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (!isDaily && parts.length === 2) {
    // Chuyển YYYY-MM sang MM/YYYY
    return `${parts[1]}/${parts[0]}`;
  }
  return raw;
};

export const OrderStatsSection: FC<OrderStatsSectionProps> = ({
  dailyOrders,
  monthlyOrders,
}) => {
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  const activeData = viewMode === "daily" ? dailyOrders : monthlyOrders;

  const totalOrders = activeData.reduce((sum, d) => sum + d.totalOrders, 0);
  const totalCompleted = activeData.reduce((sum, d) => sum + d.completedOrders, 0);
  const totalCanceled = activeData.reduce((sum, d) => sum + d.canceledOrders, 0);
  const totalProcessing = activeData.reduce((sum, d) => sum + d.processingOrders, 0);

  return (
    <div className="analytics-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Thống kê đơn hàng & Đơn bị hủy</h3>
          <p className="section-card-subtitle">
            Theo dõi chi tiết số lượng đơn phát sinh, đơn thành công và đơn bị hủy
          </p>
        </div>
        <div className="tab-pill-group">
          <button
            type="button"
            className={`tab-pill-btn ${viewMode === "daily" ? "active" : ""}`}
            onClick={() => setViewMode("daily")}
          >
            Theo ngày gần đây
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${viewMode === "monthly" ? "active" : ""}`}
            onClick={() => setViewMode("monthly")}
          >
            Theo tháng
          </button>
        </div>
      </div>

      {/* Summary KPI Badges for current period */}
      <div className="order-stats-summary-row">
        <div className="summary-stat-box">
          <span className="summary-stat-label">Tổng đơn chu kỳ</span>
          <span className="summary-stat-number">{totalOrders}</span>
        </div>
        <div className="summary-stat-box tone-success">
          <span className="summary-stat-label">Đã hoàn thành</span>
          <span className="summary-stat-number">{totalCompleted}</span>
        </div>
        <div className="summary-stat-box tone-warning">
          <span className="summary-stat-label">Đang xử lý/giao</span>
          <span className="summary-stat-number">{totalProcessing}</span>
        </div>
        <div className="summary-stat-box tone-danger">
          <span className="summary-stat-label">Đã hủy</span>
          <span className="summary-stat-number">{totalCanceled}</span>
        </div>
      </div>

      {/* Table view with progress bar breakdown */}
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>{viewMode === "daily" ? "Ngày" : "Tháng"}</th>
              <th className="text-center">Tổng đơn</th>
              <th>Phân bổ trạng thái</th>
              <th className="text-right">Hoàn tất</th>
              <th className="text-right">Đang giao/xử lý</th>
              <th className="text-right">Đã hủy</th>
            </tr>
          </thead>
          <tbody>
            {activeData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 muted">
                  Không có dữ liệu đơn hàng trong kỳ này.
                </td>
              </tr>
            ) : (
              activeData.map((row) => {
                const timeLabel = "date" in row ? row.date : row.month;
                const total = row.totalOrders || 1;
                const completedPct = Math.round((row.completedOrders / total) * 100);
                const processingPct = Math.round((row.processingOrders / total) * 100);
                const canceledPct = Math.round((row.canceledOrders / total) * 100);

                return (
                  <tr key={timeLabel}>
                    <td className="font-semibold text-primary date-col-cell">
                      {formatDateLabel(timeLabel, viewMode === "daily")}
                    </td>
                    <td className="text-center font-bold">{row.totalOrders}</td>
                    <td>
                      <div className="mini-stacked-bar" title={`Hoàn thành: ${row.completedOrders}, Đang xử lý: ${row.processingOrders}, Hủy: ${row.canceledOrders}`}>
                        <div
                          className="bar-seg-completed"
                          style={{ width: `${completedPct}%` }}
                        />
                        <div
                          className="bar-seg-processing"
                          style={{ width: `${processingPct}%` }}
                        />
                        <div
                          className="bar-seg-canceled"
                          style={{ width: `${canceledPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="text-success font-medium">{row.completedOrders}</span>
                    </td>
                    <td className="text-right">
                      <span className="text-warning font-medium">{row.processingOrders}</span>
                    </td>
                    <td className="text-right">
                      {row.canceledOrders > 0 ? (
                        <Badge tone="danger">{row.canceledOrders} hủy</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
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
