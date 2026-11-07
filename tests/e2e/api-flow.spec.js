import { test, expect } from "@playwright/test";

test("staff opens an intake in a drawer and prints its receipt on demand", async ({ page }) => {
  const request = { id: 51, requestCode: "BH-TEST-01", intakeId: 5, intakeCode: "BH-TEST", status: "received", productName: "RAM kiểm thử", serialNumber: "RAM-TEST", warrantyCardId: 1 };
  const intake = { id: 5, intakeCode: "BH-TEST", orderCode: "ORDER-TEST", customerName: "Khách A", contactName: "Khách A", contactPhone: "0900000000", createdAt: "2026-11-06T09:00:00", expectedReturnDate: "2026-11-08", status: "received", issueDescription: "Lỗi RAM", requests: [request], canCancel: true, canReturn: false };
  const card = { id: 1, orderId: 10, orderCode: "ORDER-TEST", customerName: "Khách A", productName: "RAM kiểm thử", serialNumber: "RAM-TEST", status: "active", valid: true, endDate: "2027-01-01", openRequest: request, requests: [request] };
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 2, name: "Staff", role: "Staff" }));
    window.print = () => {};
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/warranty-cards") return route.fulfill({ json: { data: [card] } });
    if (path === "/api/service-intakes/5") return route.fulfill({ json: { data: intake } });
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto("/van-hanh/bao-hanh");
  await page.getByLabel("Tra cứu serial hoặc số điện thoại").fill("ORDER-TEST");
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem phiếu BH-TEST", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Phiếu tiếp nhận BH-TEST" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Lỗi RAM").first()).toBeVisible();
  await expect(drawer.getByRole("button", { name: "In biên nhận" })).toBeHidden();
  await drawer.getByText("Xem và in biên nhận").click();
  await expect(drawer.getByRole("button", { name: "In biên nhận" })).toBeVisible();
  await drawer.getByRole("button", { name: "In biên nhận" }).click();
  await expect(drawer.locator(".receipt.print-target")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(drawer).toBeInViewport();
  await drawer.getByRole("button", { name: "Đóng" }).click();
  await expect(drawer).toHaveCount(0);
});

const product = {
  id: "101",
  productId: "10",
  name: "RAM từ database",
  category: "ram",
  brand: "Kingston",
  sku: "RAM16",
  variant: "16GB DDR5",
  price: 1200000,
  originalPrice: 1300000,
  stock: 3,
  warranty: 36,
  status: "active",
  specs: { "Dung lượng": "16GB" },
  primarySpecs: ["Dung lượng"],
  filterSpecs: ["Dung lượng"],
  averageRating: 4.5,
  reviewCount: 2,
  buyerCount: 7,
};

async function backend(
  page,
  { quantity = 0, stockError = false, failAdd = false } = {},
) {
  const calls = [];
  let currentQuantity = quantity;
  const cartItems = () =>
    currentQuantity
      ? [
          {
            cartItemId: 9001,
            productVariantId: 101,
            productName: product.name,
            variantName: product.variant,
            unitPrice: product.price,
            quantity: currentQuantity,
            subtotal: currentQuantity * product.price,
            stockQuantity: 3,
            available: true,
          },
        ]
      : [];
  const checkoutItems = () => cartItems();
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const payload = request.postData() ? request.postDataJSON() : null;
    calls.push({
      path,
      method: request.method(),
      payload,
      authorization: request.headers().authorization,
    });
    const respond = (json, status = 200) => route.fulfill({ status, json });
    if (path === "/api/products") return respond([product]);
    if (path === "/api/promotions") return respond([]);
    if (path === "/api/products/101/reviews")
      return respond([
        {
          id: "1",
          productId: "101",
          name: "Khách A",
          rating: 5,
          comment: "Sản phẩm tốt",
        },
        {
          id: "2",
          productId: "101",
          name: "Khách B",
          rating: 4,
          comment: "Đúng mô tả",
        },
      ]);
    if (path === "/api/auth/login")
      return respond({
        data: {
          accessToken: "live-test-token",
          user: {
            id: 42,
            fullName: "Khách kiểm thử",
            email: "buyer@example.com",
            phone: "0900000128",
            role: "Customer",
          },
        },
      });
    if (path === "/api/orders/cart" && request.method() === "GET")
      return respond({
        data: {
          cartId: 8,
          userId: 42,
          items: cartItems(),
          totalQuantity: currentQuantity,
          totalAmount: product.price * currentQuantity,
        },
      });
    if (path === "/api/orders/cart/items" && request.method() === "POST") {
      if (failAdd) return respond({ message: "Không đủ tồn kho." }, 400);
      currentQuantity += payload.quantity;
      return respond({ data: null });
    }
    if (path === "/api/orders/cart/items/9001") {
      currentQuantity = request.method() === "DELETE" ? 0 : payload.quantity;
      return respond({ data: null });
    }
    if (path === "/api/checkout/validate") {
      if (stockError)
        return respond({ message: "Không đủ tồn kho: RAM từ database" }, 400);
      return respond({
        cartId: 8,
        items: checkoutItems(),
        totalAmount: product.price * currentQuantity,
        valid: true,
      });
    }
    if (path === "/api/checkout/details/preview") {
      if (payload.promotionCode === "BAD")
        return respond({ message: "Mã voucher không tồn tại." }, 400);
      return respond({
        ...payload,
        cartId: 8,
        items: checkoutItems(),
        promotionCode: payload.promotionCode || null,
        totalAmount: product.price * currentQuantity,
        discountAmount: payload.promotionCode ? 100000 : 0,
        finalAmount:
          product.price * currentQuantity -
          (payload.promotionCode ? 100000 : 0),
      });
    }
    return respond({ message: "Unexpected API: " + path }, 500);
  });
  return calls;
}

