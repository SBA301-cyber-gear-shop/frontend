import { test, expect } from "@playwright/test";

test("voucher and product sale lists support search status filters sorting and reset", async ({ page }) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date("2026-11-08T10:00:00+07:00"));
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "admin-filter-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 1, name: "Admin", role: "Admin" }));
  });
  const base = { name: "Ưu đãi tháng 11", type: "percentage", value: 10, limit: 100, used: 8, reserved: 2, active: true, start: "2026-11-01T00:00", end: "2026-11-30T00:00" };
  const vouchers = [
    { ...base, id: 1, code: "SAVE10" },
    { ...base, id: 2, code: "HE500", name: "Ưu đãi hè", type: "fixed_amount", value: 500000, active: false, used: 0, reserved: 0 },
    { ...base, id: 3, code: "FUTURE20", value: 20, start: "2026-11-20T00:00" },
    { ...base, id: 4, code: "SOLD", type: "fixed_amount", limit: 1, used: 1, reserved: 0 },
    { ...base, id: 5, code: "EXPIRED", end: "2026-10-31T00:00" },
  ];
  const variant = { id: 11, name: "16GB", basePrice: 20000, regularPrice: 20000, effectivePrice: 19600 };
  const saleBase = { configured: true, enabled: true, active: true, percentage: 2, start: "2026-11-01T00:00", end: "2026-11-30T00:00", variants: [variant] };
  const sales = [
    { ...saleBase, productId: 10, productName: "Laptop kiểm thử", variants: [variant, { ...variant, id: 12, name: "32GB" }] },
    { ...saleBase, productId: 20, productName: "Chuột văn phòng", percentage: null, discountType: "fixed_amount", discountValue: 5000, enabled: false, active: false, variants: [{ ...variant, id: 21, name: "Đen" }] },
    { ...saleBase, productId: 30, productName: "Bàn phím", percentage: 15, start: "2026-11-20T00:00", active: false, variants: [{ ...variant, id: 31, name: "Trắng" }] },
    { ...saleBase, productId: 40, productName: "Màn hình", percentage: 5, end: "2026-10-31T00:00", active: false },
  ];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/admin/promotions") return route.fulfill({ json: vouchers });
    if (path === "/api/admin/product-sales") return route.fulfill({ json: sales });
    if (path === "/api/orders/cart") return route.fulfill({ json: { data: { items: [], totalAmount: 0 } } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/quan-tri/khuyen-mai");
  const voucherTable = page.getByRole("table");
  await expect(voucherTable.getByRole("row")).toHaveCount(6);
  const voucherSearch = page.getByRole("textbox", { name: "Tìm kiếm voucher", exact: true });
  await voucherSearch.fill("uu dai he");
  await expect(voucherTable.getByRole("row")).toHaveCount(2);
  await expect(voucherTable).toContainText("HE500");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByRole("group", { name: "Trạng thái voucher", exact: true }).getByRole("button", { name: "Đang áp dụng (1)", exact: true }).click();
  await expect(voucherTable.getByRole("row")).toHaveCount(2);
  await expect(voucherTable).toContainText("SAVE10");
  await page.getByLabel("Trạng thái chi tiết voucher", { exact: true }).selectOption("upcoming");
  await expect(voucherTable).toContainText("FUTURE20");
  await expect(voucherTable.getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByLabel("Loại giảm giá voucher", { exact: true }).selectOption("fixed_amount");
  await page.getByLabel("Hạn mức voucher", { exact: true }).selectOption("empty");
  await expect(voucherTable.getByRole("row")).toHaveCount(2);
  await expect(voucherTable).toContainText("SOLD");
  await voucherSearch.fill("no-such-code");
  await expect(voucherTable).toContainText("Không có voucher phù hợp");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByLabel("Sắp xếp voucher", { exact: true }).selectOption("name_asc");
  await expect(voucherTable.getByRole("row").nth(1)).toContainText("EXPIRED");
  await page.screenshot({ path: "test-results/voucher-list-filters-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/voucher-list-filters-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Sale theo mã sản phẩm", exact: true }).click();
  const saleTable = page.getByRole("table");
  await expect(saleTable.getByRole("row")).toHaveCount(5);
  const saleSearch = page.getByRole("textbox", { name: "Tìm kiếm lịch sale", exact: true });
  await page.getByLabel("Loại giảm giá trong danh sách sale", { exact: true }).selectOption("fixed_amount");
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await expect(saleTable).toContainText("Số tiền cố định");
  await expect(saleTable).toContainText("5.000");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await saleSearch.fill("ban phim");
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await expect(saleTable).toContainText("Bàn phím");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await saleSearch.fill("32gb");
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await expect(saleTable).toContainText("Laptop kiểm thử");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.getByLabel("Mức giảm sale", { exact: true })).toHaveCount(0);
  await page.getByLabel("Trạng thái chi tiết lịch sale", { exact: true }).selectOption("upcoming");
  await expect(saleTable).toContainText("Bàn phím");
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByLabel("Số SKU trong lịch sale", { exact: true }).selectOption("multiple");
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await expect(saleTable).toContainText("Laptop kiểm thử");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByRole("group", { name: "Trạng thái lịch sale", exact: true }).getByRole("button", { name: "Đã tắt (1)", exact: true }).click();
  await expect(saleTable.getByRole("row")).toHaveCount(2);
  await expect(saleTable).toContainText("Chuột văn phòng");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByLabel("Sắp xếp lịch sale", { exact: true }).selectOption("discount_desc");
  await expect(saleTable.getByRole("row").nth(1)).toContainText("Chuột văn phòng");
  await page.screenshot({ path: "test-results/product-sale-filters-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/product-sale-filters-mobile.png", fullPage: true });
});

