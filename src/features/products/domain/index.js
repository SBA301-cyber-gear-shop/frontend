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