async function login(page, destination = /cua-hang/) {
  await page.goto("/dang-nhap");
  await page.locator("#identity").fill("buyer@example.com");
  await page.locator("#password").fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(destination);
}

// ---- AI Build PC: /api/pc-build/requirements/analyze → /api/pc-build/builds/* ----
const buildLine = (category, id, name, price, qty = 1, maxQty = 1) => ({ category, id, name, price, qty, maxQty });

function analysisResult(overrides = {}) {
  return {
    status: "READY",
    message: "Shop đã hiểu yêu cầu: PC chơi game, ngân sách 25.000.000đ.",
    requirement: { budget: 25000000, purpose: "GAMING" },
    minBudget: 16000000,
    maxBuildPrice: 200000000,
    suggestedPurposes: [],
    explanation: "Với 25 triệu, máy chơi mượt game eSports ở 1080p.",
    suggestedBudget: null,
    notes: [],
    ...overrides,
  };
}

function buildResult(overrides = {}) {
  const items = overrides.items ?? [
    buildLine("CPU", 1, "AMD Ryzen 5 7600", 5000000),
    buildLine("RAM", 101, product.name, 1200000, 2, 4),
    buildLine("GPU", 4, "RX 9060 XT 16GB", 15000000),
    buildLine("PSU", 3, "Nguồn PF650", 1500000),
  ];
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const budget = overrides.budget ?? 25000000;
  return {
    status: "VALID",
    budget,
    purpose: "GAMING",
    total,
    difference: total - budget,
    items,
    violations: [],
    budgetWarning: null,
    message: "Dạ, Shop tư vấn cho bạn bộ PC chơi game gồm CPU AMD Ryzen 5 7600, .... Tổng giá là 23.900.000đ ạ.",
    ...overrides,
  };
}

/** Giả lập 5 API mới; mỗi API có thể thay bằng hàm (body, lần gọi) => response. Trả lại body đã gửi. */
async function builderPage(page, handlers = {}, { failAdd = false, signIn = false } = {}) {
  const calls = await backend(page, { failAdd });
  const sent = { analyze: [], auto: [], validate: [], replacements: [], save: [] };
  // Request đã bị AbortController hủy thì fulfill sẽ lỗi: bỏ qua
  const reply = (route, response) => route.fulfill(response).catch(() => {});
  const defaults = {
    analyze: () => ({ json: { data: analysisResult() } }),
    auto: () => ({ json: { data: buildResult() } }),
    validate: (body) => ({ json: { data: { ...buildResult(), message: null, purpose: null, items: body.items.map((i) => ({ ...buildResult().items.find((x) => x.id === i.variantId), qty: i.qty })) } } }),
    replacements: () => ({ json: { data: [] } }),
    save: () => ({ json: { data: { buildId: 55, status: "VALID", total: 23900000, difference: -1100000 } } }),
  };
  const routes = {
    analyze: "**/api/pc-build/requirements/analyze",
    auto: "**/api/pc-build/builds/auto",
    validate: "**/api/pc-build/builds/validate",
    replacements: "**/api/pc-build/builds/replacements",
    save: "**/api/pc-build/builds/save",
  };
  for (const [name, url] of Object.entries(routes)) {
    await page.route(url, async (route) => {
      const body = route.request().postDataJSON();
      sent[name].push({ body, authorization: route.request().headers().authorization });
      await reply(route, await (handlers[name] ?? defaults[name])(body, sent[name].length));
    });
  }
  if (signIn) await login(page);
  await page.goto("/build-pc");
  return { sent, calls };
}

async function suggestFrom(page, budget = "25000000", need = "Chơi game 1080p, stream nhẹ") {
  await page.locator("#inputBudget").fill(budget);
  await page.locator("#inputNeed").fill(need);
  await page.getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true }).click();
}

const addToCartButton = (page) => page.getByRole("button", { name: "Thêm vào giỏ & Đặt hàng", exact: true });
const saveButton = (page) => page.getByRole("button", { name: "Lưu cấu hình vào tài khoản", exact: true });
const partRows = (page) => page.locator(".builder-table tbody.pc-parts tr:not(.slot-empty)");