test("admin views voucher usage history with customer details filters pagination and retry", async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "admin-test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 1, name: "Admin", role: "Admin" }));
  });
  const vouchers = [
    { id: 1, code: "SAVE10", name: "Ưu đãi tháng 11", type: "percentage", value: 10, limit: 100, used: 7, reserved: 7, active: true, start: "2026-11-01T00:00", end: "2027-01-01T00:00" },
    { id: 2, code: "EMPTY", name: "Voucher chưa dùng", type: "fixed_amount", value: 50000, limit: 100, used: 0, reserved: 0, active: true, start: "2026-11-01T00:00", end: "2027-01-01T00:00" },
  ];
  const usages = Array.from({ length: 21 }, (_, index) => ({
    id: 21-index, userId: 100+index, customerName: index === 0 ? "Nguyễn Văn An" : `Khách ${index+1}`,
    customerEmail: `buyer${index+1}@example.com`, orderId: 200+index, orderCode: `TZ-HIST-${21-index}`,
    orderCreatedAt: `2026-11-08T10:${String(59-index).padStart(2,"0")}:00`, orderStatus: "pending",
    discountAmount: 100000+index*1000, status: ["USED", "RESERVED", "REVOKED"][index%3],
  }));
  let failNext = false;
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/admin/promotions") return route.fulfill({ json: vouchers });
    if (/^\/api\/admin\/promotions\/\d+\/usages$/.test(url.pathname)) {
      if (failNext) { failNext = false; return route.fulfill({ status: 500, json: { message: "Không tải được lịch sử sử dụng voucher." } }); }
      const id = Number(url.pathname.split("/")[4]);
      const selectedStatus = url.searchParams.get("status") || "ALL";
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const currentPage = Number(url.searchParams.get("page") || 0);
      const size = Number(url.searchParams.get("size") || 20);
      const filtered = id !== 1 ? [] : usages.filter((row) => (selectedStatus === "ALL" || row.status === selectedStatus)
        && [row.customerName, row.customerEmail, row.orderCode].some((value) => value.toLowerCase().includes(search)));
      return route.fulfill({ json: { promotionId: id, code: id === 1 ? "SAVE10" : "EMPTY", page: currentPage, size,
        totalElements: filtered.length, totalPages: Math.ceil(filtered.length/size), items: filtered.slice(currentPage*size, (currentPage+1)*size) } });
    }
    if (url.pathname === "/api/orders/cart") return route.fulfill({ json: { data: { items: [], totalAmount: 0 } } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/quan-tri/khuyen-mai");
  await page.getByRole("button", { name: "Xem lượt sử dụng voucher SAVE10", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Lịch sử sử dụng voucher SAVE10", exact: true });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("status")).toContainText("1–20 / 21");
  const customerRow = modal.getByRole("row").filter({ hasText: "Nguyễn Văn An" });
  await expect(customerRow).toContainText("buyer1@example.com");
  await expect(customerRow).toContainText("100.000");
  await expect(customerRow).toContainText("08/11/2026");
  await expect(customerRow.getByRole("link")).toHaveAttribute("href", "/van-hanh/don-hang?id=TZ-HIST-21");
  await page.screenshot({ path: "test-results/voucher-usage-history-desktop.png", fullPage: true });
  await modal.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(modal.getByRole("status")).toContainText("21–21 / 21");
  await expect(modal.getByRole("row").filter({ hasText: "buyer21@example.com" })).toBeVisible();
  await modal.getByLabel("Trạng thái lượt dùng", { exact: true }).selectOption("USED");
  await expect(modal.getByRole("status")).toContainText("1–7 / 7");
  await expect(modal.getByRole("button", { name: "Trang sau", exact: true })).toBeDisabled();
  await modal.getByLabel("Khách hàng hoặc mã đơn", { exact: true }).fill("buyer1@example.com");
  await modal.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(modal.getByRole("status")).toContainText("1–1 / 1");
  await modal.getByLabel("Trạng thái lượt dùng", { exact: true }).selectOption("ALL");
  await modal.getByLabel("Khách hàng hoặc mã đơn", { exact: true }).fill("TZ-HIST-19");
  await modal.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(modal.getByRole("row").filter({ hasText: "TZ-HIST-19" })).toContainText("Đã hủy");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/voucher-usage-history-mobile.png", fullPage: true });
  failNext = true;
  await modal.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(modal.getByRole("alert")).toContainText("Không tải được lịch sử");
  await modal.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(modal.getByRole("row").filter({ hasText: "TZ-HIST-19" })).toBeVisible();
  await modal.getByRole("button", { name: "Đóng lịch sử", exact: true }).click();
  await page.getByRole("button", { name: "Xem lượt sử dụng voucher EMPTY", exact: true }).click();
  const empty = page.getByRole("dialog", { name: "Lịch sử sử dụng voucher EMPTY", exact: true });
  await expect(empty).toContainText("Voucher chưa có lượt sử dụng.");
  await expect(empty).not.toContainText("Nguyễn Văn An");
});

test("promotion manages scheduled product sale by product ID for every SKU", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "admin-test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 1, name: "Admin", role: "Admin" }));
  });
  let sale = {
    productId: 200, productName: "Laptop kiểm thử", configured: false, enabled: false,
    percentage: null, start: null, end: null, active: false,
    variants: [
      { id: 2001, name: "8GB", basePrice: 20000, regularPrice: 20000, effectivePrice: 20000 },
      { id: 2002, name: "16GB", basePrice: 40000, regularPrice: 40000, effectivePrice: 40000 },
    ],
  };
  const saved = [];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/admin/product-sales/products") {
      const query = new URL(route.request().url()).searchParams.get("search");
      return route.fulfill({ json: ["200", "Laptop", "ASUS"].includes(query) ? [{ productId: 200, productName: "Laptop kiểm thử", brand: "ASUS", variantCount: 2 }] : [] });
    }
    if (path === "/api/admin/product-sales") return route.fulfill({ json: sale.configured ? [sale] : [] });
    if (path === "/api/admin/product-sales/200") {
      if (route.request().method() === "PUT") {
        const payload = route.request().postDataJSON();
        saved.push(payload);
        sale = { ...sale, ...payload, configured: true, active: payload.enabled,
          variants: sale.variants.map((variant) => ({ ...variant, effectivePrice: payload.enabled ? payload.discountType === "fixed_amount" ? Math.max(0, variant.basePrice - payload.discountValue) : Math.round(variant.basePrice * (1 - payload.discountValue / 100)) : variant.regularPrice })) };
      }
      return route.fulfill({ json: sale });
    }
    if (path === "/api/admin/product-sales/999") return route.fulfill({ status: 404, json: { message: "Không tìm thấy mã sản phẩm này." } });
    if (path === "/api/orders/cart") return route.fulfill({ json: { data: { cartId: null, userId: 1, items: [], totalQuantity: 0, totalAmount: 0 } } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/quan-tri/khuyen-mai");
  await page.getByRole("button", { name: "Sale theo mã sản phẩm", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "ID, tên sản phẩm hoặc thương hiệu", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tạo lịch sale mới", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Tạo lịch sale mới", exact: true })).toBeVisible();
  const code = page.getByRole("textbox", { name: "ID, tên sản phẩm hoặc thương hiệu", exact: true });
  await code.fill("999");
  await page.getByRole("button", { name: "Tìm sản phẩm", exact: true }).click();
  await expect(page.getByRole("region", { name: "Kết quả tìm sản phẩm" })).toContainText("Không tìm thấy sản phẩm phù hợp");
  for (const query of ["ASUS", "Laptop"]) {
    await code.fill(query);
    await code.press("Enter");
    await expect(page.getByRole("region", { name: "Kết quả tìm sản phẩm" })).toContainText("Thương hiệu: ASUS");
    await expect(page.getByRole("button", { name: "Chọn sản phẩm #200", exact: true })).toBeVisible();
  }
  await code.fill("200");
  await page.getByRole("button", { name: "Tìm sản phẩm", exact: true }).click();
  await page.getByRole("button", { name: "Chọn sản phẩm #200", exact: true }).click();
  await expect(page.getByRole("heading", { name: "#200 · Laptop kiểm thử", exact: true })).toBeVisible();
  await page.getByLabel("Phần trăm giảm (%)", { exact: true }).fill("2");
  await page.getByLabel("Bắt đầu (UTC+07)", { exact: true }).fill("2026-11-08T00:00");
  await page.getByLabel("Kết thúc (UTC+07)", { exact: true }).fill("2026-11-09T00:00");
  await expect(page.getByText(/19\.600/)).toBeVisible();
  await expect(page.getByText(/39\.200/)).toBeVisible();
  await page.screenshot({ path: "test-results/product-sale-editor-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Lưu lịch sale", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Chỉnh sale #200", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lịch sale đã tạo (1)", exact: true })).toBeVisible();
  const saleTable = page.getByRole("table");
  await expect(saleTable.getByRole("row").filter({ hasText: "Laptop kiểm thử" })).toContainText("2%");
  await expect(saleTable.getByRole("row").filter({ hasText: "Laptop kiểm thử" })).toContainText("2 SKU");
  await expect(saleTable.getByRole("row").filter({ hasText: "Laptop kiểm thử" })).toContainText("Từ 08/11/2026");
  await expect(saleTable.getByRole("row").filter({ hasText: "Laptop kiểm thử" })).toContainText("Đang áp dụng");
  expect(await page.locator(".promotion-table-scroll").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBeTruthy();
  expect(saved[0]).toEqual({ enabled: true, discountType: "percentage", discountValue: 2, start: "2026-11-08T00:00", end: "2026-11-09T00:00" });
  await page.screenshot({ path: "test-results/product-sale-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/product-sale-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Chỉnh sale #200", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Chỉnh sửa lịch sale #200", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "ID, tên sản phẩm hoặc thương hiệu", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog").getByRole("heading", { name: "#200 · Laptop kiểm thử", exact: true })).toBeVisible();
  await page.getByLabel("Loại giảm giá sale", { exact: true }).selectOption("fixed_amount");
  await page.getByLabel("Số tiền giảm (₫)", { exact: true }).fill("5000");
  await expect(page.getByText(/15\.000/)).toBeVisible();
  await expect(page.getByText(/35\.000/)).toBeVisible();
  await page.getByLabel("Số tiền giảm (₫)", { exact: true }).fill("50000");
  await expect(page.getByRole("dialog").getByText(/^0\s*₫$/)).toHaveCount(2);
  await page.getByLabel("Số tiền giảm (₫)", { exact: true }).fill("5000");
  await page.screenshot({ path: "test-results/product-sale-editor-mobile.png", fullPage: true });
  await page.getByRole("checkbox", { name: "Kích hoạt lịch sale", exact: true }).uncheck();
  await page.getByRole("button", { name: "Lưu lịch sale", exact: true }).click();
  await expect.poll(() => saved.length).toBe(2);
  expect(saved[1].enabled).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "Sale theo mã sản phẩm", exact: true }).click();
  await page.getByRole("button", { name: "Chỉnh sale #200", exact: true }).click();
  await expect(page.getByLabel("Loại giảm giá sale", { exact: true })).toHaveValue("fixed_amount");
  await expect(page.getByLabel("Số tiền giảm (₫)", { exact: true })).toHaveValue("5000");
  await expect(page.getByRole("checkbox", { name: "Kích hoạt lịch sale", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Tạo lịch sale mới", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "ID, tên sản phẩm hoặc thương hiệu", exact: true })).toHaveValue("");
  await expect(page.getByRole("heading", { name: "#200 · Laptop kiểm thử", exact: true })).toHaveCount(0);
});

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
    const raw = req.postData();
    const payload = raw && req.headers()["content-type"]?.includes("multipart/form-data")
      ? JSON.parse(raw.match(/\r\n\r\n({[^\r\n]+})\r\n/)?.[1] || "{}").review
      : raw ? req.postDataJSON() : null;
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
      if (payload.receivedAmount < 2300000 || payload.reference === "TEST-RETRY") {
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
    if (path === "/api/my/service-intakes") return respond({ data: [] });
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
      if (req.method() === "GET") return respond({ rating: orders[0].items[0].rating || 5, comment: orders[0].items[0].reviewComment || "", media: [] });
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
    if (path === "/api/reviews/1/media") return respond([]);
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
  await page.getByRole("button", { name: "Tạo mã mới", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Mã giảm giá", exact: true })
    .fill("save");
  await page
    .getByRole("textbox", { name: "Tên chương trình" })
    .fill("Ưu đãi nhận tại cửa hàng");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Danh sách voucher (1)", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "SAVE" })).toContainText(
    "100.000",
  );
  expect(
    await page
      .locator(".promotion-table-scroll")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/voucher-list-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Chỉnh sửa voucher SAVE", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Mã giảm giá", exact: true }),
  ).toHaveValue("SAVE");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/voucher-list-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  await expect(page.getByRole("alert")).toContainText("Chưa nhận đủ tiền");
  const collectButton = page.getByRole("button", { name: "Đã thu đủ tiền", exact: true });
  await expect(collectButton).toBeDisabled();
  expect(calls.filter((call) => call.path.endsWith("/collect"))).toHaveLength(0);
  const cashInput = page.getByRole("spinbutton", { name: "Số tiền thực tế đã nhận (VND)" });
  await cashInput.fill("-1");
  await expect(collectButton).toBeDisabled();
  await cashInput.fill("2300000.5");
  await expect(collectButton).toBeDisabled();
  await page.getByRole("button", { name: "Vừa đủ", exact: true }).click();
  await expect(cashInput).toHaveValue("2300000");
  await expect(page.getByRole("dialog")).toContainText("Khách đưa vừa đủ");
  await expect(collectButton).toBeEnabled();
  await page.getByRole("group", { name: "Chọn nhanh tiền khách đưa" }).getByRole("button", { name: /2.500.000/ }).click();
  await expect(page.getByRole("dialog")).toContainText("200.000");
  await expect(collectButton).toBeDisabled();
  await page.getByRole("checkbox", { name: /Đã trả lại/ }).check();
  await expect(collectButton).toBeEnabled();
  await cashInput.fill("3000000");
  await expect(page.getByRole("checkbox", { name: /Đã trả lại/ })).not.toBeChecked();
  await expect(collectButton).toBeDisabled();
  await expect(page.getByRole("dialog")).toContainText("700.000");
  await page.screenshot({ path: "test-results/cash-change-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/cash-change-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("checkbox", { name: /Đã trả lại/ }).check();
  await page.getByRole("textbox", { name: "Mã chứng từ thu tiền (nếu có)" }).fill("TEST-RETRY");
  await collectButton.click();
  await expect(page.getByRole("alert")).toContainText("Chưa nhận đủ tiền");
  await expect(
    page.getByRole("button", { name: /TZ-NEWER-ORDER/ }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("TZ-PICKUP-TEST");
  await page.getByRole("textbox", { name: "Mã chứng từ thu tiền (nếu có)" }).fill("");
  await page
    .getByRole("button", { name: "Đã thu đủ tiền", exact: true })
    .click();
  expect(calls.filter((call) => call.path.endsWith("/collect")).at(-1).payload.receivedAmount).toBe(3000000);
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
  await page.getByText(/^Đơn TZ-PICKUP-TEST · 2 linh kiện/).click();
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
