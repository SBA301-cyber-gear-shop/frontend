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
export type CompatibilityStatus = "pass" | "warning" | "fail" | "unknown";

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
  purpose?: string; // nhu cầu chính, văn bản tự do
  userPrompt?: string; // mong muốn thêm, văn bản tự do
  profile?: RequirementProfile; // gửi khi khách sửa hồ sơ rồi đề xuất lại
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
  status: CompatibilityStatus;
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
  reasonCode?: string | null; // null | NEEDS_SATURATED | CATALOG_CEILING | REQUIREMENT_RELAXED
  budgetFit?: BudgetFit;
  profile?: RequirementProfile;
  relaxedItems?: string[];
  warnings?: string[];
  capacity?: BuildCapacity;
  requiredPsuW?: number;
  floorPrice?: number;
  metadata?: AiBuildMetadata;
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
  status?: CompatibilityStatus;
  failedChecks?: string[];
  warningChecks?: string[];
  priceDelta?: number;
  newTotal?: number;
  newPercent?: number | null;
}

/** Một dòng linh kiện gửi lên /validate, /compatible-replacements */
export interface BuildItemPayload {
  role: ComponentRole;
  variantId: number;
  quantity: number;
}

/** Body POST /validate */
export interface ValidateBuildPayload {
  budget?: number;
  profile?: RequirementProfile | null;
  items: BuildItemPayload[];
}

/** Body POST /compatible-replacements: mỗi ứng viên được kiểm trên toàn bộ build */
export interface CompatibleReplacementsQuery extends ValidateBuildPayload {
  role: ComponentRole;
  lineIndex?: number;
  limit?: number;
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
  status?: CompatibilityStatus;
  warningChecks?: string[];
  priceDelta?: number;
  newPercent?: number | null;
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

// ==========================================
// 5. HỒ SƠ NHU CẦU & KẾT QUẢ KIỂM TRA (DD 10.1)
// ==========================================

export type ProfileRole = "cpu" | "mainboard" | "ram" | "gpu" | "ssd" | "psu" | "case" | "cooler";
export type ProfilePriority = 1 | 2 | 3;
export type ProfileMetric =
  | "TOTAL_RAM_GB"
  | "TOTAL_STORAGE_GB"
  | "TOTAL_VRAM_GB"
  | "GPU_COUNT"
  | "CPU_COUNT"
  | "TOTAL_CPU_CORES";

export interface ProfileConstraint {
  id: string;
  role: ProfileRole;
  spec: string;
  op: "GTE" | "LTE" | "EQ" | "IN" | "NOT_IN" | "CONTAINS";
  value?: number;
  values?: string[];
  priority: ProfilePriority;
  reason?: string;
  label?: string; // do server điền
  satisfied?: boolean;
  unsatisfiable?: boolean;
}

export interface ProfileMetricConstraint {
  id: string;
  metric: ProfileMetric;
  op: "GTE" | "LTE" | "EQ";
  value: number;
  priority: ProfilePriority;
  reason?: string;
  label?: string;
  satisfied?: boolean;
  unsatisfiable?: boolean;
}

export interface ProfilePreference {
  id: string;
  role?: ProfileRole;
  spec?: string;
  metric?: ProfileMetric;
  direction: "MAX" | "MIN" | "PREFER";
  values?: string[];
  weight: number;
  cap?: number | null;
  reason?: string;
}

export interface RequirementProfile {
  profileVersion: 1;
  source: "AI" | "USER_EDITED";
  summary: string;
  archetype: "GAMING" | "CREATIVE" | "AI_DATA" | "OFFICE" | "DEV" | "GENERAL";
  useCases?: string[];
  roleWeights: Partial<Record<ProfileRole, number>>;
  requiredRoles: { role: ProfileRole; priority: ProfilePriority; reason?: string }[];
  excludedRoles: { role: ProfileRole; reason?: string }[];
  constraints: ProfileConstraint[];
  metrics: ProfileMetricConstraint[];
  preferences: ProfilePreference[];
  balancePairs?: { a: ProfileRole; b: ProfileRole; maxGap: number }[];
  brands?: { prefer: string[]; avoid: string[] };
  unmetNeeds?: string[];
  droppedItems?: { id: string; reason: string; detail?: string }[];
  confidence?: number;
  clarifyingQuestion?: string;
}

export interface BudgetFit {
  ratio: number;
  percent: number;
  status:
    | "IN_WINDOW"
    | "UNDER_WINDOW"
    | "UNDER_SATURATED"
    | "UNDER_CEILING"
    | "UNDER_RELAXED"
    | "OVER";
  windowMin: number;
  windowMax: number;
  leftover: number;
}

export interface BuildCapacity {
  ramSlotsUsed: number;
  ramSlotsMax: number;
  ramGb: number;
  ramMaxGb: number;
  m2Used: number;
  m2Max: number;
  gpuCount: number;
  gpuMax: number;
}

export interface AiBuildMetadata {
  requestId?: string;
  generatedAt?: string;
  extractStatus?: "OK" | "CACHED" | "USER_PROFILE";
  aiStatus?: "OK" | "PARTIAL";
  provider?: string;
  model?: string;
  promptVersions?: Record<string, string>;
  dictionaryVersion?: string;
  latencyMs?: Record<string, number>;
  candidateCount?: number;
  solverIterations?: number;
}

export interface ValidateBuildResponse {
  isCompatible: boolean;
  hasWarnings: boolean;
  hasUnknown: boolean;
  totalPrice: number;
  budgetFit: BudgetFit | null; // null khi request không có budget
  checks: CompatibilityCheckResponse[];
  requiredPsuW: number;
  capacity: BuildCapacity;
  items: SelectedPartResponse[];
}

export interface MetadataSpecEntry {
  type: "ENUM" | "LIST" | "INT";
  unit?: string;
  min?: number;
  max?: number;
  values?: Record<string, string>; // ENUM/LIST: code → nhãn hiển thị
}

export interface MetadataDictionary {
  dictionaryVersion?: string;
  roles: Partial<
    Record<
      ProfileRole,
      {
        label: string;
        priceRange?: number[];
        brands?: string[];
        specs: Record<string, MetadataSpecEntry>;
      }
    >
  >;
  metrics: Partial<
    Record<ProfileMetric, { label: string; unit?: string; min?: number; max?: number }>
  >;
}

export interface BuildOptionsResponse {
  minBudget: number;
  floorPrice: number;
  maxBudget: number;
  dictionaryVersion: string;
  dictionary: MetadataDictionary;
  examples: string[];
  tiers: { code: string; min: number; max: number | null }[];
}

/** Body lỗi chuẩn của backend: {timestamp, status, error, message, code?, data?} */
export interface ApiErrorBody {
  status: number;
  code?: string;
  message: string;
  data?: unknown;
}
