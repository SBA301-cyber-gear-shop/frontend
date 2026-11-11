import type { FC } from "react";
import { Icon, Badge } from "@/components/ui";
import { money } from "@/utils";
import type { KpiSummary } from "../types";

interface AnalyticsKpiCardsProps {
  kpis: KpiSummary;
}

export const AnalyticsKpiCards: FC<AnalyticsKpiCardsProps> = ({ kpis }) => {
  return (
    <div className="analytics-kpi-grid">
      {/* 1. Tổng doanh thu */}
      <div className="analytics-kpi-card tone-revenue">
        <div className="kpi-header">
          <span className="kpi-title">Tổng doanh thu</span>
          <span className="kpi-icon-wrap icon-revenue">
            <Icon name="cash" />
          </span>
        </div>
        <div className="kpi-value">{money(kpis.totalRevenue)}</div>
        <div className="kpi-sub">
          <Badge tone="success">Đơn thành công & đang giao</Badge>
        </div>
      </div>

      {/* 2. Tổng đơn hàng & đơn hủy */}
      <div className="analytics-kpi-card tone-orders">
        <div className="kpi-header">
          <span className="kpi-title">Tổng đơn hàng</span>
          <span className="kpi-icon-wrap icon-orders">
            <Icon name="bag" />
          </span>
        </div>
        <div className="kpi-value">{kpis.totalOrders.toLocaleString("vi-VN")} <span className="kpi-unit">đơn</span></div>
        <div className="kpi-sub row-center">
          <Badge tone={kpis.totalCanceledOrders > 0 ? "danger" : "neutral"}>
            Hủy: {kpis.totalCanceledOrders} ({kpis.cancelRate}%)
          </Badge>
          <span className="kpi-muted-text">
            Thành công: {kpis.totalOrders - kpis.totalCanceledOrders}
          </span>
        </div>
      </div>

      {/* 3. Sản phẩm đã bán */}
      <div className="analytics-kpi-card tone-items">
        <div className="kpi-header">
          <span className="kpi-title">Số lượng hàng đã bán</span>
          <span className="kpi-icon-wrap icon-items">
            <Icon name="package" />
          </span>
        </div>
        <div className="kpi-value">{kpis.totalItemsSold.toLocaleString("vi-VN")} <span className="kpi-unit">sản phẩm</span></div>
        <div className="kpi-sub">
          <span className="kpi-muted-text">Từ tất cả các đơn hàng hợp lệ</span>
        </div>
      </div>

      {/* 4. Phiếu bảo hành */}
      <div className="analytics-kpi-card tone-warranty">
        <div className="kpi-header">
          <span className="kpi-title">Tiếp nhận bảo hành</span>
          <span className="kpi-icon-wrap icon-warranty">
            <Icon name="shield" />
          </span>
        </div>
        <div className="kpi-value">{kpis.totalWarrantyRequests.toLocaleString("vi-VN")} <span className="kpi-unit">phiếu</span></div>
        <div className="kpi-sub row-center">
          <Badge tone={kpis.activeWarrantyRequests > 0 ? "warning" : "success"}>
            Đang xử lý: {kpis.activeWarrantyRequests}
          </Badge>
          <span className="kpi-muted-text">
            Đã hoàn thành: {kpis.totalWarrantyRequests - kpis.activeWarrantyRequests}
          </span>
        </div>
      </div>

      {/* 5. Khách hàng & Người dùng */}
      <div className="analytics-kpi-card tone-users">
        <div className="kpi-header">
          <span className="kpi-title">Tổng tài khoản</span>
          <span className="kpi-icon-wrap icon-users">
            <Icon name="user" />
          </span>
        </div>
        <div className="kpi-value">{kpis.totalUsers.toLocaleString("vi-VN")} <span className="kpi-unit">thành viên</span></div>
        <div className="kpi-sub">
          <Badge tone="info">Khách hàng: {kpis.totalCustomers}</Badge>
        </div>
      </div>

      {/* 6. Khuyến mãi & Giảm giá */}
      <div className="analytics-kpi-card tone-promotions">
        <div className="kpi-header">
          <span className="kpi-title">Ưu đãi đã giảm</span>
          <span className="kpi-icon-wrap icon-promotions">
            <Icon name="spark" />
          </span>
        </div>
        <div className="kpi-value">{money(kpis.totalDiscountGiven)}</div>
        <div className="kpi-sub row-center">
          <Badge tone="brand">{kpis.totalVoucherUses} lượt áp dụng</Badge>
          <span className="kpi-muted-text">{kpis.totalPromotions} voucher</span>
        </div>
      </div>
    </div>
  );
};
