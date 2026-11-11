import type { FC } from "react";
import { money } from "@/utils";
import type { TopSellingProduct } from "../types";

interface TopProductsTableProps {
  products: TopSellingProduct[];
}

export const TopProductsTable: FC<TopProductsTableProps> = ({ products }) => {
  return (
    <div className="analytics-card">
      <div className="chart-header">
        <div>
          <h3 className="section-card-title">Top linh kiện & Sản phẩm bán chạy nhất</h3>
          <p className="section-card-subtitle">
            Xếp hạng theo số lượng đã bán từ tất cả đơn hàng thành công
          </p>
        </div>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: 60 }}>Hạng</th>
              <th>Tên sản phẩm / Linh kiện</th>
              <th className="text-center">Số lượng bán</th>
              <th className="text-right">Doanh thu tích lũy</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 muted">
                  Chưa có sản phẩm nào được bán ra.
                </td>
              </tr>
            ) : (
              products.map((item, index) => {
                const rank = index + 1;
                const rankTone =
                  rank === 1
                    ? "rank-1"
                    : rank === 2
                    ? "rank-2"
                    : rank === 3
                    ? "rank-3"
                    : "rank-normal";

                return (
                  <tr key={item.productName}>
                    <td className="text-center">
                      <span className={`rank-badge ${rankTone}`}>#{rank}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-primary">{item.productName}</span>
                    </td>
                    <td className="text-center font-bold text-accent">
                      {item.quantitySold} <span className="small text-muted font-normal">món</span>
                    </td>
                    <td className="text-right font-bold text-success">
                      {money(item.totalRevenue)}
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
