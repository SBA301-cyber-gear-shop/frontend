import type { FC } from "react";
import { Badge } from "@/components/ui";
import type { MonthlyUserGrowth } from "../types";

interface UserGrowthSectionProps {
  data: MonthlyUserGrowth[];
}

export const UserGrowthSection: FC<UserGrowthSectionProps> = ({ data }) => {
  const totalNewUsers = data.reduce((sum, d) => sum + d.newUsers, 0);
  const totalNewCustomers = data.reduce((sum, d) => sum + d.newCustomers, 0);

  return (
    <div className="analytics-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Tăng trưởng người dùng mới theo tháng</h3>
          <p className="section-card-subtitle">
            Tổng tài khoản mới chu kỳ: <strong>{totalNewUsers} người dùng</strong> · Khách hàng mới: <strong>{totalNewCustomers} khách</strong>
          </p>
        </div>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th className="text-center">Tài khoản mới</th>
              <th className="text-center">Khách hàng (Customer)</th>
              <th className="text-center">Nhân viên / Khác</th>
              <th>Tỷ trọng khách hàng</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 muted">
                  Chưa có dữ liệu người dùng đăng ký trong các tháng này.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const total = item.newUsers || 1;
                const customerPct = Math.round((item.newCustomers / total) * 100);

                return (
                  <tr key={item.month}>
                    <td className="font-semibold text-primary">{item.month}</td>
                    <td className="text-center font-bold text-accent">+{item.newUsers}</td>
                    <td className="text-center">
                      <Badge tone="info">+{item.newCustomers}</Badge>
                    </td>
                    <td className="text-center text-muted">
                      {item.newStaff > 0 ? `+${item.newStaff}` : "0"}
                    </td>
                    <td>
                      <div className="row-center gap-2">
                        <div className="progress-bar-capsule flex-1">
                          <div
                            className="progress-fill fill-info"
                            style={{ width: `${customerPct}%` }}
                          />
                        </div>
                        <span className="small text-muted font-mono">{customerPct}%</span>
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
