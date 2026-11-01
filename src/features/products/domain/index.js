// Đổi thông số dạng { "Tên": "Giá trị" } của form thành attributes mà API cần (theo specificationId).
export function toVariantAttributes(specs, specCatalog, existing = []) {
  const idByName = new Map(specCatalog.map((s) => [s.name.toLowerCase(), s.id]));
  const bySpecId = new Map();
  const unknown = [];
  for (const [name, value] of Object.entries(specs || {})) {
    const specificationId = idByName.get(name.toLowerCase());
    if (!specificationId) {
      unknown.push(name);
      continue;
    }
    // Giá trị không đổi thì giữ option cũ; đổi giá trị thì bỏ, vì option được ưu tiên hơn value khi hiển thị.
    const same = existing.find(
      (a) => a.specificationId === specificationId && a.value === value,
    );
    bySpecId.set(specificationId, {
      specificationId,
      optionId: same?.optionId ?? null,
      value,
    });
  }
  if (unknown.length)
    throw new Error(
      `Không có thông số: ${unknown.join(", ")}. Hãy dùng đúng tên ở trang Quản lý thông số.`,
    );
  return [...bySpecId.values()];
}

const MAX_PRICE = 9_999_999_999; // cột giá numeric(12,2)

// strict: dấu phân cách phải đúng nhóm nghìn, để "1500.50" không bị hiểu thành 150.050 đ.
export function parsePriceInput(raw, strict = false) {
  const text = raw.trim();
  if (!text) return { value: 0 };
  if (!/^[\d.,\s]+$/.test(text))
    return { error: "Giá chỉ gồm chữ số, không nhận số âm hay ký tự khác." };
  if (strict && /[.,\s]/.test(text) && !/^\d{1,3}([.,\s]\d{3})+$/.test(text))
    return { error: "Giá không có số lẻ. Nhập dạng 1500000 hoặc 1.500.000." };
  const value = Number(text.replace(/\D/g, ""));
  if (value > MAX_PRICE)
    return { error: "Giá không được vượt quá 9.999.999.999 ₫." };
  return { value };
}

export const totalOf = (lines, products) =>
  lines.reduce(
    (sum, l) =>
      sum + (products.find((p) => p.id === l.id)?.price || 0) * l.quantity,
    0,
  );
export function quote(lines, products) {
  if (!lines.length) throw new Error("Chưa có sản phẩm để đặt hàng.");
  const merged = new Map();
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1)
      throw new Error("Số lượng phải là số nguyên dương.");
    merged.set(l.id, (merged.get(l.id) || 0) + l.quantity);
  }
  return [...merged].map(([id, quantity]) => {
    const p = products.find((p) => p.id === id);
    if (!p || p.status !== "active")
      throw new Error("Một sản phẩm không còn được kinh doanh.");
    if (quantity > p.stock)
      throw new Error(p.name + " chỉ còn " + p.stock + " sản phẩm.");
    return {
      id,
      quantity,
      unitPrice: p.price,
      name: p.name,
      variant: p.variant,
      warranty: p.warranty,
    };
  });
}
