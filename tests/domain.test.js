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
} from "../src/domain/commerce.js";
const now = new Date("2026-10-03T12:00:00+07:00");
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
test("duplicate intake prohibited and required warranty lifecycle enforced", () => {
  const s = createSeed();
  assert.throws(
    () => createTicket(s, { id: "new", warrantyId: "wc1", issue: "Lỗi", now }),
    /chưa đóng/,
  );
  let n = createTicket(s, {
    id: "new",
    warrantyId: "wc2",
    issue: "Lỗi",
    condition: "Tốt",
    accessories: "Không",
    now,
  });
  assert.throws(() => transitionTicket(n, "new", "completed", "x", "x"));
  for (const status of ["inspecting", "repairing", "completed", "returned"])
    n = transitionTicket(n, "new", status, "Ghi chú nội bộ", "Thông báo khách");
  assert.equal(n.tickets[0].status, "returned");
  assert.ok(n.tickets[0].returnedAt);
});