for (const failAdd of [false, true]) {
  test(`AI Build PC: analyze READY → auto, shows the explanation and uses the server cart, add failure=${failAdd}`, async ({
    page,
  }) => {
    // Giỏ hàng giả lập chỉ mô phỏng món 101, nên bộ PC ở ca này chỉ có 2 thanh RAM 101
    const ramOnly = buildResult({ items: [buildLine("RAM", 101, product.name, 1200000, 2, 4)] });
    const { sent, calls } = await builderPage(
      page,
      { auto: () => ({ json: { data: ramOnly } }) },
      { failAdd, signIn: true },
    );
    await suggestFrom(page);
    await expect(page.locator("#analysisPanel")).toContainText("Shop đã hiểu nhu cầu của bạn");
    await expect(page.locator("#analysisPanel")).toContainText("Với 25 triệu");
    await expect(page.locator("#aiBuildReasoning")).toContainText("Dạ, Shop tư vấn cho bạn bộ PC chơi game");
    await expect(partRows(page)).toHaveCount(1);
    await expect(page.locator("#buildTotal")).toContainText("2.400.000");
    await expect(page.locator(".summary-card")).toContainText("TƯƠNG THÍCH");
    expect(sent.analyze.map((c) => c.body)).toEqual([{ budget: 25000000, message: "Chơi game 1080p, stream nhẹ" }]);
    expect(sent.auto.map((c) => c.body)).toEqual([{ budget: 25000000, purpose: "GAMING" }]);

    await addToCartButton(page).click();
    if (failAdd) {
      await expect(page.getByRole("alert").filter({ hasText: "Không đủ tồn kho" })).toBeVisible();
      await expect(page).toHaveURL(/build-pc/);
    } else {
      await expect(page).toHaveURL(/gio-hang/);
      await expect(page.getByRole("spinbutton", { name: /Số lượng RAM/ })).toHaveValue("2");
      const sets = await page.evaluate(() => JSON.parse(localStorage.getItem("techzone_pc_build_sets") || "[]"));
      expect(sets).toHaveLength(1);
      expect(sets[0]).toMatchObject({ budget: 25000000, itemVariantIds: ["101"] });
    }
    expect(calls.filter((call) => call.path === "/api/orders/cart/items")).toMatchObject([
      { method: "POST", payload: { productVariantId: 101, quantity: 2 } },
    ]);
    expect(await page.evaluate(() => localStorage.getItem("techzone-demo-v1"))).toBeNull();
  });
}

test("AI Build PC: NEED_CLARIFICATION shows the question, focuses the need box and never calls /builds/auto", async ({
  page,
}) => {
  const { sent } = await builderPage(page, {
    analyze: () => ({
      json: {
        data: analysisResult({
          status: "NEED_CLARIFICATION",
          message: "Bạn dùng máy chủ yếu để chơi game, làm đồ họa hay làm văn phòng ạ?",
          requirement: { budget: 25000000, purpose: null },
          explanation: null,
        }),
      },
    }),
  });
  await suggestFrom(page, "25000000", "máy tốt");
  await expect(page.locator("#analysisPanel")).toContainText("Bạn dùng máy chủ yếu để chơi game");
  await expect(page.locator("#inputNeed")).toBeFocused();
  await expect(page.locator(".builder-table")).toHaveCount(0);
  expect(sent.auto).toHaveLength(0);
});

test("AI Build PC: BUDGET_TOO_LOW offers cheaper purposes and builds with the chosen one", async ({ page }) => {
  const { sent } = await builderPage(page, {
    analyze: () => ({
      json: {
        data: analysisResult({
          status: "BUDGET_TOO_LOW",
          message: "Mức nhu cầu tối thiểu cho PC chơi game là 16.000.000đ. Với 13.000.000đ, bạn có thể thử PC văn phòng, bạn có đồng ý không ạ?",
          requirement: { budget: 13000000, purpose: "GAMING" },
          explanation: null,
          suggestedPurposes: [
            { purpose: "OFFICE", label: "PC văn phòng", description: "Văn phòng, học tập", minBudget: 12500000 },
          ],
        }),
      },
    }),
    auto: (body) => ({
      json: { data: buildResult({ budget: body.budget, purpose: body.purpose, items: [buildLine("CPU", 1, "Core i3-12100", 2500000)] }) },
    }),
  });
  await suggestFrom(page, "13000000", "chơi game AAA");
  await expect(page.locator("#analysisPanel")).toContainText("Ngân sách chưa đủ cho nhu cầu này");
  expect(sent.auto).toHaveLength(0);
  await page.getByRole("button", { name: /Build PC văn phòng/ }).click();
  await expect(partRows(page)).toHaveCount(1);
  expect(sent.auto.map((c) => c.body)).toEqual([{ budget: 13000000, purpose: "OFFICE" }]);
  // Slot thiếu (ví dụ GPU) hiện dòng trống để chọn thêm
  await expect(page.getByRole("button", { name: "Chọn Card đồ họa" })).toBeVisible();
});

test("AI Build PC: AI_UNAVAILABLE hides the build, locks retry for Retry-After and resends the same analyze", async ({
  page,
}) => {
  const { sent } = await builderPage(page, {
    analyze: (body, count) =>
      count === 2
        ? {
            status: 503,
            // Backend expose Retry-After qua CORS (SecurityConfig); mock cũng phải expose thì trình duyệt mới cho đọc
            headers: { "Retry-After": "2", "Access-Control-Expose-Headers": "Retry-After" },
            json: { status: 503, message: "Trợ lý AI tạm thời không phản hồi: TIMEOUT", code: "AI_UNAVAILABLE" },
          }
        : { json: { data: analysisResult() } },
  });
  await suggestFrom(page);
  await expect(partRows(page)).toHaveCount(4);
  await suggestFrom(page, "25000000", "Chơi game 2K");
  const box = page.locator("#aiErrorBox");
  await expect(box).toContainText("Trợ lý AI đang bận");
  await expect(page.locator(".builder-table")).toHaveCount(0);
  await expect(box.getByRole("button", { name: /Thử lại sau/ })).toBeDisabled();
  await expect(box.getByRole("button", { name: "Thử lại", exact: true })).toBeEnabled({ timeout: 5000 });
  await box.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(partRows(page)).toHaveCount(4);
  expect(sent.analyze.map((c) => c.body.message)).toEqual(["Chơi game 1080p, stream nhẹ", "Chơi game 2K", "Chơi game 2K"]);
});

