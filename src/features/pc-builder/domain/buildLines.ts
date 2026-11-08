import type {
  AnalyzeResponse,
  AutoBuildRequest,
  BuildItem,
  BuildItemRequest,
  BuildViolation,
  ReplacementOption,
  SlotCode,
} from "../types/pcBuilder.types";

/** Thứ tự slot của build_template_slots (step_order 1–11): màn, phím, chuột trước, rồi thùng máy. */
export const SLOT_ORDER: SlotCode[] = [
  "MONITOR",
  "KEYBOARD",
  "MOUSE",
  "CPU",
  "MAINBOARD",
  "RAM",
  "SSD",
  "GPU",
  "COOLER",
  "CASE",
  "PSU",
];

export const SLOT_LABELS: Record<SlotCode, string> = {
  MONITOR: "Màn hình",
  KEYBOARD: "Bàn phím",
  MOUSE: "Chuột",
  CPU: "CPU",
  MAINBOARD: "Bo mạch chủ",
  RAM: "RAM",
  SSD: "SSD",
  GPU: "Card đồ họa",
  COOLER: "Tản nhiệt",
  CASE: "Vỏ case",
  PSU: "Nguồn",
};

export const slotLabel = (category: string): string =>
  SLOT_LABELS[category as SlotCode] ?? category;

// Giống @Max / @Size của RequirementAnalyzeRequest: chặn sớm để khỏi tốn một lượt gọi AI
export const MAX_BUDGET = 9_999_999_999;
export const MAX_MESSAGE_LENGTH = 500;

/** Kiểm tra form trước khi gọi /requirements/analyze; trả câu báo lỗi hoặc null. */
export function checkInput(budget: number, message: string): string | null {
  if (!Number.isInteger(budget) || budget <= 0) return "Vui lòng nhập ngân sách là số đồng nguyên lớn hơn 0.";
  if (budget > MAX_BUDGET) return `Ngân sách tối đa là ${MAX_BUDGET.toLocaleString("vi-VN")} ₫.`;
  const text = message.trim();
  if (!text) return "Vui lòng mô tả nhu cầu sử dụng của bạn.";
  if (text.length > MAX_MESSAGE_LENGTH) return `Mô tả nhu cầu tối đa ${MAX_MESSAGE_LENGTH} ký tự.`;
  return null;
}

/** READY và BUDGET_WARNING có đủ {budget, purpose} để gọi /builds/auto; trạng thái khác thì khách phải chọn tiếp. */
export function buildableRequirement(analysis: AnalyzeResponse): AutoBuildRequest | null {
  const requirement = analysis.requirement;
  if (analysis.status !== "READY" && analysis.status !== "BUDGET_WARNING") return null;
  if (!requirement?.purpose || !requirement.budget) return null;
  return { budget: requirement.budget, purpose: requirement.purpose };
}

export const toItemRequests = (items: BuildItem[]): BuildItemRequest[] =>
  items.map((item) => ({ variantId: item.id, qty: item.qty }));

/** Khóa của một bộ PC (không phụ thuộc thứ tự dòng): phản hồi cho khóa cũ bị bỏ. */
export const buildKey = (items: BuildItemRequest[]): string =>
  items
    .map((item) => `${item.variantId}:${item.qty}`)
    .sort()
    .join(",");

export const lineTotal = (items: BuildItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

export interface SlotRow {
  category: string;
  /** Vị trí trong items; -1 là slot chưa có món (ví dụ GPU của bộ văn phòng). */
  index: number;
  item: BuildItem | null;
}

/** Dòng của bảng theo thứ tự slot; slot thiếu hiện thành dòng trống để khách chọn thêm. */
export function slotRows(items: BuildItem[]): SlotRow[] {
  const rows = SLOT_ORDER.flatMap((category): SlotRow[] => {
    const lines = items.flatMap((item, index) => (item.category === category ? [{ category, index, item }] : []));
    return lines.length ? lines : [{ category, index: -1, item: null }];
  });
  const others = items.flatMap((item, index) =>
    SLOT_ORDER.includes(item.category as SlotCode) ? [] : [{ category: item.category, index, item }],
  );
  return [...rows, ...others];
}

/** Đổi số lượng một dòng, kẹp trong [1, maxQty]; không đổi gì thì trả lại đúng mảng cũ. */
export function setLineQty(items: BuildItem[], index: number, qty: number): BuildItem[] {
  const line = items[index];
  if (!line) return items;
  const next = Math.min(Math.max(1, Math.trunc(qty)), Math.max(1, line.maxQty));
  if (next === line.qty) return items;
  return items.map((item, i) => (i === index ? { ...item, qty: next } : item));
}

/** Thay món ở dòng index bằng lựa chọn của dropdown; index -1 là thêm món cho slot đang trống. */
export function replaceLine(
  items: BuildItem[],
  index: number,
  category: string,
  option: ReplacementOption,
): BuildItem[] {
  const line: BuildItem = {
    category,
    id: option.id,
    name: option.name,
    qty: option.qty,
    maxQty: option.maxQty,
    price: option.price,
  };
  return index >= 0 && items[index]
    ? items.map((item, i) => (i === index ? line : item))
    : [...items, line];
}

/** Câu báo lỗi lưu: 422 BUILD_INCOMPATIBLE kèm các luật bị vi phạm trong data.violations. */
export function saveErrorText(message: string, data: unknown): string {
  const violations = (data as { violations?: BuildViolation[] } | null | undefined)?.violations ?? [];
  const reasons = violations.map((v) => v.message).filter(Boolean);
  return reasons.length ? `${message} (${reasons.join("; ")})` : message;
}

export interface CartBuildSet {
  id: number | string;
  name?: string;
  budget?: number;
  itemVariantIds?: string[];
  parts?: Array<Record<string, unknown>>;
}

/**
 * Đọc lại bộ PC đã thêm vào giỏ (localStorage techzone_pc_build_sets) để sửa tiếp.
 * Nhận cả bộ cũ (variantId, quantity, unitPrice) lẫn bộ mới (id, qty, price, budget).
 */
export function itemsFromCartSet(set: CartBuildSet | null | undefined): { budget: number; items: BuildItemRequest[] } | null {
  if (!set || !Array.isArray(set.parts)) return null;
  const items: BuildItemRequest[] = [];
  let total = 0;
  for (const part of set.parts) {
    const variantId = Number(part.id ?? part.variantId);
    const qty = Number(part.qty ?? part.quantity);
    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(qty) || qty < 1) continue;
    items.push({ variantId, qty });
    total += (Number(part.price ?? part.unitPrice) || 0) * qty;
  }
  // Bộ cũ không lưu ngân sách: lấy tổng tiền lúc thêm vào giỏ
  const budget = Number(set.budget) > 0 ? Number(set.budget) : total;
  if (!items.length || !(budget > 0) || budget > MAX_BUDGET) return null;
  return { budget: Math.round(budget), items };
}
