import { test, expect } from "@playwright/test";

test("product details make variants and stock clear", async ({ page }) => {
  const product = {
    id: 101, productId: 10, name: "Kingston FURY Beast 8GB DDR4 3200",
    category: "ram", brand: "Kingston", sku: "RAM-TEST", variant: "Tiêu chuẩn",
    price: 1850000, originalPrice: 1850000, stock: 24, warranty: 36,
    status: "active", specs: { Memory_Type: "DDR4", Capacity_GB: "8", Speed_MHz: "3200" },
    primarySpecs: ["Memory_Type", "Capacity_GB", "Speed_MHz"],
  };
  let products = [product];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/products") return route.fulfill({ json: products });
    return route.fulfill({ json: [] });
  });
  await page.goto("/san-pham/101");
  await expect(page.getByText("Còn 24 sản phẩm")).toBeVisible();
  await expect(page.getByText("Nhận tại cửa hàng", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Chọn phiên bản", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Thông số nổi bật")).toHaveCount(0);
  await expect(page.locator(".spec-table").getByText("DDR4")).toBeVisible();
  await expect(page.locator(".spec-table").getByText("3200")).toBeVisible();
  await expect(page.getByText("1 sản phẩm × 8GB = 8GB")).toBeVisible();
  products = [product, { ...product, id: 102, variant: "Bản khác" }];
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByText("Chọn phiên bản")).toBeVisible();
  await page.getByRole("button", { name: /Bản khác/ }).click();
  await expect(page).toHaveURL(/\/san-pham\/102$/);
});

test("catalog shows a discount badge only when the sale price is lower", async ({ page }) => {
  const base = {
    productId: 10, category: "ram", brand: "Kingston", variant: "Tiêu chuẩn",
    stock: 10, warranty: 36, status: "active", specs: {}, price: 1850000,
  };
  const products = [
    { ...base, id: 101, name: "RAM giảm giá", originalPrice: 2000000 },
    { ...base, id: 102, name: "RAM giá thường", originalPrice: 1850000 },
  ];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    return route.fulfill({ json: path === "/api/products" ? products : [] });
  });
  await page.goto("/san-pham");
  const saleCard = page.locator(".product-card").filter({ hasText: "RAM giảm giá" });
  const ribbon = saleCard.getByText("Giảm 7,5%");
  await expect(ribbon).toBeVisible();
  const overlap = await saleCard.evaluate((card) => {
    const badge = card.querySelector(".product-card-discount").getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    return badge.top < bounds.top && badge.left < bounds.left;
  });
  expect(overlap).toBeTruthy();
  await saleCard.hover();
  await expect.poll(() => saleCard.evaluate((card) => getComputedStyle(card).transform)).not.toBe("none");
  await expect(page.locator(".product-card").filter({ hasText: "RAM giá thường" }).locator(".product-card-discount")).toHaveCount(0);
});
