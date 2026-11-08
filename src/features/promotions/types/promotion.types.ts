// ==========================================
// 5. KHUYẾN MÃI & BANNER
// Map: Table Promotions, Promotion_Usages, Banners
// ==========================================

/** Loại giảm giá – theo phần trăm hoặc số tiền cố định */
export type DiscountType = "percentage" | "fixed_amount";

/** Trạng thái áp dụng voucher – map cột Promotion_Usages.status */
export type PromotionUsageStatus =
  "APPLIED" | "RESERVED" | "USED" | "REVOKED" | "CANCELED";

/** Bảng Promotions – mã giảm giá / khuyến mãi */
export interface Promotion {
  id: number;
  code: string; // Mã voucher (VD: "CYBER2026", "HE500K")
  name: string; // Tên chương trình
  discountType: DiscountType; // "percentage" hoặc "fixed_amount"
  discountValue: number; // Giá trị: 10 (%) hoặc 500000 (₫)
  usageLimit: number; // Tổng số lượt được phép dùng
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  isActive: boolean;
  minOrderValue?: number; // Giá trị đơn hàng tối thiểu để áp dụng
  maxDiscountAmount?: number; // Mức giảm tối đa (nếu là percentage)
}

/** Bảng Promotion_Usages – lịch sử áp dụng voucher của user cho 1 đơn hàng */
export interface PromotionUsage {
  id: number;
  promotionId: number;
  userId: number;
  orderId: number; // 1 order chỉ được dùng 1 promotion
  status: PromotionUsageStatus;
  discountAmount: number; // Số tiền thực tế được giảm
  usedAt?: string;
}

/** Bảng Banners – banner quảng cáo trên trang chủ */
export interface Banner {
  id: number;
  promotionId?: number | null; // Liên kết tới CTKM nếu có
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

/** Payload gửi lên khi người dùng nhập mã voucher tại bước thanh toán */
export interface ValidatePromotionPayload {
  code: string;
  orderTotal: number;
}

/** Kết quả xác thực voucher trả về cho frontend */
export interface PromotionValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}