test("AI Build PC: double-click on Đề xuất sends one analyze and one auto", async ({ page }) => {
  const { sent } = await builderPage(page, {
    analyze: async () => {
      await wait(400);
      return { json: { data: analysisResult() } };
    },
  });
  await page.locator("#inputBudget").fill("25000000");
  await page.locator("#inputNeed").fill("Chơi game");
  await page.getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true }).dblclick();
  await expect(partRows(page)).toHaveCount(4);
  expect(sent.analyze).toHaveLength(1);
  expect(sent.auto).toHaveLength(1);
});

test("AI Build PC: quantity edit revalidates; OVER_BUDGET needs the 409 popup before saving", async ({ page }) => {
  const { sent } = await builderPage(
    page,
    {
      validate: (body) => {
        const items = buildResult().items.map((item) => ({ ...item, qty: body.items.find((i) => i.variantId === item.id).qty }));
        const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        return {
          json: {
            data: buildResult({
              status: "OVER_BUDGET",
              items,
              total,
              difference: total - 25000000,
              message: null,
              purpose: null,
              budgetWarning: "Vượt ngân sách 100.000đ (tổng 25.100.000đ / ngân sách 25.000.000đ)",
            }),
          },
        };
      },
      save: (body, count) =>
        count === 1
          ? {
              status: 409,
              json: {
                status: 409,
                code: "OVER_BUDGET_NOT_CONFIRMED",
                message: "Bộ PC hiện tại đã vượt quá ngân sách 100.000đ (tổng 25.100.000đ, ngân sách 25.000.000đ). Bạn có muốn tiếp tục?",
                data: { budget: 25000000, total: 25100000, difference: 100000 },
              },
            }
          : { json: { data: { buildId: 55, status: "OVER_BUDGET", total: 25100000, difference: 100000 } } },
    },
    { signIn: true },
  );
  await suggestFrom(page);
  await page.getByRole("button", { name: "Tăng số lượng RAM" }).click();
  await expect(page.locator("#budgetWarning")).toContainText("Vượt ngân sách 100.000đ");
  await expect(page.locator(".summary-card")).toContainText("VƯỢT NGÂN SÁCH");
  expect(sent.validate.at(-1).body).toEqual({
    budget: 25000000,
    items: [
      { variantId: 1, qty: 1 },
      { variantId: 101, qty: 3 },
      { variantId: 4, qty: 1 },
      { variantId: 3, qty: 1 },
    ],
  });
  // Lời giải thích AI giữ lại nhưng có ghi chú đã đổi món
  await expect(page.locator("#aiEditedNote")).toBeVisible();

  await saveButton(page).click();
  const dialog = page.getByRole("dialog", { name: "Cấu hình vượt ngân sách" });
  await expect(dialog).toContainText("Bạn có muốn tiếp tục?");
  await dialog.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.getByRole("button", { name: "✓ Đã lưu cấu hình #55" })).toBeVisible();
  expect(sent.save.map((c) => c.body.confirmOverBudget)).toEqual([undefined, true]);
  expect(sent.save[0].authorization).toBe("Bearer live-test-token");
  expect(sent.save[1].body.items).toEqual(sent.validate.at(-1).body.items);
});

test("AI Build PC: save 422 BUILD_INCOMPATIBLE lists the violations and does not claim success", async ({ page }) => {
  await builderPage(
    page,
    {
      save: () => ({
        status: 422,
        json: {
          status: 422,
          code: "BUILD_INCOMPATIBLE",
          message: "Bộ PC có linh kiện không tương thích",
          data: { violations: [{ rule: "RULE_1", message: "Socket CPU không khớp bo mạch chủ" }] },
        },
      }),
    },
    { signIn: true },
  );
  await suggestFrom(page);
  await saveButton(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "Socket CPU không khớp bo mạch chủ" })).toBeVisible();
  await expect(saveButton(page)).toBeVisible();
});

test("AI Build PC: replacement dropdown shows only server options and choosing one revalidates", async ({ page }) => {
  const { sent } = await builderPage(page, {
    replacements: () => ({
      json: {
        data: [
          { id: 4, name: "RX 9060 XT 16GB", brand: "AMD", price: 15000000, qty: 1, maxQty: 1, current: true },
          { id: 8, name: "RTX 5060 Ti 16GB", brand: "NVIDIA", price: 16000000, qty: 1, maxQty: 2, current: false },
        ],
      },
    }),
  });
  await suggestFrom(page);
  await page.getByRole("button", { name: "Đổi Card đồ họa" }).click();
  const dialog = page.getByRole("dialog", { name: "Đổi Card đồ họa" });
  await expect(dialog.locator(".replacement-item")).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: "Đang dùng" })).toBeDisabled();
  await expect(dialog).toContainText("+1.000.000");
  expect(sent.replacements[0].body).toEqual({
    category: "GPU",
    items: [
      { variantId: 1, qty: 1 },
      { variantId: 101, qty: 2 },
      { variantId: 4, qty: 1 },
      { variantId: 3, qty: 1 },
    ],
  });
  await dialog.getByRole("button", { name: "Chọn linh kiện" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".builder-table")).toContainText("RTX 5060 Ti 16GB");
  await expect.poll(() => sent.validate.length).toBe(1);
  expect(sent.validate[0].body.items).toContainEqual({ variantId: 8, qty: 1 });
});

