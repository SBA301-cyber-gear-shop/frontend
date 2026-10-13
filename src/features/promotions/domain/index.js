export function promotionQuote(state, code, userId, total, now = new Date()) {
  if (!code?.trim()) return { discount: 0, promotion: null };
  const p = state.promotions.find((p) => p.code === code.trim().toUpperCase());
  if (!p || !p.active || now < new Date(p.start) || now > new Date(p.end))
    throw new Error("Mã giảm giá không tồn tại hoặc đã hết hiệu lực.");
  if (state.usages.some((u) => u.userId === userId && u.code === p.code))
    throw new Error("Bạn đã sử dụng hoặc giữ mã này cho một đơn khác.");
  if (
    state.usages.filter(
      (u) => u.code === p.code && ["RESERVED", "USED"].includes(u.status),
    ).length >= p.limit
  )
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  return {
    discount: Math.min(
      total,
      Math.round(p.type === "percentage" ? (total * p.value) / 100 : p.value),
    ),
    promotion: p.code,
  };
}
