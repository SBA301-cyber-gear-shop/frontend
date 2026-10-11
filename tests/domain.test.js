import test from "node:test";
import assert from "node:assert/strict";
import { createSeed, defaultBuild, demoAccounts } from "../src/data/seed.js";
import {
  totalOf,
  validateBuild,
  suggestBuild,
  quote,
  promotionQuote,
  placeOrder,
  transitionOrder,
  createTicket,
  transitionTicket,
  addTicketNote,
  relinkTicketCard,
  replaceTicketDevice,
  searchWarrantyCards,
  ticketView,
  myWarrantyCards,
  allowedTicketSteps,
} from "../src/domain/commerce.js";
const now = new Date("2026-10-03T12:00:00+07:00");
const [customer, staff, technician, admin] = demoAccounts;
const intake = (warrantyCardId, extra = {}) => ({
  warrantyCardId,
  issueDescription: "Máy tự tắt sau 5 phút chơi game",
  conditionNote: "Không trầy xước",
  accessoriesNote: "Nhận cả bộ máy",
  contactName: "Trần Văn B",
  contactPhone: "0911222333",
  expectedReturnDate: "2026-10-10",
  ...extra,
});
const step = (toStatus, extra = {}) => ({
  toStatus,
  internalNote: "Ghi chú nội bộ",
  ...extra,
});
test("reference build total is 22,430,000 and missing size remains unknown", () => {
  const s = createSeed();
  assert.equal(totalOf(defaultBuild, s.products), 22430000);
  const r = validateBuild(defaultBuild, s.products, 25000000);
  assert.equal(r.valid, false);
  assert.equal(
    r.checks.find((c) => c.label === "Kích thước lắp đặt").status,
    "unknown",
  );
});
test("suggestion is fully checked against demo dataset", () => {
  const s = createSeed();
  const b = suggestBuild(s.products, 25000000, "gaming");
  assert.equal(validateBuild(b, s.products, 25000000).valid, true);
});
test("four individual sticks cannot fit two slots", () => {
  const s = createSeed();
  const b = suggestBuild(s.products, 25000000, "gaming").map((l) =>
    l.id === "main1"
      ? { ...l, id: "main2" }
      : l.id === "ram16"
        ? { ...l, quantity: 4 }
        : l,
  );
  assert.equal(
    validateBuild(b, s.products, 40000000).checks.find(
      (c) => c.label === "RAM & số khe",
    ).status,
    "fail",
  );
});
test("DDR4 on DDR5 mainboard fails", () => {
  const s = createSeed();
  const b = suggestBuild(s.products, 25000000, "gaming").map((l) =>
    l.id === "ram16" ? { ...l, id: "ram4" } : l,
  );
  assert.equal(validateBuild(b, s.products, 25000000).valid, false);
});
test("too small a budget does not produce over-budget recommendation", () =>
  assert.throws(
    () => suggestBuild(createSeed().products, 10000000, "gaming"),
    /Chưa tìm/,
  ));