test("AI Build PC: editing a cart set reloads it through /validate, including sets saved by the old builder", async ({
  page,
}) => {
  const { sent } = await builderPage(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "techzone_pc_build_sets",
      JSON.stringify([
        { id: "set_new", name: "Bộ mới", budget: 25000000, itemVariantIds: ["1", "101"], parts: [{ id: 1, qty: 1 }, { id: 101, qty: 2 }] },
        { id: "set_old", name: "Bộ cũ", itemVariantIds: ["4"], parts: [{ role: "gpu", variantId: 4, quantity: 1, unitPrice: 15000000 }] },
      ]),
    ),
  );
  await page.goto("/build-pc?editBuildId=set_new");
  await expect(partRows(page)).toHaveCount(2);
  expect(sent.validate.at(-1).body).toEqual({ budget: 25000000, items: [{ variantId: 1, qty: 1 }, { variantId: 101, qty: 2 }] });
  await page.goto("/build-pc?editBuildId=set_old");
  await expect(partRows(page)).toHaveCount(1);
  expect(sent.validate.at(-1).body).toEqual({ budget: 15000000, items: [{ variantId: 4, qty: 1 }] });
  expect(sent.analyze).toHaveLength(0);
});

test("AI Build PC: a guest who saves is sent to login and gets the same build back", async ({ page }) => {
  const { sent } = await builderPage(page);
  await suggestFrom(page);
  await saveButton(page).click();
  await expect(page).toHaveURL(/dang-nhap/);
  await page.locator("#identity").fill("buyer@example.com");
  await page.locator("#password").fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/build-pc/);
  await expect(partRows(page)).toHaveCount(4);
  await expect(page.locator("#aiBuildReasoning")).toContainText("Dạ, Shop tư vấn");
  expect(sent.analyze).toHaveLength(1); // khôi phục, không gọi lại AI
  await saveButton(page).click();
  await expect(page.getByRole("button", { name: "✓ Đã lưu cấu hình #55" })).toBeVisible();
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("product cards and details show average stars and distinct buyer counts on mobile", async ({
  page,
}) => {
  await backend(page);
  const unrated = {
    ...product,
    id: "102",
    variant: "32GB DDR5",
    averageRating: 0,
    reviewCount: 0,
    buyerCount: 1,
  };
  await page.route("**/api/products", (route) =>
    route.fulfill({ json: [product, unrated] }),
  );
  await page.route("**/api/products/102/reviews", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/san-pham");
  const cards = page.locator(".product-card");
  await expect(
    cards.first().getByLabel("4,5 trên 5 sao, 2 đánh giá"),
  ).toBeVisible();
  await expect(cards.first()).toContainText("7 người đã mua");
  await expect(cards.nth(1)).toContainText("Chưa có đánh giá");
  await expect(cards.nth(1)).toContainText("1 người đã mua");
  await cards
    .first()
    .getByRole("link", { name: "Xem chi tiết", exact: true })
    .click();
  await expect(page.locator(".product-detail")).toContainText("4,5/5");
  await expect(page.locator(".product-detail")).toContainText("7 người đã mua");
  await page.getByRole("button", { name: "Đánh giá (2)", exact: true }).click();
  await expect(page.getByText("Sản phẩm tốt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /32GB DDR5/ }).click();
  await expect(page).toHaveURL(/san-pham\/102/);
  await expect(page.locator(".product-detail")).toContainText(
    "Chưa có đánh giá",
  );
  await expect(page.locator(".product-detail")).toContainText("1 người đã mua");
  await expect(
    page.locator(".product-detail .product-feedback-stars"),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 2,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/product-feedback-mobile.png",
    fullPage: true,
  });
});

test("reviews and product cards refresh together during SPA navigation and on focus", async ({
  page,
}) => {
  await backend(page);
  let summary = { averageRating: 0, reviewCount: 0, buyerCount: 0 };
  await page.route("**/api/products", (route) =>
    route.fulfill({ json: [{ ...product, ...summary }] }),
  );
  await page.route("**/api/products/101/reviews", (route) =>
    route.fulfill({
      json: [
        {
          id: "1",
          productId: "101",
          name: "Khách mới",
          rating: 5,
          comment: "Review vừa được gửi",
        },
      ],
    }),
  );
  await page.goto("/san-pham");
  await expect(page.locator(".product-card")).toContainText("Chưa có đánh giá");
  await expect(page.locator(".product-card")).toContainText("0 người đã mua");

  // Another browser completes a purchase/review after the catalogue was first loaded.
  summary = { averageRating: 5, reviewCount: 1, buyerCount: 1 };
  await page.getByRole("link", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.locator(".product-detail")).toContainText("5,0/5");
  await expect(page.locator(".product-detail")).toContainText("1 người đã mua");
  await page.getByRole("button", { name: "Đánh giá (1)", exact: true }).click();
  await expect(
    page.getByText("Review vừa được gửi", { exact: true }),
  ).toBeVisible();

  summary = { averageRating: 4.5, reviewCount: 2, buyerCount: 2 };
  await page
    .getByRole("navigation", { name: "Cửa hàng" })
    .getByRole("link", { name: "Danh mục sản phẩm" })
    .click();
  await expect(page.locator(".product-card")).toContainText("4,5/5");
  await expect(page.locator(".product-card")).toContainText("(2 đánh giá)");
  await expect(page.locator(".product-card")).toContainText("2 người đã mua");

  summary = { averageRating: 4, reviewCount: 2, buyerCount: 2 };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".product-card")).toContainText("4,0/5");
  await expect(page.locator(".product-card")).toContainText("2 người đã mua");
});

test("catalog, add, update by cartItemId, reload and remove use live APIs", async ({
  page,
}) => {
  const calls = await backend(page);
  await login(page);
  await page.goto("/san-pham/101");
  await expect(
    page.getByRole("heading", { name: product.name, exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page).toHaveURL(/gio-hang/);
  await page
    .getByRole("button", { name: "Tăng Số lượng " + product.name })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "Số lượng " + product.name }),
  ).toHaveValue("2");
  expect(
    calls.some(
      (call) =>
        call.path.endsWith("/items/9001") &&
        call.method === "PUT" &&
        call.payload.quantity === 2,
    ),
  ).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "Số lượng " + product.name }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await expect(
    page.getByText("Giỏ hàng đang trống", { exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (call) => call.path.endsWith("/items") && call.method === "POST",
    ),
  ).toMatchObject({
    payload: { productVariantId: 101, quantity: 1 },
    authorization: "Bearer live-test-token",
  });
  expect(
    await page.evaluate(() => localStorage.getItem("techzone-demo-v1")),
  ).toBeNull();
});

