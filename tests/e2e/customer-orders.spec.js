import { expect, test } from "@playwright/test";

test("customer orders display pickup status, date and review actions", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "customer-test");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 42, name: "Khách", role: "Customer" }));
  });
  const item = { id: 501, productVariantId: 101, productName: "RAM kiểm thử", quantity: 1, unitPrice: 100000, rating: 5, reviewComment: "Tốt" };
  const base = { userId: 42, status: "completed", paymentStatus: "SUCCESS", methodType: "cash", totalAmount: 100000, discountAmount: 0, finalAmount: 100000, createdAt: "2026-11-10T22:51:00" };
  const orders = [
    { ...base, id: 1, orderCode: "TZ-REVIEWED", deliveryType: "store", items: [item] },
    { ...base, id: 2, orderCode: "TZ-UNREVIEWED", deliveryType: "shipping", items: [{ ...item, id: 502, rating: null }] },
  ];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/orders") return route.fulfill({ json: orders });
    if (path === "/api/products") return route.fulfill({ json: [] });
    return route.fulfill({ json: [] });
  });
  await page.goto("/don-hang");
  const cards = page.locator(".customer-order-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).getByText("Đã nhận hàng")).toBeVisible();
  await expect(cards.nth(1).getByText("Đã giao hàng")).toBeVisible();
  await expect(cards.nth(0).getByText("10/11/2026 · 22:51")).toBeVisible();
  await expect(cards.nth(0).getByRole("button", { name: "Xem đánh giá" })).toBeVisible();
  await expect(cards.nth(1).getByRole("button", { name: "Đánh giá", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
