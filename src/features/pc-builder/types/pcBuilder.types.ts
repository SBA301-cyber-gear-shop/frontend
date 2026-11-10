// Hợp đồng với backend pcbuild (POST /api/pc-build/requirements/analyze và /api/pc-build/builds/*).
// Tiền luôn là số đồng nguyên; giá chỉ lấy từ server.

/** Mã slot do backend trả trong `category`: thứ tự này là step_order của build_template_slots. */
export type SlotCode =
  | "MONITOR"
  | "KEYBOARD"
  | "MOUSE"
  | "CPU"
  | "MAINBOARD"
  | "RAM"
  | "SSD"
  | "GPU"
  | "COOLER"
  | "CASE"
  | "PSU";

// ---- Bước 1–3: phân tích nhu cầu ----

export interface PcBuildConfig {
  maxBuildPrice: number;
  lowestMinBudget: number;
}

export interface AnalyzeRequest {
  budget: number;
  message: string;
}

export type RequirementStatus =
  | "READY"
  | "NEED_CLARIFICATION"
  | "BUDGET_TOO_LOW"
  | "BUDGET_TOO_HIGH";

export interface PurposeOption {
  purpose: string;
  label: string;
  description: string;
  minBudget: number;
}

export interface RequirementSummary {
  budget: number;
  /** null khi NEED_CLARIFICATION. */
  purpose: string | null;
}

export interface AnalyzeResponse {
  status: RequirementStatus;
  message: string;
  requirement: RequirementSummary | null;
  minBudget: number | null;
  maxBuildPrice: number | null;
  /** Chỉ có khi BUDGET_TOO_LOW: các mục đích vừa ngân sách khách nhập. */
  suggestedPurposes: PurposeOption[];
  notes: string[];
}

// ---- Bước 4–9: build, kiểm tra, đổi món, lưu ----

export interface AutoBuildRequest {
  budget: number;
  purpose: string;
}

/** Một món gửi lên server: id biến thể + số lượng (1–8). */
export interface BuildItemRequest {
  variantId: number;
  qty: number;
}

export interface ValidateBuildRequest {
  budget: number;
  items: BuildItemRequest[];
}

export type BuildStatus = "VALID" | "INCOMPATIBLE" | "OVER_BUDGET";

export interface BuildItem {
  /** Mã slot (SlotCode), hoặc slug danh mục viết hoa nếu món không thuộc slot nào. */
  category: string;
  /** product_variants.id */
  id: number;
  name: string;
  qty: number;
  /** Số lượng tối đa thật với phần còn lại của bộ PC. */
  maxQty: number;
  /** Đơn giá. */
  price: number;
}

export interface BuildViolation {
  rule: string;
  message: string;
}

export interface BuildResult {
  status: BuildStatus;
  budget: number;
  /** null ở /validate. */
  purpose: string | null;
  total: number;
  /** total - budget: âm là còn dư. */
  difference: number;
  items: BuildItem[];
  violations: BuildViolation[];
  /** Câu cảnh báo khi OVER_BUDGET. */
  budgetWarning: string | null;
  /** Lời giải thích bước 8; chỉ /auto có, /validate trả null. */
  message: string | null;
}

export interface ReplacementRequest {
  category: string;
  items: BuildItemRequest[];
}

export interface ReplacementOption {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  /** Số lượng sẽ dùng khi chọn món này. */
  qty: number;
  maxQty: number;
  current: boolean;
}

export interface SaveBuildRequest {
  budget: number;
  items: BuildItemRequest[];
  /** true sau khi khách bấm "Tiếp tục" ở popup vượt ngân sách. */
  confirmOverBudget?: boolean;
}

export interface SaveBuildResult {
  buildId: number;
  status: BuildStatus;
  total: number;
  difference: number;
}

/** Thân lỗi của GlobalExceptionHandler. */
export interface ApiErrorBody {
  status: number;
  message: string;
  code?: string;
  data?: unknown;
}
