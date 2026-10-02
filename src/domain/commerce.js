import { defaultBuild } from "../data/seed.js";
export const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n || 0,
  );
export const dateTime = (v) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
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
export function validateBuild(lines, products, budget) {
  const parts = lines.map((l) => ({
    ...products.find((p) => p.id === l.id),
    quantity: l.quantity,
  }));
  const by = (key) => parts.find((p) => p.category === key);
  const cpu = by("cpu"),
    main = by("mainboard"),
    ram = parts.filter((p) => p.category === "ram"),
    gpu = by("gpu"),
    psu = by("psu"),
    box = by("case"),
    cooler = by("cooler");
  const result = [];
  const add = (label, ok, detail, unknown = false) =>
    result.push({
      label,
      status: unknown ? "unknown" : ok ? "pass" : "fail",
      detail,
    });
  const required = [
    "cpu",
    "mainboard",
    "ram",
    "gpu",
    "ssd",
    "psu",
    "case",
    "cooler",
  ];
  const complete =
    required.every((k) => by(k)) &&
    parts.every(
      (p) =>
        p.id &&
        p.status === "active" &&
        Number.isInteger(p.quantity) &&
        p.quantity > 0 &&
        p.quantity <= p.stock,
    ) &&
    required
      .filter((k) => k !== "ram" && k !== "ssd")
      .every(
        (k) =>
          parts
            .filter((p) => p.category === k)
            .reduce((s, p) => s + p.quantity, 0) === 1,
      );
  add(
    "Thành phần & tồn kho",
    complete,
    complete
      ? "Đủ nhóm linh kiện và số lượng."
      : "Thiếu linh kiện, trùng linh kiện hoặc không đủ tồn kho.",
  );
  const cpuKnown =
    !!cpu?.tech?.socket &&
    !!main?.tech?.socket &&
    Array.isArray(main?.tech?.supportedCpu);
  add(
    "CPU ↔ bo mạch chủ",
    cpuKnown &&
      cpu.tech.socket === main.tech.socket &&
      main.tech.supportedCpu.includes(cpu.id),
    "Đối chiếu socket và danh sách CPU hỗ trợ trong dữ liệu demo.",
    !cpuKnown,
  );
  const ramCount = ram.reduce((s, p) => s + p.quantity, 0),
    capacity = ram.reduce(
      (s, p) => s + (p.tech?.capacity || 0) * p.quantity,
      0,
    );
  const ramKnown =
    !!main?.tech?.ramSlots &&
    !!main?.tech?.maxRam &&
    !!main?.tech?.memory &&
    ram.length > 0 &&
    ram.every((p) => p.tech?.memory && p.tech?.capacity && p.tech?.form);
  add(
    "RAM & số khe",
    ramKnown &&
      ram.every(
        (p) => p.tech.memory === main.tech.memory && p.tech.form === "DIMM",
      ) &&
      ramCount <= main.tech.ramSlots &&
      capacity <= main.tech.maxRam,
    ramCount +
      " thanh / " +
      (main?.tech?.ramSlots || "?") +
      " khe · " +
      capacity +
      "GB",
    !ramKnown,
  );
  const powerKnown =
    !!psu?.tech?.power &&
    !!cpu?.tech?.power &&
    !!gpu?.tech?.power &&
    gpu?.tech?.connectors != null &&
    psu?.tech?.gpuConnectors != null;
  add(
    "Nguồn & đầu nối",
    powerKnown &&
      psu.tech.power >= (cpu.tech.power + gpu.tech.power + 100) * 1.25 &&
      psu.tech.gpuConnectors >= gpu.tech.connectors,
    "Ước tính tải + dự phòng; cần xác nhận thực tế trước khi lắp.",
    !powerKnown,
  );
  const storage = parts.filter((p) => p.category === "ssd");
  add(
    "Ổ cứng & kết nối",
    !!main?.tech?.m2 &&
      storage.every((p) => p.tech?.interface === "M.2 NVMe") &&
      storage.reduce((s, p) => s + p.quantity, 0) <= main.tech.m2,
    "Kiểm tra số khe M.2 theo cấu hình demo.",
    !main?.tech?.m2 || storage.some((p) => !p.tech?.interface),
  );
  const sizeKnown =
    !!box?.tech?.gpuMax &&
    !!box?.tech?.coolerMax &&
    !!gpu?.tech?.length &&
    !!cooler?.tech?.height &&
    Array.isArray(box?.tech?.forms) &&
    !!main?.tech?.form &&
    Array.isArray(cooler?.tech?.sockets);
  add(
    "Kích thước lắp đặt",
    sizeKnown &&
      box.tech.gpuMax >= gpu.tech.length &&
      box.tech.coolerMax >= cooler.tech.height &&
      box.tech.forms.includes(main.tech.form) &&
      cooler.tech.sockets.includes(cpu?.tech?.socket),
    "Đối chiếu case, GPU và tản nhiệt.",
    !sizeKnown,
  );
  add(
    "Ngân sách",
    Number.isFinite(budget) && budget > 0 && totalOf(lines, products) <= budget,
    "Tổng " + money(totalOf(lines, products)) + " / " + money(budget),
  );
  return {
    checks: result,
    valid: result.every((r) => r.status === "pass"),
    capacity,
  };
}
export function suggestBuild(
  products,
  budget,
  purpose,
  ramGb = 32,
  scope = "tower",
) {
  if (!Number.isFinite(budget) || budget <= 0)
    throw new Error("Nhập ngân sách hợp lệ.");
  if (scope !== "tower")
    throw new Error(
      "Demo hiện hỗ trợ thùng máy; hãy mua màn hình riêng hoặc dùng API AI để tư vấn toàn bộ góc máy.",
    );
  const lines = structuredClone(defaultBuild).map((l) => ({
    ...l,
    id: l.id === "case1" ? "case2" : l.id,
  }));
  const ram = lines.find((l) => l.id === "ram16");
  ram.quantity = Math.ceil(ramGb / 16);
  if (purpose === "creative" && budget >= 26000000)
    lines.find((l) => l.id === "gpu1").id = "gpu2";
  if (totalOf(lines, products) > budget)
    lines.find((l) => l.id === "main1").id = "main2";
  const check = validateBuild(lines, products, budget);
  if (!check.valid)
    throw new Error(
      "Chưa tìm được cấu hình phù hợp trong dữ liệu demo. " +
        check.checks
          .filter((c) => c.status !== "pass")
          .map((c) => c.label)
          .join(", ") +
        ". Hãy điều chỉnh nhu cầu hoặc ngân sách.",
    );
  return lines;
}
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
  if (!fromBuild) next.cart = [];
  return { state: next, order };
}
export function transitionOrder(state, id, action, serials = []) {
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
    if (!["pending", "confirmed"].includes(order.status))
      throw new Error("Đơn không còn được hủy trực tiếp.");
    if (order.payment === "SUCCESS")
      throw new Error(
        "Đơn đã trả tiền cần quy trình hoàn tiền; demo chưa hỗ trợ.",
      );
    order.status = "canceled";
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
export function createTicket(
  state,
  { warrantyId, issue, condition, accessories, id, now = new Date() },
) {
  const w = state.warranties.find((w) => w.id === warrantyId);
  if (
    !w ||
    w.status !== "active" ||
    now < new Date(w.start) ||
    now > new Date(w.end)
  )
    throw new Error("Thẻ không còn hiệu lực tại thời điểm tiếp nhận.");
  if (
    state.tickets.some(
      (t) => t.warrantyId === warrantyId && t.status !== "returned",
    )
  )
    throw new Error("Thiết bị đã có phiếu chưa đóng.");
  if (!issue.trim()) throw new Error("Vui lòng nhập mô tả lỗi.");
  const next = structuredClone(state);
  next.tickets.unshift({
    id,
    warrantyId,
    userId: w.userId,
    issue,
    condition,
    accessories,
    status: "received",
    note: "",
    publicNote: "Đã tiếp nhận thiết bị.",
    createdAt: now.toISOString(),
  });
  return next;
}
export function transitionTicket(state, id, status, note, publicNote) {
  const next = structuredClone(state),
    t = next.tickets.find((t) => t.id === id);
  const allowed = {
    received: ["inspecting"],
    inspecting: ["repairing", "rejected"],
    repairing: ["completed"],
    completed: ["returned", "inspecting"],
    rejected: ["returned"],
  };
  if (!t || !allowed[t.status]?.includes(status))
    throw new Error("Chuyển trạng thái bảo hành không hợp lệ.");
  if (!note.trim())
    throw new Error("Ghi nội dung kiểm tra hoặc bàn giao trước khi cập nhật.");
  t.status = status;
  t.note = note;
  t.publicNote = publicNote;
  if (status === "rejected") t.resolution = "REJECTED";
  if (status === "completed") {
    t.completedAt = new Date().toISOString();
    t.resolution = "REPAIRED";
  }
  if (status === "returned") t.returnedAt = new Date().toISOString();
  return next;
}
