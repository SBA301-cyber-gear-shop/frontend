import { test, expect } from "@playwright/test";

test("payment summary stays readable at narrow card widths", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "staff-test");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 2, name: "Staff", role: "Staff" }));
  });
  const order = {
    id: 41, orderCode: "TZ-PAYMENT-TEST", userId: 42, status: "ready_for_pickup",
    pickupName: "Khách", pickupPhone: "0900000128", totalAmount: 11500000,
    discountAmount: 0, finalAmount: 11500000, paymentStatus: "SUCCESS", methodType: "cash",
    deliveryType: "store", createdAt: "2026-11-10T22:00:00", items: [],
  };
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/operations/orders") return route.fulfill({ json: [order] });
    if (path.endsWith("/cash-collection")) return route.fulfill({ json: {
      collectorUserId: 2, collectorName: "Nhân viên cửa hàng Demo",
      collectedAt: "2026-11-10T22:51:00", receivedAmount: 11500000, changeAmount: 0,
    } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/van-hanh/don-hang");
  const cards = page.locator(".payment-summary");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(1).getByText("Nhân viên cửa hàng Demo")).toBeVisible();
  await expect(cards.nth(1).getByText("10/11/2026 · 22:51")).toBeVisible();
  for (const width of [320, 360, 420, 480]) {
    for (const card of [cards.nth(0), cards.nth(1)]) {
      await card.evaluate((element, size) => { element.style.width = `${size}px`; element.style.maxWidth = "none"; }, width);
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBeTruthy();
    }
  }
});
