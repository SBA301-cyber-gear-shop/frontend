import { quote } from "@/features/products";
import { promotionQuote } from "@/features/promotions";
import { validateBuild } from "@/features/pc-builder";

export function placeOrder(
  state,
  {
    user,
    lines,
    expectedTotal,
    budget,
    fromBuild,
    pickupName,
    pickupPhone,
    note,
    method,
    code,
    id,
    now = new Date(),
  },
) {
  if (!user || user.role !== "Customer")
    throw new Error("Vui lòng đăng nhập tài khoản khách hàng.");
  if (
    !pickupName?.trim() ||
    !/^0[0-9]{9}$/.test(pickupPhone?.replaceAll(" ", ""))
  )
    throw new Error("Kiểm tra tên và số điện thoại người nhận (10 chữ số).");
  const quoted = quote(lines, state.products),
    total = quoted.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  if (total !== expectedTotal)
    throw new Error("Giá đã thay đổi. Vui lòng kiểm tra và xác nhận lại.");
  if (fromBuild && !validateBuild(lines, state.products, budget).valid)
    throw new Error("Cấu hình chưa đủ điều kiện mua.");
  const promo = promotionQuote(state, code, user.id, total, now);
  const order = {
    id,
    userId: user.id,
    lines: quoted,
    total,
    discount: promo.discount,
    final: total - promo.discount,
    promotion: promo.promotion,
    pickupName: pickupName.trim(),
    pickupPhone,
    note,
    method,
    status: "pending",
    payment: total === promo.discount ? "SUCCESS" : "PENDING",
    createdAt: now.toISOString(),
    fromBuild: !!fromBuild,
  };
  if (order.payment === "SUCCESS") order.paidAt = now.toISOString();
  const next = structuredClone(state);
  next.orders.unshift(order);
  for (const l of quoted)
    next.products.find((p) => p.id === l.id).stock -= l.quantity;
  if (promo.promotion)
    next.usages.push({
      code: promo.promotion,
      userId: user.id,
      orderId: id,
      status: order.payment === "SUCCESS" ? "USED" : "RESERVED",
    });
  if (!fromBuild) {
    const purchasedIds = new Set(quoted.map((l) => String(l.id)));
    next.cart = next.cart.filter((item) => !purchasedIds.has(String(item.id)));
  }
  return { state: next, order };
}
export function transitionOrder(state, id, action, serials = [], cancelReason = "") {
  const next = structuredClone(state),
    order = next.orders.find((o) => o.id === id);
  if (!order) throw new Error("Không tìm thấy đơn.");
  const flow = {
    pending: "confirmed",
    confirmed: "preparing",
    preparing: "ready_for_pickup",
  };
  if (action === "advance") {
    if (!flow[order.status]) throw new Error("Không thể chuyển trạng thái.");
    order.status = flow[order.status];
  } else if (action === "pay") {
    if (
      ["canceled", "completed"].includes(order.status) ||
      order.payment === "SUCCESS"
    )
      throw new Error("Đơn không thể xác nhận thu tiền.");
    order.payment = "SUCCESS";
    order.paidAt = new Date().toISOString();
    next.usages
      .filter((u) => u.orderId === id)
      .forEach((u) => (u.status = "USED"));
  } else if (action === "cancel") {
    if (!cancelReason.trim() || cancelReason.length > 500)
      throw new Error("Nhập lý do hủy đơn từ 1 đến 500 ký tự.");
    if (!["pending", "confirmed"].includes(order.status))
      throw new Error("Đơn không còn được hủy trực tiếp.");
    if (order.payment === "SUCCESS")
      throw new Error(
        "Đơn đã trả tiền cần quy trình hoàn tiền; demo chưa hỗ trợ.",
      );
    order.status = "canceled";
    order.cancelReason = cancelReason.trim();
    order.payment = "CANCELED";
    for (const l of order.lines)
      next.products.find((p) => p.id === l.id).stock += l.quantity;
    next.usages
      .filter((u) => u.orderId === id)
      .forEach((u) => (u.status = "REVOKED"));
  } else if (action === "handover") {
    if (order.status !== "ready_for_pickup" || order.payment !== "SUCCESS")
      throw new Error("Đơn phải sẵn sàng và đã thanh toán đủ.");
    const units = order.lines.flatMap((l) =>
      Array.from({ length: l.quantity }, () => l),
    );
    if (
      serials.length !== units.length ||
      serials.some((s) => !s.trim()) ||
      new Set(serials.map((s) => s.trim().toUpperCase())).size !==
        serials.length
    )
      throw new Error("Nhập đủ serial riêng, không trùng cho từng thiết bị.");
    if (
      serials.some((s) =>
        next.warranties.some((w) => w.serial === s.trim().toUpperCase()),
      )
    )
      throw new Error("Serial đã có thẻ bảo hành.");
    units.forEach((l, i) => {
      const start = new Date(),
        end = new Date();
      end.setMonth(end.getMonth() + l.warranty);
      next.warranties.push({
        id: id + "-" + i,
        orderId: id,
        userId: order.userId,
        productId: l.id,
        serial: serials[i].trim().toUpperCase(),
        start: start.toISOString(),
        end: end.toISOString(),
        status: "active",
      });
    });
    order.status = "completed";
    order.completedAt = new Date().toISOString();
  }
  return next;
}
