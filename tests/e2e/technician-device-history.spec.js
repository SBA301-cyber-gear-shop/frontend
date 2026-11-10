import { test, expect } from "@playwright/test";

test("technician sees the replacement chain for one device only", async ({ page }) => {
  const previous = { id: 11, requestCode: "BH-OLD", status: "returned", resolution: "replaced", createdAt: "2026-11-01" };
  const current = { id: 12, requestCode: "BH-NEW", intakeId: 5, intakeCode: "BH-5", orderCode: "ORDER-5", productName: "RAM", serialNumber: "RAM-NEW", status: "inspecting", version: 0, createdAt: "2026-11-02" };
  const cards = [
    { id: 1, serialNumber: "RAM-OLD", replacedBySerialNumber: "RAM-NEW", requests: [previous] },
    { id: 2, serialNumber: "RAM-NEW", requests: [current] },
    { id: 3, serialNumber: "FAN", requests: [{ ...previous, id: 13, requestCode: "BH-FAN" }] },
  ];
  const detail = { ...current, card: { ...cards[1], productName: "RAM", orderCode: "ORDER-5", status: "active", valid: true }, allowedTransitions: [], events: [] };
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 3, name: "Technician", role: "Technician" }));
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const data = path === "/api/service-requests" ? [current] :
      path === "/api/service-requests/12" ? detail :
      path === "/api/warranty-cards" ? cards :
      path === "/api/service-intakes/5" ? { id: 5, requests: [] } : [];
    return route.fulfill({ json: { data } });
  });
  await page.goto("/ky-thuat");
  const history = page.locator("section").filter({ has: page.getByRole("heading", { name: "Lịch sử linh kiện trong đơn" }) });
  await expect(history).toContainText("RAM-OLD → RAM-NEW");
  await expect(history).toContainText("2 lần tiếp nhận · 0 lần sửa · 1 lần đổi");
  await expect(history).toContainText("BH-OLD");
  await expect(history).toContainText("BH-NEW");
  await expect(history).not.toContainText("FAN");
});