test("quantity is validated after merging duplicate variants", () => {
  const s = createSeed();
  assert.throws(
    () =>
      quote(
        [
          { id: "ram16", quantity: 20 },
          { id: "ram16", quantity: 10 },
        ],
        s.products,
      ),
    /chỉ còn/,
  );
  assert.throws(
    () => quote([{ id: "ram16", quantity: 0 }], s.products),
    /nguyên dương/,
  );
});
test("voucher uniqueness, reserved quota, expiry and capped fixed discount", () => {
  const s = createSeed();
  assert.throws(
    () => promotionQuote(s, "TECH500", "customer", 1000000, now),
    /đã sử dụng/,
  );
  s.promotions[0].limit = 1;
  assert.throws(
    () => promotionQuote(s, "TECH500", "new", 1000000, now),
    /hết lượt/,
  );
  s.promotions[0].limit = 100;
  assert.equal(
    promotionQuote(s, "TECH500", "new", 100000, now).discount,
    100000,
  );
  assert.throws(
    () => promotionQuote(s, "TECH500", "new", 100000, new Date("2027-01-01")),
    /hết hiệu lực/,
  );
});
test("order creation reserves stock once, snapshots price and cancel restores once", () => {
  const s = createSeed();
  const { state, order } = placeOrder(s, {
    user: demoAccounts[0],
    lines: [{ id: "ram16", quantity: 2 }],
    expectedTotal: 2400000,
    pickupName: "Khách demo",
    pickupPhone: "0900000128",
    method: "store",
    id: "new-order",
    now,
  });
  assert.equal(order.total, 2400000);
  assert.equal(state.products[0].stock, 22);
  assert.equal(s.products[0].stock, 24);
  state.products[0].price = 1;
  assert.equal(order.lines[0].unitPrice, 1200000);
  const canceled = transitionOrder(state, "new-order", "cancel");
  assert.equal(canceled.products[0].stock, 24);
  assert.throws(() => transitionOrder(canceled, "new-order", "cancel"));
});
test("price change prevents order creation", () =>
  assert.throws(
    () =>
      placeOrder(createSeed(), {
        user: demoAccounts[0],
        lines: [{ id: "ram16", quantity: 1 }],
        expectedTotal: 10,
        pickupName: "Khách",
        pickupPhone: "0900000128",
        id: "x",
        now,
      }),
    /Giá đã thay đổi/,
  ));