test("guest add redirects to login, failed buy stays on product", async ({
  page,
}) => {
  await backend(page, { failAdd: true });
  await page.goto("/san-pham/101");
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page).toHaveURL(/dang-nhap/);
  await login(page, /san-pham\/101/);
  await page.goto("/san-pham/101");
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page.getByRole("alert")).toContainText("Không đủ tồn kho");
  await expect(page).toHaveURL(/san-pham\/101/);
});

test("checkout validates, previews voucher, invalidates edits and never creates demo orders", async ({
  page,
}) => {
  const calls = await backend(page, { quantity: 2 });
  await login(page);
  await page.goto("/thanh-toan");
  await page.getByRole("textbox", { name: "Mã giảm giá" }).fill("SAVE");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(
    page.getByText("Thông tin nhận hàng hợp lệ.", { exact: false }),
  ).toBeVisible();
  expect(
    calls.filter((call) => call.path === "/api/checkout/details/preview").at(-1)
      .payload,
  ).toMatchObject({
    pickupName: "Khách kiểm thử",
    pickupPhone: "0900000128",
    promotionCode: "SAVE",
  });
  await expect(
    page.getByRole("button", { name: "Xác nhận đặt hàng →", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Họ tên người nhận" })
    .fill("Người nhận khác");
  await expect(
    page.getByText("Thông tin nhận hàng hợp lệ.", { exact: false }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xác nhận đặt hàng →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "Mã giảm giá" }).fill("BAD");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(
    page.getByText("Mã voucher không tồn tại.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Mã giảm giá" }).fill("SAVE");
  await page
    .getByRole("button", { name: "Kiểm tra thông tin & voucher" })
    .click();
  await expect(
    page.getByText("Thông tin nhận hàng hợp lệ.", { exact: false }),
  ).toBeVisible();
  await expect(page).toHaveURL(/thanh-toan/);
  expect(
    calls.some((call) => call.path === "/api/checkout/validate"),
  ).toBeTruthy();
  expect(
    calls.some((call) => call.path === "/api/orders" && call.method === "POST"),
  ).toBeFalsy();
});

test("stock changes block checkout and show the backend error", async ({
  page,
}) => {
  const calls = await backend(page, { quantity: 2, stockError: true });
  await login(page);
  await page.goto("/thanh-toan");
  await expect(
    page.getByText("Không đủ tồn kho: RAM từ database", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Kiểm tra thông tin & voucher" })
    .click();
  expect(
    calls.some((call) => call.path === "/api/checkout/details/preview"),
  ).toBeFalsy();
});

test("an uncertain order can be retried after reload with its original key and payload", async ({
  page,
}) => {
  await backend(page, { quantity: 2 });
  const submissions = [];
  const order = {
    id: 88,
    orderCode: "TZ-RECOVERY",
    userId: 42,
    status: "pending",
    pickupName: "Khách kiểm thử",
    pickupPhone: "0900000128",
    note: "",
    totalAmount: 2400000,
    discountAmount: 0,
    finalAmount: 2400000,
    paymentStatus: "PENDING",
    methodType: "cash",
    createdAt: "2026-10-23T10:00:00",
    items: [
      {
        id: 501,
        productVariantId: 101,
        productName: "RAM snapshot",
        quantity: 2,
        unitPrice: 1200000,
        warrantyPeriodMonths: 36,
      },
    ],
  };
  await page.route("**/api/orders", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submissions.push({
      key: route.request().headers()["idempotency-key"],
      payload: route.request().postDataJSON(),
    });
    if (submissions.length === 1) return route.abort("connectionreset");
    return route.fulfill({ status: 201, json: order });
  });
  await page.route("**/api/orders/TZ-RECOVERY", (route) =>
    route.fulfill({ json: order }),
  );
  await login(page);
  await page.goto("/thanh-toan");
  await page
    .getByRole("button", { name: "Kiểm tra thông tin & voucher" })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đặt hàng →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kiểm tra kết quả đặt hàng" }),
  ).toBeVisible();
  // The server may already have committed and emptied the cart before the response was lost.
  await page.route("**/api/orders/cart", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Kiểm tra lại yêu cầu đặt hàng" })
    .click();
  await expect(page).toHaveURL(/don-hang\/TZ-RECOVERY/);
  expect(submissions).toHaveLength(2);
  expect(submissions[0].key).toMatch(/^[0-9a-f-]{36}$/);
  expect(submissions[1]).toEqual(submissions[0]);
  await expect
    .poll(() =>
      page.evaluate(() =>
        sessionStorage.getItem("techzone-checkout-attempt-42"),
      ),
    )
    .toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("techzone-demo-v1")),
  ).toBeNull();
});

test("a rejected order requires a fresh preview before another submission", async ({
  page,
}) => {
  await backend(page, { quantity: 2 });
  let submissions = 0;
  await page.route("**/api/orders", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submissions++;
    return route.fulfill({
      status: 400,
      json: { message: "Giá hoặc ưu đãi đã thay đổi." },
    });
  });
  await login(page);
  await page.goto("/thanh-toan");
  await page
    .getByRole("button", { name: "Kiểm tra thông tin & voucher" })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đặt hàng →", exact: true })
    .click();
  await expect(
    page.getByText("Giá hoặc ưu đãi đã thay đổi.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xác nhận đặt hàng →", exact: true }),
  ).toBeDisabled();
  expect(submissions).toBe(1);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("techzone-checkout-attempt-42"),
    ),
  ).toBeNull();
});

