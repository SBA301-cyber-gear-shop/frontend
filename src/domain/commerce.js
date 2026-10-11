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
// ---- Bảo hành. Bản demo áp dụng cùng quy tắc với BE (module aftersales); dữ liệu phiếu dùng cùng tên trường với API.
// Mỗi dòng: [từ, đến, vai trò được làm, các kết quả phải chọn]. Admin làm được mọi bước.
export const TICKET_FLOW = [
  ["received", "inspecting", "Technician"],
  ["received", "canceled", "Staff"],
  ["inspecting", "repairing", "Technician"],
  [
    "inspecting",
    "ready_for_return",
    "Technician",
    ["rejected", "no_fault_found", "withdrawn"],
  ],
  ["inspecting", "canceled", "Technician"],
  ["repairing", "ready_for_return", "Technician", ["repaired", "withdrawn"]],
  ["repairing", "waiting_for_parts", "Technician"],
  ["repairing", "inspecting", "Technician"],
  ["waiting_for_parts", "repairing", "Technician"],
  ["waiting_for_parts", "ready_for_return", "Technician", ["withdrawn"]],
  ["ready_for_return", "returned", "Staff"],
  ["ready_for_return", "inspecting", "Staff"],
];
const IN_PROGRESS = ["inspecting", "repairing", "waiting_for_parts"];
const NOTE_REQUIRED = "Ghi nội dung kiểm tra hoặc bàn giao trước khi cập nhật.";
const isOpen = (t) => !["returned", "canceled"].includes(t.status);
const allows = (rule, role) => role === rule[2] || role === "Admin";
export const allowedTicketSteps = (status, role) =>
  TICKET_FLOW.filter((r) => r[0] === status && allows(r, role)).map((r) => ({
    toStatus: r[1],
    resolutions: r[3] || [],
  }));
// Ngày theo giờ máy, dạng YYYY-MM-DD, để so sánh hạn theo ngày chứ không theo giờ.
const dayOf = (v) =>
  typeof v === "string" && v.length === 10
    ? v
    : new Date(v).toLocaleDateString("en-CA");
