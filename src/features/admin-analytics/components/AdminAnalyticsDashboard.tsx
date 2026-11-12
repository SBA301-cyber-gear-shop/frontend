import { useEffect, useState, useCallback, type FC } from "react";
import { Button, Icon } from "@/components/ui";
import { adminAnalyticsApi } from "../api/adminAnalyticsApi";
import type { DashboardSummaryData } from "../types";
import { AnalyticsKpiCards } from "./AnalyticsKpiCards";
import { RevenueChart } from "./RevenueChart";
import { OrderStatsSection } from "./OrderStatsSection";
import { WarrantyStatsSection } from "./WarrantyStatsSection";
import { UserGrowthSection } from "./UserGrowthSection";
import { PromotionStatsTable } from "./PromotionStatsTable";
import { TopProductsTable } from "./TopProductsTable";

export const AdminAnalyticsDashboard: FC = () => {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "warranty" | "users" | "promotions">("overview");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAnalyticsApi.getSummary(months, 30);
      setData(res);
    } catch (err: unknown) {
      console.error("Lỗi khi tải dữ liệu thống kê:", err);
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="admin-analytics-dashboard">
      {/* Top action & filter bar chuẩn TechZone */}
      <div className="analytics-top-bar">
        <div>
          <div className="analytics-main-eyebrow">KHÔNG GIAN VẬN HÀNH / BÁO CÁO</div>
          <h1 className="analytics-main-title">Báo cáo & Thống kê Quản trị</h1>
          <p className="analytics-main-desc">
            Tổng hợp dữ liệu doanh thu, đơn hàng, bảo hành, người dùng và khuyến mãi CyberShop
          </p>
        </div>

        <div className="analytics-top-actions">
          <div className="time-range-segmented">
            <button
              type="button"
              className={`range-btn ${months === 6 ? "active" : ""}`}
              onClick={() => setMonths(6)}
            >
              6 tháng
            </button>
            <button
              type="button"
              className={`range-btn ${months === 12 ? "active" : ""}`}
              onClick={() => setMonths(12)}
            >
              12 tháng
            </button>
          </div>

          <Button
            tone="secondary"
            onClick={loadData}
            disabled={loading}
          >
            <Icon name="refresh" className={loading ? "spin" : ""} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="analytics-nav-tabs">
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Icon name="chart" />
          <span>Tổng quan & Doanh thu</span>
        </button>
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Icon name="bag" />
          <span>Đơn hàng & Hủy đơn</span>
        </button>
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "warranty" ? "active" : ""}`}
          onClick={() => setActiveTab("warranty")}
        >
          <Icon name="shield" />
          <span>Bảo hành ({data?.kpis?.totalWarrantyRequests || 0})</span>
        </button>
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Icon name="user" />
          <span>Người dùng ({data?.kpis?.totalUsers || 0})</span>
        </button>
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "promotions" ? "active" : ""}`}
          onClick={() => setActiveTab("promotions")}
        >
          <Icon name="spark" />
          <span>Khuyến mãi & Voucher</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="analytics-loading-box">
          <span className="analytics-spinner" />
          <p>Đang tải số liệu thống kê CyberShop…</p>
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="analytics-error-box">
          <p>{error}</p>
          <Button onClick={loadData}>Thử lại</Button>
        </div>
      )}

      {/* Content display */}
      {data && (
        <div className="analytics-content-body">
          {/* Always show KPI summary cards */}
          <AnalyticsKpiCards kpis={data.kpis} />

          {/* Tab 1: Overview & Revenue */}
          {activeTab === "overview" && (
            <div className="analytics-tab-pane">
              <RevenueChart data={data.monthlyRevenue} expectedMonths={months} />
              <div className="analytics-grid-two">
                <TopProductsTable products={data.topProducts} />
                <OrderStatsSection
                  dailyOrders={data.dailyOrders}
                  monthlyOrders={data.monthlyOrders}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Orders & Cancellation */}
          {activeTab === "orders" && (
            <div className="analytics-tab-pane">
              <OrderStatsSection
                dailyOrders={data.dailyOrders}
                monthlyOrders={data.monthlyOrders}
              />
            </div>
          )}

          {/* Tab 3: Warranty */}
          {activeTab === "warranty" && (
            <div className="analytics-tab-pane">
              <WarrantyStatsSection data={data.monthlyWarranties} />
            </div>
          )}

          {/* Tab 4: Users */}
          {activeTab === "users" && (
            <div className="analytics-tab-pane">
              <UserGrowthSection data={data.monthlyUsers} />
            </div>
          )}

          {/* Tab 5: Promotions & Vouchers */}
          {activeTab === "promotions" && (
            <div className="analytics-tab-pane">
              <PromotionStatsTable promotions={data.promotions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
