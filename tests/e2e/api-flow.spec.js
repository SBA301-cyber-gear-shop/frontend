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
    await page
      .getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Thêm vào giỏ & Đặt hàng", exact: true })
      .click();
    if (failAdd) {
      await expect(page.getByRole("alert")).toContainText("Không đủ tồn kho");
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