const shiftDay = (v, days, months = 0) => {
  const d = new Date(dayOf(v));
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const vnDay = (v) => dayOf(v).split("-").reverse().join("/");
/** Thẻ còn hiệu lực từ ngày bắt đầu đến hết ngày kết thúc. */
export const warrantyValidOn = (w, day) =>
  w.status === "active" && day >= dayOf(w.start) && day <= dayOf(w.end);
function requireRole(actor, roles) {
  if (!actor || !roles.includes(actor.role))
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
}
function ticketOf(state, id) {
  const t = state.tickets.find((t) => t.id === id);
  if (!t) throw new Error("Không tìm thấy phiếu bảo hành.");
  return t;
}
const cardOf = (state, id) => state.warranties.find((w) => w.id === id);
// Phiếu đã đổi thiết bị không kiểm tra lại được: phiếu gắn thẻ cũ, thẻ đó đã bị thay.
const reinspectsReplaced = (t, toStatus) =>
  t.status === "ready_for_return" &&
  toStatus === "inspecting" &&
  t.resolution === "replaced";
// Lúc tạo phiếu đã chặn ngày trong quá khứ, đổi ngày ở các bước sau cũng phải chặn.
function setExpectedDate(t, date, now) {
  if (!date || date === t.expectedReturnDate) return;
  if (date < dayOf(now))
    throw new Error("Ngày hẹn trả không được trước hôm nay.");
  t.expectedReturnDate = date;
}
// Phiếu chỉ giữ ghi chú mới nhất; từng lần ghi nằm trong events và không bị sửa.
function record(t, actor, from, internalNote, publicNote, at) {
  t.technicianNote = internalNote;
  if (publicNote) t.publicNote = publicNote;
  t.version += 1;
  t.events.push({
    fromStatus: from,
    toStatus: t.status,
    actorId: actor.id,
    actorName: actor.name,
    internalNote,
    publicNote: publicNote || null,
    createdAt: at,
  });
}
export function createTicket(state, input, id, actor, now = new Date()) {
  requireRole(actor, ["Staff", "Admin"]);
  const w = cardOf(state, input.warrantyCardId);
  if (!w || !warrantyValidOn(w, dayOf(now)))
    throw new Error("Thẻ không còn hiệu lực tại thời điểm tiếp nhận.");
  if (state.tickets.some((t) => t.warrantyCardId === w.id && isOpen(t)))
    throw new Error("Thiết bị đã có phiếu chưa đóng.");
  for (const [field, label] of [
    ["issueDescription", "mô tả lỗi"],
    ["conditionNote", "tình trạng ngoại quan"],
    ["accessoriesNote", "phụ kiện nhận giữ"],
    ["contactName", "tên người mang máy"],
  ])
    if (!input[field]?.trim()) throw new Error("Vui lòng nhập " + label + ".");
  if (!/^0\d{9}$/.test(input.contactPhone || ""))
    throw new Error("Số điện thoại phải có 10 chữ số bắt đầu bằng 0.");
  if (!input.expectedReturnDate || input.expectedReturnDate < dayOf(now))
    throw new Error("Ngày hẹn trả không được trước ngày tiếp nhận.");
  const next = structuredClone(state),
    at = now.toISOString(),
    t = {
      id,
      requestCode: id,
      warrantyCardId: w.id,
      // Phiếu luôn thuộc về chủ đơn hàng, không phải người đang thao tác.
      userId: w.userId,
      issueDescription: input.issueDescription.trim(),
      conditionNote: input.conditionNote.trim(),
      accessoriesNote: input.accessoriesNote.trim(),
      contactName: input.contactName.trim(),
      contactPhone: input.contactPhone,
      expectedReturnDate: input.expectedReturnDate,
      status: "received",
      resolution: null,
      technicianNote: null,
      publicNote: null,
      createdAt: at,
      completedAt: null,
      assignedTechnicianId: null,
      version: -1,
      events: [],
    };
  record(
    t,
    actor,
    null,
    "Tiếp nhận thiết bị tại quầy.",
    "Đã tiếp nhận thiết bị.",
    at,
  );
  next.tickets.unshift(t);
  return next;
}
export function transitionTicket(state, id, input, actor, now = new Date()) {
  const next = structuredClone(state),
    t = ticketOf(next, id),
    { toStatus, resolution = null } = input;
  if (input.version != null && input.version !== t.version)
    throw new Error("Phiếu đã được người khác cập nhật, vui lòng tải lại.");
  const from = t.status,
    rule = TICKET_FLOW.find((r) => r[0] === from && r[1] === toStatus);
  if (!rule) throw new Error("Chuyển trạng thái bảo hành không hợp lệ.");
  if (!actor || !allows(rule, actor.role))
    throw new Error("Vai trò của bạn không được thực hiện bước này.");
  if (rule[3] ? !rule[3].includes(resolution) : resolution)
    throw new Error("Kết quả xử lý không hợp lệ cho bước này.");
  const w = cardOf(next, t.warrantyCardId);
  // Sau khi đổi thẻ ở bước chẩn đoán, linh kiện lỗi có thể thuộc một thẻ đã hết hạn.
  if (
    (toStatus === "repairing" ||
      ["repaired", "no_fault_found"].includes(resolution)) &&
    !warrantyValidOn(w, dayOf(t.createdAt))
  )
    throw new Error(
      "Thẻ đang gắn không còn hiệu lực lúc tiếp nhận, chỉ có thể từ chối bảo hành.",
    );
  if (reinspectsReplaced(t, toStatus))
    throw new Error(
      "Thiết bị đã được đổi. Nếu thiết bị mới có lỗi, trả máy rồi tạo phiếu trên thẻ của thiết bị mới.",
    );
  let note = input.internalNote?.trim();
  const publicNote = input.publicNote?.trim();
  if (!note) throw new Error(NOTE_REQUIRED);
  if (toStatus === "ready_for_return" && !publicNote)
    throw new Error("Nhập nội dung thông báo cho khách khi chuyển sang chờ trả.");
  const at = now.toISOString();
  if (from === "received" && toStatus === "inspecting")
    t.assignedTechnicianId = actor.id;
  if (toStatus === "ready_for_return") {
    t.resolution = resolution;
    t.completedAt = at;
  }
  if (from === "ready_for_return" && toStatus === "inspecting") {
    t.resolution = null;
    t.completedAt = null;
  }
  if (toStatus === "returned" && t.resolution === "repaired") {
    // Cộng một lần lúc trả máy, nên không cộng trùng khi phiếu đã qua nhiều lần kiểm tra lại.
    const days = Math.round(
      (new Date(dayOf(t.completedAt)) - new Date(dayOf(t.createdAt))) / 864e5,
    );
    if (days > 0) {
      const oldEnd = w.end;
      w.end = shiftDay(oldEnd, days);
      note +=
        " Cộng " +
        days +
        " ngày bảo hành: " +
        vnDay(oldEnd) +
        " thành " +
        vnDay(w.end) +
        ".";
    }
  }
  t.status = toStatus;
  setExpectedDate(t, input.expectedReturnDate, now);
  record(t, actor, from, note, publicNote, at);
  return next;
}
export function addTicketNote(state, id, input, actor, now = new Date()) {
  requireRole(actor, ["Technician", "Admin"]);
  const next = structuredClone(state),
    t = ticketOf(next, id);
  if (!IN_PROGRESS.includes(t.status))
    throw new Error(
      "Chỉ ghi chú được khi phiếu đang kiểm tra, đang sửa hoặc chờ linh kiện.",
    );
  if (!input.internalNote?.trim()) throw new Error(NOTE_REQUIRED);
  setExpectedDate(t, input.expectedReturnDate, now);
  record(
    t,
    actor,
    t.status,
    input.internalNote.trim(),
    input.publicNote?.trim(),
    now.toISOString(),
  );
  return next;
}
/** Khách mang cả bộ máy: lúc tiếp nhận chưa biết linh kiện nào lỗi, kỹ thuật viên gắn lại đúng thẻ. */
export function relinkTicketCard(state, id, input, actor, now = new Date()) {
  requireRole(actor, ["Technician", "Admin"]);
  const next = structuredClone(state),
    t = ticketOf(next, id);
  if (t.status !== "inspecting")
    throw new Error("Chỉ đổi thẻ được khi phiếu đang kiểm tra.");
  const current = cardOf(next, t.warrantyCardId),
    target = cardOf(next, input.warrantyCardId);
  if (!target) throw new Error("Không tìm thấy thẻ bảo hành.");
  if (target.id === current.id) throw new Error("Phiếu đang gắn đúng thẻ này.");
  if (target.status !== "active")
    throw new Error("Thẻ được chọn không còn hoạt động.");
  if (target.orderId !== current.orderId)
    throw new Error("Chỉ đổi được sang thẻ thuộc cùng đơn hàng.");
  if (next.tickets.some((x) => x.warrantyCardId === target.id && isOpen(x)))
    throw new Error("Thẻ được chọn đang có phiếu khác chưa đóng.");
  if (!input.internalNote?.trim()) throw new Error(NOTE_REQUIRED);
  t.warrantyCardId = target.id;
  record(
    t,
    actor,
    t.status,
    "Đổi thẻ: " +
      current.serial +
      " sang " +
      target.serial +
      ". " +
      input.internalNote.trim(),
    null,
    now.toISOString(),
  );
  return next;
}
/** Đổi sang thiết bị có serial khác: tạo thẻ mới trỏ về thẻ cũ, phiếu vẫn gắn thẻ cũ để giữ lịch sử. */
export function replaceTicketDevice(state, id, input, actor, now = new Date()) {
  requireRole(actor, ["Technician", "Admin"]);
  const next = structuredClone(state),
    t = ticketOf(next, id);
  if (t.status !== "repairing")
    throw new Error("Chỉ đổi thiết bị được khi phiếu đang sửa chữa.");
  const old = cardOf(next, t.warrantyCardId);
  if (!warrantyValidOn(old, dayOf(t.createdAt)))
    throw new Error(
      "Thẻ đang gắn không còn hiệu lực lúc tiếp nhận, không thể đổi thiết bị theo bảo hành.",
    );
  const serial = (input.newSerialNumber || "").trim().toUpperCase();
  if (!serial) throw new Error("Nhập serial của thiết bị thay thế.");
  if (next.warranties.some((w) => w.serial.toUpperCase() === serial))
    throw new Error("Serial đã có thẻ bảo hành.");
  if (!["stock", "supplier"].includes(input.source))
    throw new Error("Chọn nguồn thiết bị thay thế.");
  if (!input.internalNote?.trim()) throw new Error(NOTE_REQUIRED);
  if (!input.publicNote?.trim())
    throw new Error("Nhập nội dung thông báo cho khách.");
  const at = now.toISOString(),
    months =
      next.orders
        .find((o) => o.id === old.orderId)
        ?.lines.find((l) => l.id === old.productId)?.warranty ??
      next.products.find((p) => p.id === old.productId)?.warranty ??
      0;
  // Hạn của thiết bị mới tính lại từ ngày đổi, đủ số tháng bảo hành của sản phẩm.
  next.warranties.push({
    id: old.id + "-R" + next.warranties.length,
    orderId: old.orderId,
    userId: old.userId,
    productId: old.productId,
    serial,
    start: at,
    end: shiftDay(at, 0, months),
    status: "active",
    replacesId: old.id,
  });
  old.status = "replaced";
  const from = t.status;
  t.status = "ready_for_return";
  t.resolution = "replaced";
  t.completedAt = at;
  record(
    t,
    actor,
    from,
    "Đổi thiết bị: " +
      old.serial +
      " sang " +
      serial +
      ". Nguồn: " +
      (input.source === "stock"
        ? "hàng đang bán, Admin cần trừ tồn kho"
        : "hãng gửi về") +
      ". " +
      input.internalNote.trim(),
    input.publicNote.trim(),
    at,
  );
  return next;
}
// ---- Các hàm đọc trả về đúng dạng dữ liệu của API bảo hành, để màn hình dùng chung cho demo và BE.
function ticketSummary(state, t) {
  const w = cardOf(state, t.warrantyCardId);
  return {
    id: t.id,
    requestCode: t.requestCode,
    status: t.status,
    resolution: t.resolution,
    issueDescription: t.issueDescription,
    contactName: t.contactName,
    contactPhone: t.contactPhone,
    expectedReturnDate: t.expectedReturnDate,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    warrantyCardId: t.warrantyCardId,
    serialNumber: w?.serial,
    productName: state.products.find((p) => p.id === w?.productId)?.name,
  };
}
function cardView(state, w, now) {
  const product = state.products.find((p) => p.id === w.productId),
    order = state.orders.find((o) => o.id === w.orderId),
    replacement = state.warranties.find((x) => x.replacesId === w.id),
    history = state.tickets.filter((t) => t.warrantyCardId === w.id),
    open = history.find(isOpen);
  return {
    id: w.id,
    serialNumber: w.serial,
    startDate: w.start,
    endDate: w.end,
    status: w.status,
    valid: warrantyValidOn(w, dayOf(now)),
    productName: product?.name,
    variantName: product?.variant,
    orderCode: w.orderId,
    customerName: order?.pickupName,
    customerPhone: order?.pickupPhone,
    pickupName: order?.pickupName,
    pickupPhone: order?.pickupPhone,
    replacesCardId: w.replacesId || null,
    replacedByCardId: replacement?.id || null,
    replacedBySerialNumber: replacement?.serial || null,
    repairedCount: history.filter((t) => t.resolution === "repaired").length,
    openRequest: open ? ticketSummary(state, open) : null,
    requests: history.map((t) => ticketSummary(state, t)),
  };
}
/** So khớp chính xác theo serial, mã đơn, số điện thoại hoặc mã phiếu để không gắn nhầm thẻ. */
export function searchWarrantyCards(state, query, now = new Date()) {
  const q = (query || "").trim().toUpperCase();
  if (!q) throw new Error("Nhập serial, mã đơn, số điện thoại hoặc mã phiếu.");
  return state.warranties
    .filter(
      (w) =>
        w.serial.toUpperCase() === q ||
        w.orderId.toUpperCase() === q ||
        state.orders.find((o) => o.id === w.orderId)?.pickupPhone === q ||
        state.tickets.some(
          (t) => t.warrantyCardId === w.id && t.requestCode.toUpperCase() === q,
        ),
    )
    .map((w) => cardView(state, w, now));
}
export const ticketSummaries = (state, status) =>
  state.tickets
    .filter((t) => !status || t.status === status)
    .map((t) => ticketSummary(state, t));
export function ticketView(state, id, actor, now = new Date()) {
  const t = ticketOf(state, id),
    technical = ["Technician", "Admin"].includes(actor?.role);
  return {
    ...ticketSummary(state, t),
    conditionNote: t.conditionNote,
    accessoriesNote: t.accessoriesNote,
    technicianNote: t.technicianNote,
    publicNote: t.publicNote,
    assignedTechnicianId: t.assignedTechnicianId,
    assignedTechnicianName:
      t.events.find((e) => e.actorId === t.assignedTechnicianId)?.actorName ||
      null,
    version: t.version,
    card: cardView(state, cardOf(state, t.warrantyCardId), now),
    events: t.events,
    allowedTransitions: allowedTicketSteps(t.status, actor?.role).filter(
      (s) => !reinspectsReplaced(t, s.toStatus),
    ),
    canAddNote: technical && IN_PROGRESS.includes(t.status),
    canRelinkCard: technical && t.status === "inspecting",
    canReplaceDevice: technical && t.status === "repairing",
  };
}
/** Thẻ và phiếu của một khách, chỉ gồm nội dung công khai. */
export function myWarrantyCards(state, userId, now = new Date()) {
  return state.warranties
    .filter((w) => w.userId === userId)
    .map((w) => {
      const v = cardView(state, w, now);
      return {
        id: v.id,
        serialNumber: v.serialNumber,
        startDate: v.startDate,
        endDate: v.endDate,
        status: v.status,
        valid: v.valid,
        productName: v.productName,
        variantName: v.variantName,
        orderCode: v.orderCode,
        replacedBySerialNumber: v.replacedBySerialNumber,
        requests: state.tickets
          .filter((t) => t.warrantyCardId === w.id && t.userId === userId)
          .map((t) => ({
            id: t.id,
            requestCode: t.requestCode,
            status: t.status,
            resolution: t.resolution,
            issueDescription: t.issueDescription,
            publicNote: t.publicNote,
            expectedReturnDate: t.expectedReturnDate,
            createdAt: t.createdAt,
            completedAt: t.completedAt,
            // Dòng chỉ có ghi chú nội bộ không có gì để khách xem.
            timeline: t.events
              .filter((e) => e.fromStatus !== e.toStatus || e.publicNote)
              .map((e) => ({
                status: e.toStatus,
                publicNote: e.publicNote,
                createdAt: e.createdAt,
              })),
          })),
      };
    });
}
