export interface KpiSummary {
  totalRevenue: number;
  totalItemsSold: number;
  totalOrders: number;
  totalCanceledOrders: number;
  cancelRate: number;
  totalUsers: number;
  totalCustomers: number;
  totalWarrantyRequests: number;
  activeWarrantyRequests: number;
  totalPromotions: number;
  totalVoucherUses: number;
  totalDiscountGiven: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  itemsSold: number;
  orderCount: number;
}

export interface DailyOrderStats {
  date: string;
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  processingOrders: number;
}

export interface MonthlyOrderStats {
  month: string;
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  processingOrders: number;
}

export interface MonthlyWarranty {
  month: string;
  totalRequests: number;
  completedRequests: number;
  processingRequests: number;
  canceledRequests: number;
}

export interface MonthlyUserGrowth {
  month: string;
  newUsers: number;
  newCustomers: number;
  newStaff: number;
}

export interface PromotionAnalytics {
  id: number;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  usageLimit: number;
  audience: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  totalDiscountAmount: number;
  usageRate: number;
}

export interface TopSellingProduct {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface DashboardSummaryData {
  kpis: KpiSummary;
  monthlyRevenue: MonthlyRevenue[];
  dailyOrders: DailyOrderStats[];
  monthlyOrders: MonthlyOrderStats[];
  monthlyWarranties: MonthlyWarranty[];
  monthlyUsers: MonthlyUserGrowth[];
  promotions: PromotionAnalytics[];
  topProducts: TopSellingProduct[];
}

