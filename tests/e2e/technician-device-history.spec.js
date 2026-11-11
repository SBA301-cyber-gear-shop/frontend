import { test, expect } from "@playwright/test";

test("changing a technician request keeps the editor mounted", async ({ page }) => {
  const card = { id: 1, serialNumber: "RAM-1", productName: "RAM", orderCode: "ORDER-5", status: "active", valid: true, requests: [] };
  let ticket = { id: 12, requestCode: "BH-NEW", intakeId: 5, intakeCode: "BH-5", orderCode: "ORDER-5", productName: "RAM", serialNumber: card.serialNumber, status: "received", version: 0, card, canAddNote: true, allowedTransitions: [{ toStatus: "inspecting", resolutions: [] }], events: [] };
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 3, name: "Technician", role: "Technician" }));
    window.__pageMarker = Math.random();
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path.endsWith("/transitions")) ticket = { ...ticket, status: "inspecting", version: 1, allowedTransitions: [] };
    const data = path === "/api/service-requests" ? [ticket] : path === "/api/service-requests/12" || path.endsWith("/transitions") ? ticket :
      path === "/api/warranty-cards" ? [card] : path === "/api/service-intakes/5" ? { id: 5, requests: [] } : [];
    return route.fulfill({ json: { data } });
  });
  await page.goto("/ky-thuat");
  const note = page.getByLabel("Ghi chú nội bộ kỹ thuật");
  await note.fill("Đã kiểm tra");
  await note.evaluate((element) => { element.dataset.testMounted = "yes"; });
  const marker = await page.evaluate(() => window.__pageMarker);
  await page.getByRole("button", { name: "Bắt đầu kiểm tra" }).click();
  await expect(page.getByRole("button", { name: "Bắt đầu kiểm tra" })).toHaveCount(0);
  await expect(note).toHaveAttribute("data-test-mounted", "yes");
  await expect(note).toHaveValue("");
  expect(await page.evaluate(() => window.__pageMarker)).toBe(marker);
});

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
  await expect(history).toContainText("2 lần tiếp nhận");
  await expect(history).toContainText("0 lần sửa");
  await expect(history).toContainText("1 lần đổi");
  await expect(history).toContainText("BH-OLD");
  await expect(history).toContainText("BH-NEW");
  await expect(history).not.toContainText("FAN");
});

test("customer sees chain totals only when a device was replaced", async ({ page }) => {
  const cards = [
    { id: 1, serialNumber: "RAM-OLD", replacedBySerialNumber: "RAM-NEW", requests: [{ id: 10, requestCode: "BH-OLD-10", status: "returned", resolution: "replaced" }] },
    { id: 2, serialNumber: "RAM-NEW", requests: [] },
    { id: 3, serialNumber: "FAN", requests: [] },
  ].map((card) => ({ ...card, productName: "Thiết bị", orderCode: "ORDER-5", status: "active", valid: true, startDate: "2026-01-01", endDate: "2029-01-01" }));
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 42, name: "Customer", role: "Customer" }));
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    return route.fulfill({ json: { data: path === "/api/my/warranty-cards" ? cards : [] } });
  });
  await page.goto("/bao-hanh");
  await page.getByLabel("Tìm serial bảo hành").fill("FAN");
  await page.getByText("Lịch sử thiết bị").click();
  await expect(page.getByText("0 lần tiếp nhận")).toHaveCount(1);
  await expect(page.getByText("Chuỗi serial")).toHaveCount(0);
  await page.getByLabel("Tìm serial bảo hành").fill("RAM-NEW");
  await page.getByText("Lịch sử thiết bị").click();
  await expect(page.getByText("Chuỗi serial")).toBeVisible();
  await expect(page.getByText("1 lần đổi")).toBeVisible();
  await expect(page.locator(".customer-history-result")).toContainText("Serial mới: RAM-NEW");
  await expect(page.getByText("BH-OLD-10")).toHaveCount(0);
});

test("replacement serial is validated for stock and supplier", async ({ page }) => {
  const card = { id: 1, serialNumber: "RAM-OLD", productName: "RAM", orderCode: "ORDER-5", status: "active", valid: true, requests: [] };
  const ticket = { id: 12, requestCode: "BH-NEW", intakeId: 5, intakeCode: "BH-5", orderCode: "ORDER-5", productName: "RAM", serialNumber: card.serialNumber, status: "repairing", version: 0, card, canReplaceDevice: true, replacementInStock: true, allowedTransitions: [], events: [] };
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "test-token");
    sessionStorage.setItem("techzone-session", JSON.stringify({ id: 3, name: "Technician", role: "Technician" }));
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const data = path === "/api/service-requests" ? [ticket] : path === "/api/service-requests/12" ? ticket :
      path === "/api/warranty-cards" ? [card] : path === "/api/service-intakes/5" ? { id: 5, requests: [] } : [];
    return route.fulfill({ json: { data } });
  });
  await page.goto("/ky-thuat");
  const serial = page.getByLabel("Serial thiết bị thay thế");
  const replace = page.getByRole("button", { name: "Đổi thiết bị", exact: true });
  await expect(replace).toBeDisabled();
  await page.getByLabel("Nguồn thiết bị thay thế").selectOption("stock");
  await serial.fill(" ram-old ");
  await serial.blur();
  await expect(page.getByText("Serial này đã có thẻ bảo hành trong đơn.")).toBeVisible();
  await expect(replace).toBeDisabled();
  await serial.fill("RAM-NEW");
  await expect(replace).toBeEnabled();
  await expect(serial).toHaveAttribute("maxlength", "100");
  await page.getByLabel("Nguồn thiết bị thay thế").selectOption("supplier");
  await expect(replace).toBeEnabled();
});