test("handover requires payment and unique serial per physical device", () => {
  let s = createSeed();
  assert.throws(() =>
    transitionOrder(s, "TZ-261001-0128", "handover", ["A", "B", "C"]),
  );
  s = transitionOrder(s, "TZ-261001-0128", "pay");
  assert.throws(
    () => transitionOrder(s, "TZ-261001-0128", "handover", ["A", "A", "C"]),
    /không trùng/,
  );
  const done = transitionOrder(s, "TZ-261001-0128", "handover", [
    "A",
    "B",
    "C",
  ]);
  assert.equal(done.warranties.length, 5);
  assert.equal(done.orders[0].status, "completed");
  assert.throws(() =>
    transitionOrder(done, "TZ-261001-0128", "handover", ["D", "E", "F"]),
  );
});
test("duplicate intake prohibited and warranty lifecycle enforced per role", () => {
  const s = createSeed();
  assert.throws(
    () => createTicket(s, intake("wc1"), "new", staff, now),
    /chưa đóng/,
  );
  assert.throws(
    () => createTicket(s, intake("wc2"), "new", technician, now),
    /không có quyền/,
  );
  assert.throws(
    () =>
      createTicket(
        s,
        intake("wc2", { expectedReturnDate: "2026-10-01" }),
        "new",
        staff,
        now,
      ),
    /Ngày hẹn trả/,
  );
  let n = createTicket(s, intake("wc2"), "new", staff, now);
  assert.deepEqual(
    [n.tickets[0].status, n.tickets[0].userId, n.tickets[0].events.length],
    ["received", "customer", 1],
  );
  assert.throws(
    () => transitionTicket(n, "new", step("inspecting"), staff, now),
    /Vai trò/,
  );
  assert.throws(
    () => transitionTicket(n, "new", step("repairing"), technician, now),
    /không hợp lệ/,
  );
  assert.throws(
    () => transitionTicket(n, "new", { toStatus: "inspecting" }, technician, now),
    /Ghi nội dung/,
  );
  n = transitionTicket(n, "new", step("inspecting"), technician, now);
  assert.equal(n.tickets[0].assignedTechnicianId, "technician");
  assert.throws(
    () =>
      transitionTicket(
        n,
        "new",
        step("ready_for_return", { resolution: "repaired", publicNote: "x" }),
        technician,
        now,
      ),
    /Kết quả xử lý/,
  );
  n = transitionTicket(n, "new", step("repairing"), technician, now);
  n = transitionTicket(n, "new", step("waiting_for_parts"), technician, now);
  n = transitionTicket(n, "new", step("repairing"), technician, now);
  assert.throws(
    () =>
      transitionTicket(
        n,
        "new",
        step("ready_for_return", { publicNote: "x" }),
        technician,
        now,
      ),
    /Kết quả xử lý/,
  );
  assert.throws(
    () =>
      transitionTicket(
        n,
        "new",
        step("ready_for_return", { resolution: "repaired" }),
        technician,
        now,
      ),
    /thông báo cho khách/,
  );
  n = transitionTicket(
    n,
    "new",
    step("ready_for_return", { resolution: "repaired", publicNote: "Đã sửa" }),
    technician,
    now,
  );
  assert.deepEqual(
    [n.tickets[0].status, n.tickets[0].resolution, !!n.tickets[0].completedAt],
    ["ready_for_return", "repaired", true],
  );
  assert.throws(
    () => transitionTicket(n, "new", step("returned"), technician, now),
    /Vai trò/,
  );
  assert.throws(
    () =>
      transitionTicket(n, "new", step("returned", { version: 0 }), staff, now),
    /người khác cập nhật/,
  );
  n = transitionTicket(n, "new", step("returned"), staff, now);
  assert.equal(n.tickets[0].status, "returned");
  assert.deepEqual(
    n.tickets[0].events.map((e) => e.toStatus),
    [
      "received",
      "inspecting",
      "repairing",
      "waiting_for_parts",
      "repairing",
      "ready_for_return",
      "returned",
    ],
  );
  assert.deepEqual(allowedTicketSteps("returned", "Admin"), []);
  assert.deepEqual(
    allowedTicketSteps("received", "Admin").map((x) => x.toStatus),
    ["inspecting", "canceled"],
  );
  assert.deepEqual(allowedTicketSteps("inspecting", "Customer"), []);
  // Phiếu đã đóng không còn chặn phiếu mới trên cùng thẻ.
  createTicket(n, intake("wc2"), "again", staff, now);
});
test("repair time is added to the warranty once, when the device is returned", () => {
  const done = new Date("2026-10-23T09:00:00+07:00");
  let n = createTicket(createSeed(), intake("wc2"), "t", staff, now);
  n = transitionTicket(n, "t", step("inspecting"), technician, now);
  n = transitionTicket(n, "t", step("repairing"), technician, now);
  const fixed = step("ready_for_return", {
    resolution: "repaired",
    publicNote: "Đã sửa",
  });
  n = transitionTicket(n, "t", fixed, technician, now);
  // Khách thấy còn lỗi: kết quả bị xóa, lần hoàn tất trước vẫn nằm trong lịch sử.
  n = transitionTicket(n, "t", step("inspecting"), staff, now);
  assert.deepEqual(
    [n.tickets[0].resolution, n.tickets[0].completedAt],
    [null, null],
  );
  n = transitionTicket(n, "t", step("repairing"), technician, done);
  n = transitionTicket(n, "t", fixed, technician, done);
  assert.equal(n.warranties.find((w) => w.id === "wc2").end, "2029-08-01");
  n = transitionTicket(n, "t", step("returned"), admin, done);
  assert.equal(n.warranties.find((w) => w.id === "wc2").end, "2029-08-21");
  assert.match(
    n.tickets[0].events.at(-1).internalNote,
    /Cộng 20 ngày bảo hành: 01\/08\/2029 thành 21\/08\/2029\./,
  );
  // Từ chối bảo hành cũng đóng qua bước trả máy nhưng không cộng hạn.
  n = createTicket(
    n,
    intake("wc2", { expectedReturnDate: "2026-11-30" }),
    "r",
    staff,
    done,
  );
  n = transitionTicket(n, "r", step("inspecting"), technician, done);
  n = transitionTicket(
    n,
    "r",
    step("ready_for_return", { resolution: "rejected", publicNote: "Va đập" }),
    technician,
    new Date("2026-11-20T09:00:00+07:00"),
  );
  n = transitionTicket(n, "r", step("returned"), staff, done);
  assert.equal(n.warranties.find((w) => w.id === "wc2").end, "2029-08-21");
});
test("cancel frees the card; notes only while the device is being worked on", () => {
  let n = createTicket(createSeed(), intake("wc2"), "t", staff, now);
  assert.throws(
    () => addTicketNote(n, "t", { internalNote: "x" }, technician, now),
    /Chỉ ghi chú được/,
  );
  n = transitionTicket(n, "t", step("canceled"), staff, now);
  assert.equal(n.tickets[0].status, "canceled");
  n = createTicket(n, intake("wc2"), "u", staff, now);
  n = transitionTicket(n, "u", step("inspecting"), technician, now);
  assert.throws(
    () => addTicketNote(n, "u", { internalNote: "x" }, staff, now),
    /không có quyền/,
  );
  n = addTicketNote(
    n,
    "u",
    { internalNote: "Nguồn sụt áp", publicNote: "Đã tìm ra nguyên nhân" },
    technician,
    now,
  );
  const t = n.tickets.find((t) => t.id === "u");
  assert.deepEqual(
    [t.status, t.technicianNote, t.publicNote, t.events.length],
    ["inspecting", "Nguồn sụt áp", "Đã tìm ra nguyên nhân", 3],
  );
  assert.deepEqual(
    [t.events[2].fromStatus, t.events[2].toStatus],
    ["inspecting", "inspecting"],
  );
  // Đổi ngày hẹn trả ở các bước sau cũng không được lùi về quá khứ.
  const past = { expectedReturnDate: "2026-10-02" };
  assert.throws(
    () => addTicketNote(n, "u", { internalNote: "x", ...past }, technician, now),
    /trước hôm nay/,
  );
  assert.throws(
    () => transitionTicket(n, "u", step("repairing", past), technician, now),
    /trước hôm nay/,
  );
  n = addTicketNote(
    n,
    "u",
    { internalNote: "Chờ khách xác nhận", expectedReturnDate: "2026-10-20" },
    technician,
    now,
  );
  assert.equal(
    n.tickets.find((t) => t.id === "u").expectedReturnDate,
    "2026-10-20",
  );
});
test("relink stays within one order; replacement issues a new card and keeps the old serial", () => {
  let s = transitionOrder(createSeed(), "TZ-261001-0128", "pay");
  s = transitionOrder(s, "TZ-261001-0128", "handover", ["X1", "X2", "X3"]);
  const seedTicket = "BH-261001-0018"; // đang kiểm tra, gắn thẻ wc1
  assert.throws(
    () =>
      relinkTicketCard(
        s,
        seedTicket,
        { warrantyCardId: "TZ-261001-0128-0", internalNote: "x" },
        technician,
        now,
      ),
    /cùng đơn hàng/,
  );
  assert.throws(
    () =>
      relinkTicketCard(
        s,
        seedTicket,
        { warrantyCardId: "wc1", internalNote: "x" },
        technician,
        now,
      ),
    /đúng thẻ này/,
  );
  const busy = createTicket(s, intake("wc2"), "t", staff, now);
  assert.throws(
    () =>
      relinkTicketCard(
        busy,
        seedTicket,
        { warrantyCardId: "wc2", internalNote: "x" },
        technician,
        now,
      ),
    /phiếu khác chưa đóng/,
  );
  let n = relinkTicketCard(
    s,
    seedTicket,
    { warrantyCardId: "wc2", internalNote: "Lỗi ở thanh thứ hai" },
    technician,
    now,
  );
  let t = n.tickets.find((t) => t.id === seedTicket);
  assert.equal(t.warrantyCardId, "wc2");
  assert.equal(
    t.events.at(-1).internalNote,
    "Đổi thẻ: KST26A000428 sang KST26A000429. Lỗi ở thanh thứ hai",
  );
  // Đổi thiết bị
  assert.throws(
    () =>
      replaceTicketDevice(
        n,
        seedTicket,
        { newSerialNumber: "N1", source: "stock", internalNote: "x", publicNote: "y" },
        technician,
        now,
      ),
    /đang sửa chữa/,
  );
  n = transitionTicket(n, seedTicket, step("repairing"), technician, now);
  assert.throws(
    () =>
      replaceTicketDevice(
        n,
        seedTicket,
        { newSerialNumber: "kst26a000428", source: "stock", internalNote: "x", publicNote: "y" },
        technician,
        now,
      ),
    /Serial đã có thẻ/,
  );
  n = replaceTicketDevice(
    n,
    seedTicket,
    { newSerialNumber: " new-1 ", source: "stock", internalNote: "Không sửa được", publicNote: "Đã đổi máy mới" },
    technician,
    now,
  );
  t = n.tickets.find((t) => t.id === seedTicket);
  const oldCard = n.warranties.find((w) => w.id === "wc2"),
    newCard = n.warranties.find((w) => w.serial === "NEW-1");
  assert.deepEqual(
    [t.status, t.resolution, t.warrantyCardId, oldCard.status, oldCard.serial],
    ["ready_for_return", "replaced", "wc2", "replaced", "KST26A000429"],
  );
  assert.deepEqual(
    [newCard.replacesId, newCard.status, newCard.end, newCard.orderId],
    ["wc2", "active", "2029-10-03", oldCard.orderId],
  );
  assert.match(t.events.at(-1).internalNote, /Nguồn: hàng đang bán/);
  const [oldView] = searchWarrantyCards(n, "kst26a000429", now);
  assert.deepEqual(
    [oldView.status, oldView.valid, oldView.replacedBySerialNumber],
    ["replaced", false, "NEW-1"],
  );
  assert.throws(
    () => transitionTicket(n, seedTicket, step("inspecting"), staff, now),
    /đã được đổi/,
  );
  // Vì vậy lễ tân không được mời bấm "Khách báo còn lỗi" trên phiếu đã đổi thiết bị.
  assert.deepEqual(
    ticketView(n, seedTicket, staff, now).allowedTransitions.map(
      (x) => x.toStatus,
    ),
    ["returned"],
  );
  n = transitionTicket(n, seedTicket, step("returned"), staff, now);
  assert.equal(n.warranties.find((w) => w.id === "wc2").end, "2029-08-01");
  assert.throws(
    () => createTicket(n, intake("wc2"), "x", staff, now),
    /không còn hiệu lực/,
  );
  createTicket(n, intake(newCard.id), "y", staff, now);
});
test("lookup is exact, views follow the API shape and customers never see internal notes", () => {
  let n = createTicket(createSeed(), intake("wc2"), "BH-NEW", staff, now);
  assert.equal(searchWarrantyCards(n, "KST26A00042", now).length, 0);
  assert.equal(searchWarrantyCards(n, " kst26a000429 ", now).length, 1);
  assert.equal(searchWarrantyCards(n, "TZ-260801-0043", now).length, 2);
  assert.equal(searchWarrantyCards(n, "0900000128", now).length, 2);
  assert.equal(
    searchWarrantyCards(n, "bh-new", now)[0].openRequest.requestCode,
    "BH-NEW",
  );
  assert.throws(() => searchWarrantyCards(n, " ", now), /Nhập serial/);
  n = transitionTicket(n, "BH-NEW", step("inspecting"), technician, now);
  n = addTicketNote(n, "BH-NEW", { internalNote: "Bí mật nội bộ" }, technician, now);
  const asTech = ticketView(n, "BH-NEW", technician, now),
    asStaff = ticketView(n, "BH-NEW", staff, now);
  assert.deepEqual(
    asTech.allowedTransitions.map((x) => x.toStatus),
    ["repairing", "ready_for_return", "canceled"],
  );
  assert.deepEqual(
    [asTech.canAddNote, asTech.canRelinkCard, asTech.canReplaceDevice],
    [true, true, false],
  );
  assert.deepEqual(
    [asStaff.allowedTransitions.length, asStaff.canAddNote],
    [0, false],
  );
  assert.deepEqual(
    [asTech.card.serialNumber, asTech.card.orderCode, asTech.version],
    ["KST26A000429", "TZ-260801-0043", 2],
  );
  const mine = myWarrantyCards(n, customer.id, now);
  assert.equal(mine.length, 2);
  assert.ok(!JSON.stringify(mine).includes("Bí mật nội bộ"));
  assert.ok(!JSON.stringify(mine).includes("internalNote"));
  const ticket = mine.find((c) => c.id === "wc2").requests[0];
  assert.deepEqual(
    ticket.timeline.map((e) => e.status),
    ["received", "inspecting"],
  );
  assert.deepEqual(myWarrantyCards(n, "someone-else", now), []);
});