test("customer cancels a zero-total order using its snapshot even after the product disappears", async ({
  page,
}) => {
  await backend(page);
  const order = {
    id: 70,
    orderCode: "TZ-ZERO",
    userId: 42,
    status: "pending",
    pickupName: "Khách kiểm thử",
    pickupPhone: "0900000128",
    note: "",
    totalAmount: 1200000,
    discountAmount: 1200000,
    finalAmount: 0,
    paymentStatus: "SUCCESS",
    methodType: "cash",
    createdAt: "2026-10-23T10:00:00",
    items: [
      {
        id: 701,
        productVariantId: 999,
        productName: "Tên sản phẩm lúc mua",
        quantity: 1,
        unitPrice: 1200000,
        warrantyPeriodMonths: 0,
      },
    ],
  };
  let cancelCalls = 0;
  await page.route("**/api/orders/TZ-ZERO", (route) =>
    route.fulfill({ json: order }),
  );
  await page.route("**/api/orders/TZ-ZERO/cancel", (route) => {
    expect(route.request().method()).toBe("POST");
    cancelCalls++;
    order.status = "canceled";
    order.paymentStatus = "CANCELED";
    return route.fulfill({ json: order });
  });
  await login(page);
  await page.goto("/don-hang/TZ-ZERO");
  await expect(
    page.getByRole("heading", { name: "Tên sản phẩm lúc mua" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hủy đơn hàng", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận hủy", exact: true }).click();
  await expect(
    page.getByText("Đơn đã được hủy.", { exact: false }),
  ).toBeVisible();
  expect(cancelCalls).toBe(1);
});

test("staff hands over a paid order without warranty using an empty devices list", async ({
  page,
}) => {
  await backend(page);
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      json: {
        data: {
          accessToken: "staff-token",
          user: {
            id: 2,
            fullName: "Staff",
            email: "staff@example.com",
            role: "Staff",
          },
        },
      },
    }),
  );
  const order = {
    id: 71,
    orderCode: "TZ-NO-WARRANTY",
    userId: 42,
    status: "ready_for_pickup",
    pickupName: "Khách nhận",
    pickupPhone: "0900000128",
    totalAmount: 100000,
    discountAmount: 0,
    finalAmount: 100000,
    paymentStatus: "SUCCESS",
    methodType: "cash",
    createdAt: "2026-10-23T10:00:00",
    items: [
      {
        id: 711,
        productVariantId: 999,
        productName: "Phụ kiện không bảo hành",
        quantity: 1,
        unitPrice: 100000,
        warrantyPeriodMonths: 0,
      },
    ],
  };
  let handovers = 0;
  await page.route("**/api/operations/orders?*", (route) =>
    route.fulfill({ json: [order] }),
  );
  await page.route(
    "**/api/operations/orders/TZ-NO-WARRANTY/handover",
    (route) => {
      expect(route.request().postDataJSON()).toEqual({
        recipientPhone: "0900000128",
        recipientVerified: true,
        devices: [],
      });
      handovers++;
      order.status = "completed";
      return route.fulfill({ json: order });
    },
  );
  await login(page, /van-hanh\/don-hang/);
  await page.goto("/van-hanh/ban-giao?id=TZ-NO-WARRANTY");
  await expect(
    page.getByRole("heading", { name: /Serial từng thiết bị/ }),
  ).toContainText("0 thiết bị");
  await page
    .getByRole("textbox", { name: "Số điện thoại người đến nhận để đối chiếu" })
    .fill("0900000128");
  await page
    .getByRole("checkbox", {
      name: "Đã đối chiếu người nhận, serial và bàn giao đủ hàng.",
    })
    .check();
  await page
    .getByRole("button", { name: "Hoàn tất bàn giao", exact: true })
    .click();
  await expect(
    page.getByText("Đã bàn giao đơn hàng.", { exact: true }),
  ).toBeVisible();
  expect(handovers).toBe(1);
});

