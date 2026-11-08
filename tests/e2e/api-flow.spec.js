import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";

test("completed orders open a star review dialog with three photos and one video", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "review-customer-test");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 42, name: "Khách test", role: "Customer" }));
  });
  const orders = ["pending", "confirmed", "preparing", "ready_for_pickup", "completed", "canceled"].map((status, index) => ({
    id: index+1, orderCode: `TZ-REVIEW-${status}`, userId: 42, status,
    pickupName: "Khách test", pickupPhone: "0900000128", note: "", totalAmount: 1299000,
    discountAmount: 0, finalAmount: 1299000, paymentStatus: "SUCCESS", methodType: "cash",
    createdAt: "2026-11-08T10:00:00", items: [{ id: index+101, productVariantId: 101,
      productName: "Laptop kiểm thử", quantity: 1, unitPrice: 1299000, warrantyPeriodMonths: 12 }],
  }));
  orders.push({ ...orders[4], id: 20, orderCode: "TZ-REVIEW-already", items: [{ ...orders[4].items[0], id: 120, rating: 5, reviewComment: "Đã nhận xét" }] });
  let submitted;
  const savedMedia = [{ id: 1, mediaType: "image", url: "/api/review-media/1" }, { id: 2, mediaType: "video", url: "/api/review-media/2" }];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/orders") return route.fulfill({ json: orders });
    if (path === "/api/order-items/105/review") {
      if (route.request().method() === "PUT") { submitted = route.request().postData(); orders[4].items[0].rating = 4; orders[4].items[0].reviewComment = "Máy chạy tốt, đóng gói cẩn thận."; return route.fulfill({ status: 204 }); }
      return route.fulfill({ json: submitted ? { rating: 4, comment: orders[4].items[0].reviewComment, media: savedMedia, reviewed: true } : { rating: 5, comment: "", media: [], reviewed: false } });
    }
    if (path === "/api/products") return route.fulfill({ json: [product] });
    if (path === "/api/products/101/reviews") return route.fulfill({ json: [{ id: "77", productId: "101", name: "Khách test", rating: 4, comment: "Máy chạy tốt, đóng gói cẩn thận." }] });
    if (path === "/api/reviews/77/media") return route.fulfill({ json: savedMedia });
    if (path === "/api/review-media/1") return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6kUAAAAASUVORK5CYII=", "base64") });
    if (path === "/api/review-media/2") return route.fulfill({ contentType: "video/mp4", body: Buffer.from([0,0,0,12,102,116,121,112,105,115,111,109]) });
    if (path.startsWith("/api/orders/TZ-REVIEW-")) return route.fulfill({ json: orders.find((order) => path === `/api/orders/${order.orderCode}`) });
    if (path === "/api/orders/cart") return route.fulfill({ json: { data: { items: [], totalAmount: 0 } } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/don-hang");
  const shortcut = page.getByRole("button", { name: "Đánh giá", exact: true });
  await expect(shortcut).toHaveCount(1);
  await shortcut.click();
  const dialog = page.getByRole("dialog", { name: "Đánh giá sản phẩm", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/don-hang$/);
  await dialog.getByRole("radio", { name: "4 sao", exact: true }).check();
  await dialog.getByRole("textbox", { name: "Nhận xét", exact: true }).fill("Máy chạy tốt, đóng gói cẩn thận.");
  const photo = (name) => ({ name, mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6kUAAAAASUVORK5CYII=", "base64") });
  await dialog.getByLabel("Thêm ảnh đánh giá", { exact: true }).setInputFiles([photo("a.png"),photo("b.png"),photo("c.png"),photo("d.png")]);
  await expect(dialog).toContainText("Mỗi sản phẩm được đính kèm tối đa 3 ảnh và 1 video.");
  await expect(dialog.locator(".review-media-preview")).toHaveCount(0);
  await dialog.getByLabel("Thêm ảnh đánh giá", { exact: true }).setInputFiles([photo("a.png"),photo("b.png"),photo("c.png")]);
  await dialog.getByLabel("Thêm video đánh giá", { exact: true }).setInputFiles({ name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from([0,0,0,12,102,116,121,112,105,115,111,109]) });
  await expect(dialog.locator(".review-media-preview")).toHaveCount(4);
  await expect(dialog.getByLabel("Thêm ảnh đánh giá", { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Thêm video đánh giá", { exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Xóa tệp c.png", exact: true }).click();
  await expect(dialog.locator(".review-media-preview")).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/review-modal-mobile.png", fullPage: true });
  await dialog.getByRole("button", { name: "Lưu đánh giá", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(submitted).toContain('"rating":4');
  expect(submitted).toContain('filename="a.png"');
  expect(submitted).toContain('filename="clip.mp4"');
  await expect(shortcut).toHaveCount(0);
  await page.reload();
  await expect(shortcut).toHaveCount(0);
  await expect(page.getByText("Đã đánh giá", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Xem đánh giá", exact: true }).first().click();
  const viewer = page.getByRole("dialog", { name: "Đánh giá đã gửi", exact: true });
  await expect(viewer.getByRole("img", { name: "4 trên 5 sao", exact: true })).toBeVisible();
  await expect(viewer).toContainText("Máy chạy tốt, đóng gói cẩn thận.");
  await expect(viewer.getByRole("img", { name: "Ảnh đánh giá 1", exact: true })).toBeVisible();
  await expect.poll(() => viewer.getByRole("img", { name: "Ảnh đánh giá 1", exact: true }).evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(viewer.getByLabel("Video đánh giá", { exact: true })).toHaveAttribute("controls", "");
  await expect(viewer.getByRole("textbox")).toHaveCount(0);
  await expect(viewer.locator('input[type="file"],input[type="radio"]')).toHaveCount(0);
  await expect(viewer.getByRole("button", { name: "Lưu đánh giá", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "test-results/review-viewer-mobile.png", fullPage: true });
  await viewer.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.goto("/don-hang/TZ-REVIEW-completed");
  await expect(page.getByText("Đã đánh giá", { exact: true })).toBeVisible();
  await expect(shortcut).toHaveCount(0);
  await page.getByRole("button", { name: "Xem đánh giá", exact: true }).click();
  await expect(viewer.getByRole("img", { name: "Ảnh đánh giá 1", exact: true })).toBeVisible();
  await viewer.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.goto("/san-pham/101");
  await page.getByRole("button", { name: "Đánh giá (1)", exact: true }).click();
  await expect(page.getByRole("img", { name: "Ảnh đánh giá 1", exact: true })).toBeVisible();
  await expect(page.getByLabel("Video đánh giá", { exact: true })).toHaveAttribute("controls", "");
  await page.screenshot({ path: "test-results/product-review-media-mobile.png", fullPage: true });
  await page.goto("/don-hang/TZ-REVIEW-ready_for_pickup#order-reviews");
  await expect(page.getByRole("button", { name: "Đánh giá", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Đánh giá sản phẩm đã nhận", exact: true })).toHaveCount(0);
});

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

// ---- PC Builder (DD 13.5) ----
const builderProfile = {
  profileVersion: 1,
  source: "AI",
  summary: "Chơi game 2K, thỉnh thoảng stream",
  archetype: "GAMING",
  roleWeights: { gpu: 0.4, cpu: 0.2 },
  requiredRoles: [],
  excludedRoles: [],
  constraints: [
    {
      id: "c1",
      role: "gpu",
      spec: "VRAM_GB",
      op: "GTE",
      value: 12,
      priority: 2,
      reason: "Game 2K cần VRAM lớn",
      label: "VRAM ≥ 12 GB",
      satisfied: true,
    },
    {
      id: "c2",
      role: "case",
      spec: "Color",
      op: "IN",
      values: ["WHITE"],
      priority: 1,
      reason: "Khách thích case trắng",
      label: "Màu vỏ: Trắng",
      satisfied: true,
    },
  ],
  metrics: [
    {
      id: "m1",
      metric: "TOTAL_RAM_GB",
      op: "GTE",
      value: 32,
      priority: 3,
      reason: "Stream cần nhiều RAM",
      label: "Tổng RAM ≥ 32 GB",
      satisfied: true,
    },
  ],
  preferences: [],
  unmetNeeds: [],
  droppedItems: [],
  confidence: 0.9,
};

const builderOptions = {
  minBudget: 8000000,
  floorPrice: 6969000,
  maxBudget: 9999999999,
  dictionaryVersion: "t1",
  dictionary: {
    roles: {
      gpu: {
        label: "Card đồ họa",
        specs: { VRAM_GB: { type: "INT", unit: "GB", min: 4, max: 96 } },
      },
    },
    metrics: {
      TOTAL_RAM_GB: { label: "Tổng RAM", unit: "GB", min: 8, max: 2048 },
    },
  },
  examples: ["Chơi game 2K, thỉnh thoảng stream"],
  tiers: [],
};

const builderCapacity = {
  ramSlotsUsed: 2,
  ramSlotsMax: 4,
  ramGb: 32,
  ramMaxGb: 128,
  m2Used: 1,
  m2Max: 2,
  gpuCount: 1,
  gpuMax: 1,
};

const part = (role, variantId, productName, unitPrice, quantity = 1) => ({
  role,
  variantId,
  productName,
  variantName: "Tiêu chuẩn",
  unitPrice,
  quantity,
  subtotal: unitPrice * quantity,
  specs: {},
});

function suggestion(overrides = {}) {
  return {
    buildId: null,
    buildName: "Máy chơi game 2K",
    purpose: "Chơi game 2K",
    budget: 30000000,
    totalPrice: 29500000,
    aiReasoning: "Cân đối CPU và GPU cho 2K",
    performanceHighlight: "2K mượt",
    isCompatible: true,
    checks: [
      {
        key: "R1",
        label: "CPU ↔ Bo mạch chủ (Socket)",
        status: "pass",
        detail: "AM5 = AM5",
        valid: true,
      },
    ],
    items: [
      part("cpu", 1, "AMD Ryzen 5 7600", 5000000),
      part("ram", 2, "RAM DDR5 16GB", 1500000, 2),
      part("psu", 3, "Nguồn PF650", 1500000),
      part("gpu", 4, "RX 9060 XT 16GB", 20000000),
    ],
    reasonCode: null,
    budgetFit: {
      ratio: 0.9833,
      percent: 98.3,
      status: "IN_WINDOW",
      windowMin: 27000000,
      windowMax: 30000000,
      leftover: 500000,
    },
    profile: builderProfile,
    relaxedItems: [],
    warnings: [],
    capacity: builderCapacity,
    requiredPsuW: 450,
    ...overrides,
  };
}

function validated(label, overrides = {}) {
  return {
    isCompatible: true,
    hasWarnings: false,
    hasUnknown: false,
    totalPrice: 29500000,
    budgetFit: suggestion().budgetFit,
    checks: [{ key: "R1", label, status: "pass", detail: "" }],
    requiredPsuW: 450,
    capacity: builderCapacity,
    items: [],
    ...overrides,
  };
}

/** Mock các endpoint pc-build; trả về request body đã nhận để kiểm tra. */
async function builderPage(page, { suggest, validate, replacements } = {}) {
  await backend(page);
  const requests = { suggest: [], validate: [] };
  // Request đã bị AbortController hủy thì fulfill sẽ lỗi: bỏ qua
  const reply = (route, response) => route.fulfill(response).catch(() => {});
  await page.route("**/api/v1/pc-build/options", (route) =>
    reply(route, { json: { data: builderOptions } }),
  );
  await page.route("**/api/v1/pc-build/ai-suggest", async (route) => {
    const body = route.request().postDataJSON();
    requests.suggest.push(body);
    const response = suggest
      ? await suggest(body, requests.suggest.length)
      : { json: suggestion() };
    await reply(route, response);
  });
  await page.route("**/api/v1/pc-build/validate", async (route) => {
    const body = route.request().postDataJSON();
    requests.validate.push(body);
    const response = validate
      ? await validate(body, requests.validate.length)
      : { json: validated("Đã kiểm tra lại") };
    await reply(route, response);
  });
  await page.route("**/api/v1/pc-build/compatible-replacements", (route) =>
    reply(route, { json: replacements ?? [] }),
  );
  await page.goto("/build-pc");
  return requests;
}

async function suggestFrom(page, budget = "30000000", purpose = "Chơi game 2K") {
  await page.locator("#inputBudget").fill(budget);
  await page.locator("#inputPurpose").fill(purpose);
  await page
    .getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true })
    .click();
}

const addToCartButton = (page) =>
  page.getByRole("button", { name: "Thêm vào giỏ & Đặt hàng", exact: true });
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

for (const failAdd of [false, true]) {
  test(`PC builder uses the server cart and handles add failure=${failAdd}`, async ({
    page,
  }) => {
    const calls = await backend(page, { failAdd });
    await page.route("**/api/v1/pc-build/ai-suggest", (route) =>
      route.fulfill({
        json: {
          buildId: 11,
          buildName: "Cấu hình từ kho",
          budget: 25000000,
          totalPrice: 2400000,
          aiReasoning: "Linh kiện kiểm thử",
          checks: [],
          isCompatible: true,
          reasonCode: "NEEDS_SATURATED",
          budgetFit: {
            ratio: 0.096,
            percent: 9.6,
            status: "UNDER_SATURATED",
            windowMin: 22500000,
            windowMax: 25000000,
            leftover: 22600000,
          },
          profile: builderProfile,
          relaxedItems: [],
          warnings: [],
          items: [
            {
              role: "ram",
              variantId: 101,
              productName: product.name,
              variantName: product.variant,
              unitPrice: 1200000,
              quantity: 2,
              specs: {},
            },
          ],
        },
      }),
    );
    await login(page);
    await page.goto("/build-pc");
    await page.locator("#inputBudget").fill("25000000");
    await page.locator("#inputPurpose").fill("Gaming 1080p");
    await page
      .getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Thêm vào giỏ & Đặt hàng", exact: true })
      .click();
    if (failAdd) {
      await expect(
        page.getByRole("alert").filter({ hasText: "Không đủ tồn kho" }),
      ).toBeVisible();
      await expect(page).toHaveURL(/build-pc/);
    } else {
      await expect(page).toHaveURL(/gio-hang/);
      await expect(
        page.getByRole("spinbutton", { name: /Số lượng RAM/ }),
      ).toHaveValue("2");
    }
    expect(
      calls.filter((call) => call.path === "/api/orders/cart/items"),
    ).toMatchObject([
      { method: "POST", payload: { productVariantId: 101, quantity: 2 } },
    ]);
    expect(
      await page.evaluate(() => localStorage.getItem("techzone-demo-v1")),
    ).toBeNull();
  });
}

test("PC builder shows backend fail checks in red and locks add to cart", async ({
  page,
}) => {
  await builderPage(page, {
    suggest: () => ({
      json: suggestion({
        isCompatible: false,
        checks: [
          {
            key: "R3",
            label: "GPU ↔ Vỏ (chiều dài)",
            status: "fail",
            detail: "GPU 340 mm > vỏ 320 mm",
          },
        ],
      }),
    }),
  });
  await suggestFrom(page);
  const summary = page.locator(".summary-card");
  await expect(summary.getByText("KHÔNG TƯƠNG THÍCH")).toBeVisible();
  await expect(page.getByText("PASS ALL")).toHaveCount(0);
  await expect(summary.locator(".check-item.fail")).toContainText(
    "GPU 340 mm > vỏ 320 mm",
  );
  await expect(addToCartButton(page)).toBeDisabled();
});

test("PC builder shows the needs profile and re-suggests without a disabled chip", async ({
  page,
}) => {
  const requests = await builderPage(page);
  await suggestFrom(page);
  expect(requests.suggest[0]).toEqual({
    budget: 30000000,
    purpose: "Chơi game 2K",
  });
  const panel = page.locator(".needs-profile-panel");
  await expect(panel).toContainText("Chơi game 2K, thỉnh thoảng stream");
  await expect(
    panel.locator(".profile-chip", { hasText: "VRAM ≥ 12 GB" }),
  ).toContainText("Đề xuất theo nhu cầu");
  await expect(
    panel.locator(".profile-chip", { hasText: "Màu vỏ: Trắng" }),
  ).toContainText("Bạn yêu cầu");
  await expect(
    panel.locator(".profile-chip", { hasText: "Tổng RAM ≥ 32 GB" }),
  ).toContainText("Nên có");

  await panel.getByRole("button", { name: "Chỉnh hồ sơ" }).click();
  await panel.getByRole("checkbox", { name: "VRAM ≥ 12 GB" }).uncheck();
  await panel
    .getByRole("button", { name: "Đề xuất lại theo hồ sơ này" })
    .click();
  await expect.poll(() => requests.suggest.length).toBe(2);
  const sent = requests.suggest[1];
  expect(sent).toMatchObject({ budget: 30000000, purpose: "Chơi game 2K" });
  expect(sent.profile.source).toBe("USER_EDITED");
  expect(sent.profile.constraints.map((c) => c.id)).toEqual(["c2"]);
  expect(sent.profile.metrics.map((m) => m.id)).toEqual(["m1"]);
});

test("PC builder AI_UNAVAILABLE hides the old build and retries the same request", async ({
  page,
}) => {
  const requests = await builderPage(page, {
    suggest: (_body, n) =>
      n === 2
        ? {
            status: 503,
            // Backend khác origin: giống SecurityConfig, phải expose Retry-After
            headers: {
              "Retry-After": "2",
              "Access-Control-Expose-Headers": "Retry-After",
            },
            json: { status: 503, code: "AI_UNAVAILABLE", message: "AI bận" },
          }
        : { json: suggestion() },
  });
  await suggestFrom(page);
  await expect(page.locator(".builder-table")).toBeVisible();
  await page
    .getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true })
    .click();
  const box = page.locator("#aiErrorBox");
  await expect(box).toContainText("Trợ lý AI đang bận");
  await expect(page.locator(".builder-table")).toHaveCount(0);
  const retry = box.getByRole("button", { name: /Thử lại/ });
  await expect(retry).toBeDisabled();
  await expect(retry).toBeEnabled({ timeout: 5000 });
  await retry.click();
  await expect(page.locator(".builder-table")).toBeVisible();
  expect(requests.suggest).toHaveLength(3);
  expect(requests.suggest[2]).toEqual(requests.suggest[1]);
});

test("PC builder NEEDS_UNCLEAR shows the clarifying question", async ({
  page,
}) => {
  await builderPage(page, {
    suggest: () => ({
      status: 422,
      json: {
        status: 422,
        code: "NEEDS_UNCLEAR",
        message: "Nhu cầu chưa rõ",
        data: { clarifyingQuestion: "Bạn định dùng máy chủ yếu để làm gì?" },
      },
    }),
  });
  await suggestFrom(page, "30000000", "máy");
  await expect(page.locator("#aiErrorBox")).toContainText(
    "Bạn định dùng máy chủ yếu để làm gì?",
  );
  await expect(page.locator("#inputPurpose")).toBeFocused();
});

test("PC builder explains NEEDS_SATURATED with the leftover", async ({
  page,
}) => {
  await builderPage(page, {
    suggest: () => ({
      json: suggestion({
        budget: 100000000,
        reasonCode: "NEEDS_SATURATED",
        budgetFit: {
          ratio: 0.295,
          percent: 29.5,
          status: "UNDER_SATURATED",
          windowMin: 90000000,
          windowMax: 100000000,
          leftover: 70500000,
        },
      }),
    }),
  });
  await suggestFrom(page, "100000000", "Văn phòng");
  const note = page.locator("#aiReasonNote");
  await expect(note).toContainText("đã đáp ứng tối đa");
  await expect(note).toContainText("còn dư 70.500.000");
});

test("PC builder rejects budgets outside 8.000.000–9.999.999.999 ₫", async ({
  page,
}) => {
  const requests = await builderPage(page, {
    suggest: () => ({
      status: 400,
      json: {
        status: 400,
        code: "BUDGET_BELOW_FLOOR",
        message: "Ngân sách dưới mức tối thiểu",
        data: { minBudget: 8000000, floorPrice: 9000000 },
      },
    }),
  });
  await suggestFrom(page, "7999999");
  await expect(
    page.getByText(/Ngân sách tối thiểu để ráp một bộ máy mới là 8\.000\.000/),
  ).toBeVisible();
  await suggestFrom(page, "10000000000");
  await expect(
    page.getByText(/Ngân sách tối đa là 9\.999\.999\.999/),
  ).toBeVisible();
  expect(requests.suggest).toHaveLength(0);

  // Backend vẫn từ chối khi floorPrice cao hơn: đặt nhanh ngân sách tối thiểu
  await suggestFrom(page, "8500000");
  const box = page.locator("#aiErrorBox");
  await expect(box).toContainText("Ngân sách chưa đủ");
  await box.getByRole("button", { name: /Đặt ngân sách tối thiểu/ }).click();
  await expect(page.locator("#inputBudget")).toHaveValue("9000000");
});

test("PC builder replacement modal and edits over budget lock add to cart", async ({
  page,
}) => {
  const requests = await builderPage(page, {
    replacements: [
      {
        variantId: 31,
        productName: "Nguồn 300W",
        variantName: "300W",
        price: 500000,
        specs: {},
        isCompatible: false,
        compatibilityNote: "Nguồn 300W < tải 450W",
        status: "fail",
        failedChecks: ["J4"],
        warningChecks: [],
        priceDelta: -1000000,
        newTotal: 28500000,
        newPercent: 95,
      },
      {
        variantId: 32,
        productName: "Nguồn 750W Gold",
        variantName: "750W",
        price: 1800000,
        specs: {},
        isCompatible: true,
        compatibilityNote: "Tương thích",
        status: "warning",
        failedChecks: [],
        warningChecks: ["P:m1"],
        priceDelta: 300000,
        newTotal: 29800000,
        newPercent: 99.3,
      },
    ],
    validate: () => ({
      json: validated("Ngân sách", {
        isCompatible: false,
        totalPrice: 30008000,
        budgetFit: {
          ratio: 1.0003,
          percent: 100.03,
          status: "OVER",
          windowMin: 27000000,
          windowMax: 30000000,
          leftover: -8000,
        },
        checks: [
          {
            key: "J8a",
            label: "Ngân sách",
            status: "fail",
            detail: "Vượt ngân sách 8.000 ₫",
          },
        ],
      }),
    }),
  });
  await suggestFrom(page);
  await page
    .locator("tr", { hasText: "Nguồn PF650" })
    .getByRole("button", { name: "Đổi linh kiện" })
    .click();
  const dialog = page.getByRole("dialog");
  const failed = dialog.locator(".replacement-item", { hasText: "Nguồn 300W" });
  await expect(failed).toContainText("Nguồn 300W < tải 450W");
  await expect(
    failed.getByRole("button", { name: "Không thể chọn" }),
  ).toBeDisabled();
  await expect(
    dialog.locator(".replacement-item", { hasText: "Nguồn 750W Gold" }),
  ).toContainText("Không đạt: Stream cần nhiều RAM");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Tăng số lượng ram" }).click();
  await expect(page.locator(".summary-card")).toContainText("Vượt 8.000");
  await expect(addToCartButton(page)).toBeDisabled();
  expect(requests.validate).toHaveLength(1);
  expect(requests.validate[0].items).toContainEqual({
    role: "ram",
    variantId: 2,
    quantity: 3,
  });
  expect(requests.validate[0].profile.summary).toBe(builderProfile.summary);
});

test("PC builder double-click on Đề xuất sends one /ai-suggest", async ({
  page,
}) => {
  const requests = await builderPage(page, {
    suggest: async () => {
      await wait(800);
      return { json: suggestion() };
    },
  });
  await page.locator("#inputBudget").fill("30000000");
  await page.locator("#inputPurpose").fill("Chơi game 2K");
  await page.locator("#btnRunAi").dblclick();
  await expect(page.locator("#btnRunAi")).toBeDisabled();
  await expect(page.locator(".builder-table")).toBeVisible();
  expect(requests.suggest).toHaveLength(1);
});

test("PC builder applies only the latest /validate when an older one returns late", async ({
  page,
}) => {
  const requests = await builderPage(page, {
    validate: async (_body, n) => {
      if (n === 1) await wait(1500);
      return { json: validated(`Kết quả lần ${n}`) };
    },
  });
  await suggestFrom(page);
  const plus = page.getByRole("button", { name: "Tăng số lượng ram" });
  await plus.click();
  await expect.poll(() => requests.validate.length).toBe(1);
  await plus.click();
  const summary = page.locator(".summary-card");
  await expect(summary).toContainText("Kết quả lần 2");
  await wait(1800);
  await expect(summary).not.toContainText("Kết quả lần 1");
  expect(requests.validate[1].items).toContainEqual({
    role: "ram",
    variantId: 2,
    quantity: 4,
  });
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
    expect(route.request().postData()).toBeNull();
    cancelCalls++;
    order.status = "canceled";
    order.cancelReason = "Khách hàng yêu cầu hủy đơn";
    order.paymentStatus = "CANCELED";
    return route.fulfill({ json: order });
  });
  await login(page);
  await page.goto("/don-hang/TZ-ZERO");
  await expect(
    page.getByRole("heading", { name: "Tên sản phẩm lúc mua" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hủy đơn hàng", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Lý do hủy đơn", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xác nhận hủy", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Xác nhận hủy", exact: true }).click();
  await expect(
    page.getByText("Đơn đã được hủy.", { exact: false }),
  ).toBeVisible();
  expect(cancelCalls).toBe(1);
  await expect(page.getByRole("heading", { name: "Lý do hủy đơn", exact: true })).toHaveCount(0);
});

test("staff cancellation requires a reason and shows it after reloading the order", async ({ page }) => {
  await backend(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "staff-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 2, name: "Staff", role: "Staff" }));
  });
  const order = {
    id: 71, orderCode: "TZ-CANCEL-STAFF", userId: 42, status: "pending",
    pickupName: "Khách kiểm thử", pickupPhone: "0900000128", note: "Nhận buổi chiều",
    totalAmount: 1299000, discountAmount: 0, finalAmount: 1299000,
    paymentStatus: "PENDING", methodType: "cash", createdAt: "2026-11-08T10:00:00", items: [],
  };
  let cancelCalls = 0;
  await page.route("**/api/operations/orders?*", (route) => route.fulfill({ json: [order] }));
  await page.route("**/api/operations/orders/TZ-CANCEL-STAFF/cancel", (route) => {
    expect(route.request().postDataJSON()).toEqual({ reason: "Khách yêu cầu đổi cấu hình" });
    cancelCalls++;
    order.status = "canceled";
    order.paymentStatus = "CANCELED";
    order.cancelReason = route.request().postDataJSON().reason;
    return route.fulfill({ json: order });
  });
  await page.goto("/van-hanh/don-hang?id=TZ-CANCEL-STAFF");
  await page.getByRole("button", { name: "Hủy đơn hàng", exact: true }).click();
  await expect(page.getByRole("button", { name: "Xác nhận hủy", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "Lý do hủy đơn", exact: true }).fill("Khách yêu cầu đổi cấu hình");
  await page.screenshot({ path: "test-results/staff-cancel-order-reason.png", fullPage: true });
  await page.getByRole("button", { name: "Xác nhận hủy", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("Khách yêu cầu đổi cấu hình", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Khách yêu cầu đổi cấu hình", { exact: true })).toBeVisible();
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
