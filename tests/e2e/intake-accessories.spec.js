import { test, expect } from "@playwright/test";

test("received items follow selected eligible warranty cards", async ({ page }) => {
  const cards = [
    { id: 1, serialNumber: "RAM-1", productName: "RAM", status: "active", valid: true },
    { id: 2, serialNumber: "FAN-1", productName: "Quạt", status: "active", valid: true },
    { id: 3, serialNumber: "OLD", productName: "RAM cũ", status: "replaced", valid: false },
    { id: 4, serialNumber: "PENDING", productName: "Chưa trả", status: "active", valid: true, replacementPendingReturn: true },
    { id: 5, serialNumber: "EXPIRED", productName: "Hết hạn", status: "active", valid: false },
  ].map((c) => ({ ...c, orderId: 5, orderCode: "ORDER-5", pcCustomId: 7, endDate: "2029-01-01", requests: [], matched: true }));
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 2, name: "Staff", role: "Staff" }));
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    return route.fulfill({ json: { data: path === "/api/warranty-cards" ? cards : [] } });
  });
  await page.goto("/van-hanh/bao-hanh");
  await page.getByLabel("Tra cứu serial hoặc số điện thoại").fill("ORDER-5");
  await page.getByRole("button", { name: "Tra cứu" }).click();
  const dropdown = page.locator(".intake-dropdown");
  await expect(page.getByLabel("RAM", { exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Quạt", { exact: true })).not.toBeChecked();
  await expect(dropdown.locator("summary")).toHaveText("Không có");
  await page.getByLabel("RAM", { exact: true }).check();
  await expect(dropdown.locator("summary")).toContainText("RAM-1");
  await expect(dropdown).not.toContainText("FAN-1");
  await page.getByLabel("Quạt", { exact: true }).check();
  await expect(dropdown.locator("summary")).toContainText("FAN-1");
  await page.getByLabel("RAM", { exact: true }).uncheck();
  await expect(dropdown).not.toContainText("RAM-1");
  await page.getByLabel(/Hết hạn/).check();
  await expect(dropdown).not.toContainText("EXPIRED");
  await expect(dropdown).not.toContainText("PENDING");
  await expect(dropdown).not.toContainText("OLD");
});