test("admin editor preserves drafts on refresh and resets fields when switching products and variants", async ({
  page,
}) => {
  test.setTimeout(60000);
  await backend(page);
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      json: {
        data: {
          accessToken: "admin-token",
          user: {
            id: 1,
            fullName: "Admin",
            email: "admin@example.com",
            role: "Admin",
          },
        },
      },
    }),
  );
  await page.route("**/api/operations/orders?*", (route) =>
    route.fulfill({ json: [] }),
  );
  const products = [10, 11].map((id, index) => ({
    id,
    name: index ? "RAM Beta" : "RAM Alpha",
    status: "DRAFT",
    brandId: 1,
    brandName: "Kingston",
    categoryId: 1,
    categoryName: "RAM",
    warrantyPeriodMonths: index ? 12 : 0,
    description: "Thông tin gốc",
    variants: [
      {
        id: id * 10 + 1,
        productId: id,
        serialCode: `SKU-${id}`,
        variantName: index ? "32GB" : "16GB",
        price: 1200000,
        originalPrice: 0,
        stockQuantity: index ? 7 : 0,
        attributes: [],
      },
    ],
  }));
  const updates = [];
  let listRequests = 0;
  await page.route("**/api/admin/**", (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (path === "/api/admin/brands")
      return route.fulfill({ json: [{ id: 1, name: "Kingston" }] });
    if (path === "/api/admin/categories")
      return route.fulfill({ json: [{ id: 1, name: "RAM", slug: "ram" }] });
    if (path === "/api/admin/products") {
      listRequests++;
      return route.fulfill({ json: products });
    }
    const match = path.match(
      /^\/api\/admin\/products\/(\d+)(?:\/variants\/(\d+))?$/,
    );
    if (match) {
      const selected = products.find((item) => item.id === Number(match[1]));
      if (request.method() === "PUT") {
        const payload = request.postDataJSON();
        if (match[2]) {
          const variant = selected.variants.find(
            (item) => item.id === Number(match[2]),
          );
          Object.assign(variant, payload);
          return route.fulfill({ json: variant });
        }
        updates.push(payload);
        Object.assign(selected, payload);
      }
      return route.fulfill({ json: selected });
    }
    return route.fulfill({ status: 404, json: { message: path } });
  });
  await login(page, /van-hanh\/don-hang/);
  await page.goto("/quan-tri/san-pham");
  await page
    .getByRole("row")
    .filter({ hasText: "RAM Alpha" })
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .click();
  const name = page.getByRole("textbox", {
    name: "Tên sản phẩm *",
    exact: true,
  });
  await expect(name).toHaveValue("RAM Alpha");
  await expect(
    page.getByRole("spinbutton", {
      name: "Thời hạn bảo hành (tháng) *",
      exact: true,
    }),
  ).toHaveValue("0");
  await name.fill("Tên đang sửa chưa lưu");
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("textbox", {
      name: "Mã SKU (serial_code) *",
      exact: true,
    }),
  ).toHaveValue("SKU-10");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng tồn kho *", exact: true }),
  ).toHaveValue("0");
  await dialog
    .getByRole("textbox", { name: "Tên phiên bản *", exact: true })
    .fill("16GB đã sửa");
  await dialog
    .getByRole("button", { name: "Lưu thay đổi", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => listRequests).toBeGreaterThan(1);
  await expect(name).toHaveValue("Tên đang sửa chưa lưu");
  await page
    .getByRole("button", { name: "+ Thêm biến thể", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("textbox", {
      name: "Mã SKU (serial_code) *",
      exact: true,
    }),
  ).toHaveValue("");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng tồn kho *", exact: true }),
  ).toHaveValue("10");
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  await expect.poll(() => updates.length).toBe(1);
  expect(updates[0]).toMatchObject({
    name: "Tên đang sửa chưa lưu",
    warrantyPeriodMonths: 0,
  });
  await page
    .getByRole("button", { name: "← Quay lại danh sách", exact: true })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "RAM Beta" })
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .click();
  await expect(name).toHaveValue("RAM Beta");
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("textbox", {
      name: "Mã SKU (serial_code) *",
      exact: true,
    }),
  ).toHaveValue("SKU-11");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng tồn kho *", exact: true }),
  ).toHaveValue("7");
});

test("logout clears the live cart and a catalogue failure offers retry", async ({
  page,
}) => {
  await backend(page, { quantity: 2 });
  await login(page);
  await page.goto("/tai-khoan");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/gio-hang");
  await expect(
    page.getByText("Đăng nhập để xem giỏ hàng", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".header-action").filter({ hasText: "Giỏ hàng" }),
  ).toContainText("Giỏ hàng · 0");
  await page.route("**/api/products", (route) =>
    route.fulfill({ status: 500, json: { message: "Catalog offline" } }),
  );
  await page.goto("/san-pham");
  await expect(
    page.getByText("Không tải được sản phẩm: Catalog offline", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tải lại sản phẩm" }),
  ).toBeVisible();
});
