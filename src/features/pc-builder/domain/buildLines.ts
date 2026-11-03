import type {
  BuildPart,
  PeripheralItem,
  PeripheralRole,
  PeripheralSelection,
  PeripheralSuggestionResponse,
  RuleCheck,
} from "../types/pcBuilder.types";

export const PERIPHERAL_ROLES: PeripheralRole[] = ["monitor", "keyboard", "mouse"];

export function isPeripheralRole(role: string): role is PeripheralRole {
  return (PERIPHERAL_ROLES as string[]).includes(role);
}

/** Cấu hình đã lưu có cả màn, phím, chuột: thùng máy đi qua /validate, 3 món kia về khu Trọn bộ. */
export function splitSavedItems<T extends { role: string }>(items: T[]): { pc: T[]; peripherals: T[] } {
  return {
    pc: items.filter((item) => !isPeripheralRole(item.role)),
    peripherals: items.filter((item) => isPeripheralRole(item.role)),
  };
}

interface SavedPeripheral {
  role: string;
  variantId: number | string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  unitPrice: number;
}

/**
 * Khôi phục đúng món đã lưu: còn bán thì lấy thông tin mới nhất trong danh sách, không còn thì giữ dữ liệu đã lưu
 * (không tự đổi sang món khác). Loại không có trong cấu hình đã lưu là khách đã bỏ tick.
 */
export function savedSelection(saved: SavedPeripheral[], suggestion: PeripheralSuggestionResponse | null): PeripheralSelection {
  const selection: PeripheralSelection = {};
  for (const role of PERIPHERAL_ROLES) {
    const item = saved.find((s) => s.role === role);
    if (!item) {
      selection[role] = null;
      continue;
    }
    const current = suggestion?.roles.find((r) => r.role === role)?.options.find((o) => String(o.variantId) === String(item.variantId));
    selection[role] = current ?? {
      variantId: Number(item.variantId),
      productName: item.productName,
      variantName: item.variantName,
      imageUrl: item.imageUrl,
      price: item.unitPrice,
      highlights: [],
    } satisfies PeripheralItem;
  }
  return selection;
}

/** J9a (thông số theo hãng) và J9b (giá tham khảo) là ghi chú về dữ liệu, không phải vấn đề tương thích (B9). */
export function isDataNote(rule: RuleCheck): boolean {
  return rule.id.startsWith("J9");
}

/** "PASS ALL" khi tương thích và không còn lưu ý thật nào; ghi chú dữ liệu không tính. */
export function compatibilityPassed(isCompatible: boolean, rules: RuleCheck[]): boolean {
  return isCompatible && rules.filter((r) => !isDataNote(r)).every((r) => r.status === "pass");
}

interface LineReplacement {
  variantId: number | string;
  productName: string;
  variantName: string;
  price: number;
  specs: Record<string, string>;
}

/** Đổi đúng một dòng theo chỉ số: bộ máy có thể có nhiều dòng cùng role (2 SSD, 2 GPU khác loại). */
export function replaceLine(parts: BuildPart[], index: number, candidate: LineReplacement): BuildPart[] {
  if (index < 0 || index >= parts.length) return parts;
  return parts.map((p, i) =>
    i === index
      ? {
          ...p,
          variantId: candidate.variantId,
          productName: candidate.productName,
          variantName: candidate.variantName,
          unitPrice: candidate.price,
          specs: { ...p.specs, ...candidate.specs },
        }
      : p,
  );
}

export function changeLineQuantity(parts: BuildPart[], index: number, delta: number, max: number): BuildPart[] {
  if (index < 0 || index >= parts.length) return parts;
  return parts.map((p, i) => (i === index ? { ...p, quantity: Math.max(1, Math.min(max, p.quantity + delta)) } : p));
}

// Trường phục vụ nhập liệu và đối chiếu giá, không phải thông số cho khách
const INTERNAL_SPECS = new Set(["Price_Source", "Price_Seen_Date", "Price_Status", "Compat_Note"]);

export function visibleSpecs(specs: Record<string, string> | undefined | null): [string, string][] {
  return Object.entries(specs ?? {}).filter(([name]) => !INTERNAL_SPECS.has(name));
}
