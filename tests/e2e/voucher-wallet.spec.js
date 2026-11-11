import { expect, test } from "@playwright/test";

test("voucher wallet handles empty and populated states", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "customer-test");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 42, name: "Khách hàng", email: "customer@cybershop.vn", role: "Customer" }));
  });
  let vouchers = [];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    return route.fulfill({ json: path === "/api/me/vouchers" ? vouchers : [] });
  });
  await page.goto("/voucher-cua-toi");
  await expect(page.getByRole("heading", { name: "Bạn chưa có voucher" })).toBeVisible();
  await expect(page.locator(".account-email")).toHaveAttribute("title", "customer@cybershop.vn");
  vouchers = [
    { id: 1, code: "TESTSALE", name: "Ưu đãi test", type: "percentage", value: 5, status: "AVAILABLE", start: "2026-11-01", end: "2026-12-01" },
    { id: 2, code: "OLDCODE", name: "Đã sử dụng", type: "fixed_amount", value: 10000, status: "USED", start: "2026-10-01", end: "2026-11-01" },
  ];
  await page.reload();
  await expect(page.getByText("TESTSALE")).toBeVisible();
  await page.getByLabel("Trạng thái voucher của tôi").selectOption("USED");
  await expect(page.getByText("OLDCODE")).toBeVisible();
  await expect(page.getByText("TESTSALE")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
