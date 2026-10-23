import { test, expect } from "@playwright/test";

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
