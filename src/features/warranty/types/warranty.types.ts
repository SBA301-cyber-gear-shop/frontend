// ==========================================
// 6. BẢO HÀNH, YÊU CẦU DỊCH VỤ & ĐÁNH GIÁ
// Map: Table Warrantly_cards, Service_requests, Reviews
// ==========================================

/** Trạng thái thẻ bảo hành */
export type WarrantyStatus = "active" | "expired" | "void";

/** Bảng Warrantly_cards – thẻ bảo hành cấp cho từng món hàng đã mua */
export interface WarrantyCard {
  id: number;
  orderItemId: number;
  serialNumber: string; // Số serial định danh thiết bị
  startDate: string; // Ngày kích hoạt bảo hành (thường là ngày hoàn tất đơn)
  endDate: string; // Ngày hết hạn = startDate + warrantyPeriodMonths
  status: WarrantyStatus;
}

/**
 * Trạng thái phiếu tiếp nhận kỹ thuật / bảo hành.
 * Máy trạng thái (State Machine):
 * received → inspecting → (repairing | rejected) → completed → returned.
 */
export type ServiceTicketStatus =
  | "received"
  | "inspecting"
  | "repairing"
  | "completed"
  | "rejected"
  | "returned";

/** Kết quả xử lý phiếu bảo hành */
export type TicketResolution = "REPAIRED" | "REJECTED" | "REPLACED";

/**
 * Bảng Service_requests – phiếu tiếp nhận bảo hành / sửa chữa.
 * Đây là shape đầy đủ từ DB kết hợp các trường thực tế đang dùng trong frontend (tickets).
 */
export interface ServiceRequest {
  id: string | number; // Mã phiếu: "TK-010" hoặc id số
  userId: number;
  warrantyCardId: number;
  issueDescription: string; // Mô tả lỗi thiết bị của khách
  status: ServiceTicketStatus;
  technicianNote?: string; // Ghi chú nội bộ của kỹ thuật viên
  publicNote?: string; // Phản hồi công khai cho khách hàng xem
  resolution?: TicketResolution;
  condition?: string; // Tình trạng ngoại quan (trầy xước, móp...)
  accessories?: string; // Phụ kiện kèm theo (hộp, sạc...)
  createdAt: string;
  completedAt?: string;
  returnedAt?: string;
}

/** Bảng Reviews – đánh giá chất lượng sản phẩm đã mua */
export interface Review {
  id: number;
  orderItemId: number;
  rating: number; // Thang điểm từ 1 đến 5 sao
  comment?: string;
  reviewDate: string;
  userName?: string; // Tên khách hàng (sau khi JOIN Users)
}

/** Payload tạo phiếu bảo hành mới */
export interface CreateServiceRequestPayload {
  warrantyCardId: number;
  issueDescription: string;
  condition?: string;
  accessories?: string;
}

/** Payload chuyển trạng thái phiếu bảo hành (dành cho Kỹ thuật viên / Admin) */
export interface TransitionTicketPayload {
  ticketId: string | number;
  nextStatus: ServiceTicketStatus;
  technicianNote: string;
  publicNote?: string;
  resolution?: TicketResolution;
}

/** Payload tạo đánh giá sản phẩm */
export interface CreateReviewPayload {
  orderItemId: number;
  rating: number;
  comment: string;
}
