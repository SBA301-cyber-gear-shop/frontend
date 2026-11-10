import { test, expect } from "@playwright/test";

test("checkout renders after asynchronous cart validation", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("techzone-token", "customer-test");
    sessionStorage.setItem("techzone-session", JSON.stringify({
      id: 42, name: "Khách", phone: "0900000128", role: "Customer",
    }));
  });
  const product = {
    id: 101, productId: 10, name: "RAM kiểm thử", category: "ram", brand: "Kingston",
    variant: "Tiêu chuẩn", price: 1000000, originalPrice: 1000000,
    stock: 5, warranty: 36, status: "active", specs: {},
  };
  const cart = {
    cartId: 1, userId: 42, totalQuantity: 1, totalAmount: 1000000,
    items: [{ cartItemId: 1, productVariantId: 101, productName: product.name,
      variantName: product.variant, unitPrice: 1000000, quantity: 1,
      subtotal: 1000000, stockQuantity: 5, available: true }],
  };
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/products") return route.fulfill({ json: [product] });
    if (path === "/api/orders/cart") return route.fulfill({ json: { data: cart } });
    if (path === "/api/checkout/validate") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return route.fulfill({ json: { ...cart, valid: true } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/thanh-toan");
  await expect(page.getByRole("heading", { name: "Xác nhận đơn hàng" })).toBeVisible();
  await expect(page.getByText("RAM kiểm thử").first()).toBeVisible();
  await expect(page.getByText(/Rendered more hooks/)).toHaveCount(0);
  expect(errors).toEqual([]);
});
