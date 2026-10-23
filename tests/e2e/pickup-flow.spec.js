import { test, expect } from "@playwright/test";

test("admin promotion → customer order → staff collection and handover → warranty and review", async ({
  page,
}) => {
  test.setTimeout(90000);
  const product = {
    id: "101",
    productId: "10",
    name: "RAM Kingston",
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
  };
  const promotions = [],
    orders = [],
    cards = [],
    calls = [];
  let quantity = 0;
  let newerOrder = null;
  const items = () =>
    quantity
      ? [
          {
            cartItemId: 9001,
            productVariantId: 101,
            productName: product.name,
            variantName: product.variant,
            unitPrice: 1200000,
            quantity,
            subtotal: quantity * 1200000,
            stockQuantity: 3,
            available: true,
          },
        ]
      : [];
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const payload = req.postData() ? req.postDataJSON() : null;
    calls.push({
      path,
      method: req.method(),
      payload,
      key: req.headers()["idempotency-key"],
    });
    const respond = (json, status = 200) => route.fulfill({ json, status });
    if (path === "/api/auth/login") {
      const role = payload.identity.startsWith("admin")
        ? "Admin"
        : payload.identity.startsWith("staff")
          ? "Staff"
          : "Customer";
      return respond({
        data: {
          accessToken: role + "-token",
          user: {
            id: role === "Customer" ? 42 : role === "Admin" ? 1 : 2,
            fullName: role,
            email: payload.identity,
            phone: "0900000128",
            role,
          },
        },
      });
    }
    if (path === "/api/products") {
      const completed = orders[0]?.status === "completed";
      const rating = completed ? orders[0].items[0].rating : 0;
      return respond([
        {
          ...product,
          buyerCount: completed ? 1 : 0,
          reviewCount: rating ? 1 : 0,
          averageRating: rating || 0,
        },
      ]);
    }
    if (path === "/api/promotions")
      return respond(promotions.filter((p) => p.active && p.bannerActive));
    if (path === "/api/admin/promotions" && req.method() === "GET")
      return respond(promotions);
    if (path === "/api/admin/promotions" && req.method() === "POST") {
      const promotion = {
        ...payload,
        id: 1,
        code: payload.code.toUpperCase(),
        used: 0,
        reserved: 0,
      };
      promotions.push(promotion);
      return respond(promotion);
    }
    if (path === "/api/orders/cart")
      return respond({
        data: {
          cartId: 8,
          userId: 42,
          items: items(),
          totalQuantity: quantity,
          totalAmount: quantity * 1200000,
        },
      });
    if (path === "/api/orders/cart/items") {
      quantity += payload.quantity;
      return respond({ data: null });
    }
    if (path === "/api/checkout/validate")
      return respond({
        cartId: 8,
        items: items(),
        totalAmount: quantity * 1200000,
        valid: true,
      });
    if (path === "/api/checkout/details/preview")
      return respond({
        ...payload,
        promotionCode: payload.promotionCode || null,
        cartId: 8,
        items: items(),
        totalAmount: quantity * 1200000,
        discountAmount: payload.promotionCode ? 100000 : 0,
        finalAmount: quantity * 1200000 - (payload.promotionCode ? 100000 : 0),
      });
    if (path === "/api/orders" && req.method() === "POST") {
      if (orders.length) return respond(orders[0], 201);
      const order = {
        id: 1,
        orderCode: "TZ-PICKUP-TEST",
        userId: 42,
        status: "pending",
        ...payload,
        totalAmount: 2400000,
        discountAmount: 100000,
        finalAmount: 2300000,
        promotionCode: "SAVE",
        paymentStatus: "PENDING",
        methodType: "cash",
        createdAt: "2026-10-19T12:00:00",
        updatedAt: "2026-10-19T12:00:00",
        items: [
          {
            id: 501,
            productVariantId: 101,
            productName: "RAM Kingston · 16GB DDR5",
            quantity,
            unitPrice: 1200000,
            subtotal: 2400000,
            warrantyPeriodMonths: 36,
          },
        ],
      };
      orders.push(order);
      quantity = 0;
      promotions[0].reserved = 1;
      return respond(order, 201);
    }
    if (path === "/api/orders") return respond(orders);
    if (path === "/api/operations/orders")
      return respond(newerOrder ? [newerOrder, ...orders] : orders);
    if (path === "/api/orders/TZ-PICKUP-TEST") return respond(orders[0]);
    if (path.endsWith("/status")) {
      orders[0].status = payload.status;
      return respond(orders[0]);
    }
    if (path.endsWith("/collect")) {
      if (path !== "/api/operations/orders/TZ-PICKUP-TEST/collect")
        return respond({ message: "Thu tiền nhầm đơn." }, 400);
      if (payload.receivedAmount < 2300000) {
        newerOrder = { ...orders[0], id: 2, orderCode: "TZ-NEWER-ORDER" };
        return respond({ message: "Chưa nhận đủ tiền." }, 400);
      }
      orders[0].paymentStatus = "SUCCESS";
      orders[0].paidAt = "2026-10-19T13:00:00";
      promotions[0].reserved = 0;
      promotions[0].used = 1;
      return respond(orders[0]);
    }
    if (path.endsWith("/handover")) {
      expect(payload).toEqual({
        recipientPhone: "0900000128",
        recipientVerified: true,
        devices: [
          { orderItemId: 501, serialNumber: "DEVICE-A" },
          { orderItemId: 501, serialNumber: "DEVICE-B" },
        ],
      });
      if (payload.recipientPhone !== "0900000128")
        return respond(
          { message: "Thông tin người nhận chưa chính xác." },
          400,
        );
      orders[0].status = "completed";
      for (const [index, device] of payload.devices.entries())
        cards.push({
          id: String(index + 1),
          orderId: orders[0].orderCode,
          userId: 42,
          productId: "101",
          productName: orders[0].items[0].productName,
          serial: device.serialNumber.toUpperCase(),
          start: "2026-10-19T13:00:00",
          end: "2029-10-19T13:00:00",
          status: "active",
        });
      return respond(orders[0]);
    }
    if (path === "/api/my/warranty-cards")
      return respond({
        data: cards.map((card) => ({
          id: card.id,
          serialNumber: card.serial,
          productName: card.productName,
          orderCode: card.orderId,
          startDate: card.start,
          endDate: card.end,
          status: card.status,
          valid: true,
          requests: [],
        })),
      });
    if (path === "/api/order-items/501/review") {
      orders[0].items[0].rating = payload.rating;
      orders[0].items[0].reviewComment = payload.comment;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/products/101/reviews")
      return respond(
        orders[0]?.items[0].rating
          ? [
              {
                id: "1",
                productId: "101",
                rating: orders[0].items[0].rating,
                comment: orders[0].items[0].reviewComment,
                name: "Customer",
              },
            ]
          : [],
      );
    return respond({ message: "Unexpected request " + path }, 500);
  });
  async function login(role) {
    await page.goto("/dang-nhap");
    await page.locator("#identity").fill(role.toLowerCase() + "@example.com");
    await page.locator("#password").fill("Test123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).not.toHaveURL(/dang-nhap/);
  }
  async function logout() {
    await page.goto("/tai-khoan");
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  }

  await login("Admin");
  await page.goto("/quan-tri/khuyen-mai");
  await page
    .getByRole("textbox", { name: "Mã giảm giá", exact: true })
    .fill("save");
  await page
    .getByRole("textbox", { name: "Tên chương trình" })
    .fill("Ưu đãi nhận tại cửa hàng");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chương trình SAVE", exact: true }),
  ).toBeVisible();
  await logout();
  await login("Customer");
  await page.goto("/san-pham/101");
  await page
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("2");
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page).toHaveURL(/gio-hang/);
  await page.getByRole("link", { name: "Tiếp tục đặt hàng" }).click();
  await page
    .getByRole("textbox", { name: "Mã giảm giá", exact: true })
    .fill("SAVE");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await page
    .getByRole("button", { name: "Xác nhận đặt hàng →", exact: true })
    .click();
  await expect(page).toHaveURL(/don-hang\/TZ-PICKUP-TEST/);
  await expect(
    page.getByRole("heading", { name: "Đã tạo đơn hàng của bạn" }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.path === "/api/orders" && c.method === "POST").key,
  ).toMatch(/^[0-9a-f-]{36}$/);
  await logout();
  await login("Staff");
  await page.goto("/van-hanh/don-hang");
  await page.getByRole("button", { name: "Xác nhận đơn", exact: true }).click();
  await page
    .getByRole("button", { name: "Bắt đầu chuẩn bị", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Đánh dấu sẵn sàng nhận", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đã thu đủ", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Số tiền thực tế đã nhận (VND)" })
    .fill("100");
  await page
    .getByRole("button", { name: "Đã thu đủ tiền", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Chưa nhận đủ tiền");
  await expect(
    page.getByRole("button", { name: /TZ-NEWER-ORDER/ }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("TZ-PICKUP-TEST");
  await page
    .getByRole("spinbutton", { name: "Số tiền thực tế đã nhận (VND)" })
    .fill("2300000");
  await page
    .getByRole("button", { name: "Đã thu đủ tiền", exact: true })
    .click();
  await page.getByRole("button", { name: "Tiếp tục bàn giao" }).click();
  await page.getByLabel(/Thiết bị 1/).fill("DEVICE-A");
  await page.getByLabel(/Thiết bị 2/).fill("DEVICE-B");
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
    page.getByText("Đã bàn giao và kích hoạt bảo hành.", { exact: true }),
  ).toBeVisible();
  expect(cards).toHaveLength(2);
  expect(promotions[0]).toMatchObject({ used: 1, reserved: 0 });
  await logout();
  await login("Customer");
  await page.goto("/bao-hanh");
  await expect(page.getByText("DEVICE-A", { exact: true })).toBeVisible();
  await expect(page.getByText("DEVICE-B", { exact: true })).toBeVisible();
  await page.goto("/don-hang/TZ-PICKUP-TEST");
  await page.getByRole("button", { name: "Đánh giá", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nhận xét", exact: true })
    .fill("Nhận đúng hai thiết bị, hoạt động tốt.");
  await page.getByRole("button", { name: "Lưu đánh giá", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/san-pham/101");
  await page.getByRole("button", { name: "Đánh giá (1)", exact: true }).click();
  await expect(page.locator(".product-detail")).toContainText("5,0/5");
  await expect(page.locator(".product-detail")).toContainText("1 người đã mua");
  await expect(
    page.getByText("Nhận đúng hai thiết bị, hoạt động tốt.", { exact: true }),
  ).toBeVisible();
});
