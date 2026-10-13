// ==========================================
// 4. CẤU HÌNH PC & AI BUILDER
// Map: Table PC_Customs, PC_Custom_Items
//      + AI-Powered PC Builder Domain Logic
// ==========================================

import type { ProductDisplay } from "@/features/products";

/** Vai trò của từng linh kiện trong bộ PC */
export type ComponentRole =
  | "cpu"
  | "mainboard"
  | "ram"
  | "gpu"
  | "ssd"
  | "psu"
  | "case"
  | "cooler"
  | "monitor";

/** Bảng PC_Customs – lưu cấu hình PC tự chọn hoặc AI build */
export interface PcCustom {
  id: number;
  orderId: number | null; // null khi đang là bản nháp (DRAFT), có id khi đã chốt đơn
  totalPrice: number;
  name?: string; // Tên bộ PC (VD do AI gợi ý hoặc người dùng đặt)
  status?: "draft" | "saved" | "ordered";
  createdAt?: string;
}

/** Bảng PC_Custom_Items – danh sách linh kiện trong 1 bộ PC */
export interface PcCustomItem {
  id: number;
  pcCustomId: number;
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  componentRole?: ComponentRole; // role phân loại (cpu, gpu...)
}

/** Dòng linh kiện trong cấu hình đang build ở Frontend */
export interface BuildLine {
  id: string; // variant id (string trong demo, number trong DB)
  quantity: number;
}

/** Trạng thái kiểm tra của từng tiêu chí tương thích */
export type CompatibilityStatus = "pass" | "fail" | "unknown";

/** Kết quả kiểm tra một tiêu chí tương thích (VD: Socket, Công suất nguồn...) */
export interface CompatibilityCheck {
  label: string; // Tên tiêu chí: "Socket CPU & Mainboard", "Nguồn & đầu nối"...
  status: CompatibilityStatus;
  detail: string; // Giải thích chi tiết
}

/** Báo cáo kiểm định tương thích tổng thể từ Hardware Compatibility Validator */
export interface ValidationReport {
  valid: boolean;
  checks: CompatibilityCheck[];
  summary?: string;
  capacity?: {
    ramUsed: number;
    ramMax: number;
    m2Used: number;
    m2Max: number;
  };
}

/** DTO linh kiện ứng viên gửi qua lại giữa Frontend, Backend và AI */
export interface ComponentCandidateDTO {
  variantId: number;
  productId: number;
  role: ComponentRole;
  name: string;
  price: number;
  quantity: number;
  specs: Record<string, string>; // EAV key-value: Socket, Memory_Type, TDP_Power, Wattage...
  imageUrl?: string;
}

/** Payload gửi lên khi gọi AI PC Builder tư vấn */
export interface AiBuildRequestPayload {
  budget: number;
  purpose: "gaming" | "creative" | "office" | "ai_data";
  specialRequirements?: string; // Prompt tự do: "vỏ màu trắng, tản nước, chiến Black Myth Wukong"
  ramGb?: number; // Mặc định 16 hoặc 32
  scope?: "tower" | "fullset"; // Chỉ case hay cả màn hình
}

/** Kết quả AI PC Builder trả về cho Frontend */
export interface AiBuildSuggestionResponse {
  pcCustomId?: number;
  name: string; // Tên dàn máy do AI đặt (VD: "Ghost White Dragon")
  reasoning: string; // Phân tích chuyên môn của AI
  expectedFps?: Record<string, number>; // FPS ước tính: { "Black Myth: Wukong": 85, "Cyberpunk 2077": 75 }
  parts: Record<ComponentRole, ComponentCandidateDTO | null>;
  totalAmount: number;
  validation: ValidationReport;
}

/** Query parameters khi tìm linh kiện thay thế tương thích (Smart Replace) */
export interface CompatibleReplacementsQuery {
  role: ComponentRole;
  currentCpuId?: number;
  currentMainboardId?: number;
  budgetLimit?: number;
}
