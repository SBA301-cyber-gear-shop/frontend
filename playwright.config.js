import { defineConfig } from "@playwright/test";
import { env } from "node:process";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  globalSetup: "./tests/e2e/global-setup.js",
  use: {
    baseURL: "http://127.0.0.1:4175",
    channel: env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    { name: "demo", testMatch: "flows.spec.js" },
    {
      name: "api",
      testMatch: ["api-flow.spec.js", "pickup-flow.spec.js", "technician-device-history.spec.js", "intake-accessories.spec.js", "payment-summary.spec.js", "product-details.spec.js", "checkout-hooks.spec.js", "customer-orders.spec.js", "voucher-wallet.spec.js"],
      use: { baseURL: "http://127.0.0.1:4176" },
    },
  ],
});
