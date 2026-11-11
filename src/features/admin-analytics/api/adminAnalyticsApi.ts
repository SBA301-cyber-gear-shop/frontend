import { axiosClient } from "@/services/axiosClient";
import { endpoints } from "@/services/endpoints";
import type {
  DashboardSummaryData,
  DailyOrderStats,
  MonthlyOrderStats,
  MonthlyRevenue,
  MonthlyWarranty,
  MonthlyUserGrowth,
  PromotionAnalytics,
  TopSellingProduct,
} from "../types";

export const adminAnalyticsApi = {
  async getSummary(months = 12, days = 14): Promise<DashboardSummaryData> {
    const res = await axiosClient.get<DashboardSummaryData>(endpoints.admin.analytics.summary, {
      params: { months, days },
    });
    return res.data;
  },

  async getDailyOrders(days = 30): Promise<DailyOrderStats[]> {
    const res = await axiosClient.get<DailyOrderStats[]>(endpoints.admin.analytics.dailyOrders, {
      params: { days },
    });
    return res.data;
  },

  async getMonthlyOrders(months = 12): Promise<MonthlyOrderStats[]> {
    const res = await axiosClient.get<MonthlyOrderStats[]>(endpoints.admin.analytics.monthlyOrders, {
      params: { months },
    });
    return res.data;
  },

  async getMonthlyRevenue(months = 12): Promise<MonthlyRevenue[]> {
    const res = await axiosClient.get<MonthlyRevenue[]>(endpoints.admin.analytics.monthlyRevenue, {
      params: { months },
    });
    return res.data;
  },

  async getMonthlyWarranties(months = 12): Promise<MonthlyWarranty[]> {
    const res = await axiosClient.get<MonthlyWarranty[]>(endpoints.admin.analytics.monthlyWarranties, {
      params: { months },
    });
    return res.data;
  },

  async getMonthlyUsers(months = 12): Promise<MonthlyUserGrowth[]> {
    const res = await axiosClient.get<MonthlyUserGrowth[]>(endpoints.admin.analytics.monthlyUsers, {
      params: { months },
    });
    return res.data;
  },

  async getPromotions(): Promise<PromotionAnalytics[]> {
    const res = await axiosClient.get<PromotionAnalytics[]>(endpoints.admin.analytics.promotions);
    return res.data;
  },

  async getTopProducts(limit = 10): Promise<TopSellingProduct[]> {
    const res = await axiosClient.get<TopSellingProduct[]>(endpoints.admin.analytics.topProducts, {
      params: { limit },
    });
    return res.data;
  },
};

