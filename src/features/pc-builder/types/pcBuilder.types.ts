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
  purpose?: string; // "gaming", "creative", "work"
  ramGb?: number; // 16, 32, 64
  scope?: string; // "tower", "full"
  userPrompt?: string; // Prompt tự do
}

/** Dòng linh kiện được AI đề xuất trả về từ Backend */
export interface SelectedPartResponse {
  role: ComponentRole;
  variantId: number;
  productName: string;
  variantName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  specs: Record<string, string>;
  aiReason?: string;
}

/** Chi tiết một tiêu chí kiểm tra tương thích từ Backend */
export interface CompatibilityCheckResponse {
  key?: string;
  label: string;
  status: string; // "pass", "fail", "warning"
  detail: string;
  valid?: boolean;
}

/** Kết quả AI PC Builder trả về từ Backend API */
export interface AiBuildResponse {
  buildId?: number;
  buildName: string;
  purpose: string;
  totalPrice: number;
  budget: number;
  aiReasoning: string;
  performanceHighlight: string;
  isCompatible: boolean;
  checks: CompatibilityCheckResponse[];
  items: SelectedPartResponse[];
}

/** Linh kiện thay thế tương thích thông minh từ Backend */
export interface CompatibleReplacementResponse {
  variantId: number | string;
  productName: string;
  variantName: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
  specs: Record<string, string>;
  isCompatible: boolean;
  compatibilityNote: string;
}

/** Query parameters khi tìm linh kiện thay thế tương thích (Smart Replace) */
export interface CompatibleReplacementsQuery {
  role: ComponentRole;
  currentCpuId?: number;
  currentMainboardId?: number;
  budgetLimit?: number;
}


/** Linh kiện trong cấu hình đang hiển thị trên giao diện Builder */
export interface BuildPart {
  role: ComponentRole;
  roleName: string;
  variantId: number | string;
  productName: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  specs: Record<string, string>;
  aiReason: string;
}

/** Ứng viên thay thế trong Modal Smart Replace */
export interface ReplacementCandidate {
  variantId: number | string;
  productName: string;
  variantName: string;
  price: number;
  specs: Record<string, string>;
  isCompatible: boolean;
  compatibilityNote: string;
  isCurrent: boolean;
}

/** Tiêu chí kiểm định tương thích 8 quy tắc */
export interface RuleCheck {
  id: string;
  title: string;
  detail: string;
  status: CompatibilityStatus;
}

/** Thẻ nhận xét chuyên môn của AI */
export interface AiBuildInsight {
  title: string;
  reasoning: string;
  highlight: string;
}

/** Trạng thái hiển thị giao diện Builder */
export type BuilderStatus = "success" | "loading" | "empty" | "error";

/** DTO tóm tắt một cấu hình PC đã lưu */
export interface SavedPcBuildSummary {
  buildId: number;
  buildName: string;
  totalPrice: number;
  orderId: number | null;
  isOrdered: boolean;
  itemCount: number;
  cpuName?: string;
  gpuName?: string;
  mainboardName?: string;
  ramSummary?: string;
}

/** DTO chi tiết đầy đủ linh kiện của một cấu hình PC đã lưu */
export interface SavedPcBuildDetail {
  buildId: number;
  buildName: string;
  totalPrice: number;
  orderId: number | null;
  isOrdered: boolean;
  items: SelectedPartResponse[];
}
