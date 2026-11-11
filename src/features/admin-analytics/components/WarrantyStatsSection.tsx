import type { FC } from "react";
import { Badge } from "@/components/ui";
import type { MonthlyWarranty } from "../types";

interface WarrantyStatsSectionProps {
  data: MonthlyWarranty[];
}

export const WarrantyStatsSection: FC<WarrantyStatsSectionProps> = ({ data }) => {
  const totalAllRequests = data.reduce((sum, d) => sum + d.totalRequests, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completedRequests, 0);
  const totalProcessing = data.reduce((sum, d) => sum + d.processingRequests, 0);

  return (
    <div className="analytics-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Thống kê dịch vụ bảo hành theo tháng</h3>
          <p className="section-card-subtitle">
            Tổng tiếp nhận: <strong>{totalAllRequests} phiếu</strong> · Đang xử lý: <strong>{totalProcessing} phiếu</strong> · Đã hoàn thành: <strong>{totalCompleted} phiếu</strong>
          </p>
        </div>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th className="text-center">Số phiếu tiếp nhận</th>
              <th className="text-center">Đang kiểm tra & sửa</th>
              <th className="text-center">Đã trả khách</th>
              <th className="text-center">Đã hủy</th>
              <th>Tiến độ xử lý</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 muted">
                  Chưa có dữ liệu bảo hành trong các tháng này.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const total = item.totalRequests || 1;
                const completionRate = Math.round((item.completedRequests / total) * 100);

                return (
                  <tr key={item.month}>
                    <td className="font-semibold text-primary">{item.month}</td>
                    <td className="text-center font-bold">{item.totalRequests}</td>
                    <td className="text-center">
                      {item.processingRequests > 0 ? (
                        <Badge tone="warning">{item.processingRequests} phiếu</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="text-success font-semibold">{item.completedRequests}</span>
                    </td>
                    <td className="text-center">
                      {item.canceledRequests > 0 ? (
                        <Badge tone="danger">{item.canceledRequests}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td>
                      <div className="row-center gap-2">
                        <div className="progress-bar-capsule flex-1">
                          <div
                            className="progress-fill fill-success"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="small text-muted font-mono">{completionRate}%</span>
                      </div>
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
