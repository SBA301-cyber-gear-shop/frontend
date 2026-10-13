// ==========================================
// 3. ĐƠN HÀNG & THANH TOÁN
// Map: Table Carts, Cart_Items, Orders,
//      Order_Items, Payments, Payment_methods
// ==========================================

/** Bảng Carts – mỗi user có tối đa 1 giỏ hàng (user_id UNIQUE) */
export interface Cart {
  id: number;
  userId: number | null; // null nếu khách vãng lai chưa đăng nhập
  updatedAt: string;
}

/** Bảng Cart_Items */
export interface CartItem {
  id: number;
  cartId: number;
  productVariantId: number;
  quantity: number;
  createdAt: string;
}

/** Dòng giỏ hàng rút gọn dùng ở frontend (chưa cần cartId) */
export interface CartLine {
  id: string; // product variant id (string trong demo, number khi API thật)
  quantity: number;
}

/**
 * Trạng thái đơn hàng – map cột Orders.status.
 * Luồng chính: pending → confirmed → preparing → ready_for_pickup → completed.
 * Có thể hủy từ pending hoặc confirmed → canceled.
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "canceled";

/**
 * Trạng thái thanh toán – map cột Payments.status.
 */
export type PaymentStatus =
  "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELED" | "REFUNDED";

/** Bảng Order_Items – snapshot sản phẩm tại thời điểm mua */
export interface OrderItem {
  id: number;
  orderId: number;
  productVariantId: number;
  warrantyPeriodMonths: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Dòng đơn hàng rút gọn dùng ở frontend demo.
 * Tương đương OrderItem nhưng flat hơn cho logic tính toán.
 */
export interface OrderLine {
  id: string;
  quantity: number;
  unitPrice: number;
  name: string;
  variant: string;
  warranty: number;
}

/**
 * Bảng Orders – thông tin đơn hàng đầy đủ.
 * final_amount = total_amount - discount_amount.
 */
export interface Order {
  id: string; // order_code (VD: "TZ-261001-0128")
  userId: string;
  lines: OrderLine[];
  total: number; // total_amount
  discount: number; // discount_amount
  final: number; // final_amount
  promotion: string | null; // mã khuyến mãi đã áp dụng
  pickupName: string;
  pickupPhone: string;
  note: string;
  method: string; // phương thức nhận hàng
  status: OrderStatus;
  payment: PaymentStatus;
  createdAt: string; // ISO 8601
  paidAt?: string;
  completedAt?: string;
  fromBuild?: boolean; // đơn hàng tạo từ Build PC
}

/** Loại phương thức thanh toán – map cột Payment_methods.type */
export type PaymentMethodType =
  "credit_card" | "debit_card" | "bank_transfer" | "e_wallet" | "cash";

/** Bảng Payment_methods – phương thức thanh toán đã lưu của user */
export interface PaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethodType;
  provider: string; // VISA, MASTERCARD, VNPAY, MOMO...
  displayName: string; // VD: "Visa **** 4242"
  providerReference?: string; // Mã token từ cổng thanh toán
  isDefault: boolean;
}

/** Bảng Payments – bản ghi thanh toán cho từng đơn hàng (1-1 với Orders) */
export interface Payment {
  id: number;
  orderId: number;
  paymentMethodId: number | null;
  methodType: string; // snapshot loại thanh toán tại thời điểm mua
  provider?: string;
  displayName?: string;
  amount: number;
  status: PaymentStatus;
  transactionReference?: string; // mã giao dịch từ cổng thanh toán
  createdAt: string;
  paidAt: string | null;
}

/** Payload frontend gửi lên khi đặt đơn hàng */
export interface PlaceOrderPayload {
  lines: CartLine[];
  expectedTotal: number;
  budget?: number;
  fromBuild: boolean;
  pickupName: string;
  pickupPhone: string;
  note: string;
  method: string;
  code?: string; // mã khuyến mãi
}

/** Hành động chuyển trạng thái đơn hàng (dùng ở staff/admin) */
export type OrderAction = "advance" | "pay" | "cancel" | "handover";
