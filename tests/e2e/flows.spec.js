import { test, expect } from "@playwright/test";
import { demoAccounts } from "../../src/store/demo/index.js";
const customer = demoAccounts[0],
  staff = demoAccounts[1],
  technician = demoAccounts[2],
  admin = demoAccounts[3];
// Auth now uses the backend. Intercept it in tests instead of relying on
// removed demo-login buttons or contacting a developer's live API.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    const payload = route.request().postDataJSON();
    const account = demoAccounts.find(
      (user) =>
        (user.email === payload.identity || user.phone === payload.identity) &&
        user.password === payload.password,
    );
    await route.fulfill({
      status: account ? 200 : 401,
      json: account
        ? {
            data: {
              accessToken: "test-token",
              user: {
                id: account.id,
                fullName: account.name,
                email: account.email,
                phone: account.phone,
                role: account.role,
              },
            },
          }
        : { message: "Thông tin đăng nhập không đúng." },
    });
  });
  await page.route("**/api/auth/register", async (route) => {
    const payload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        data: {
          accessToken: "test-register-token",
          user: {
            id: "registered-customer",
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            role: "Customer",
          },
        },
      },
    });
  });
});
async function session(page, user) {
  await page.goto("/");
  await page.evaluate((u) => {
    sessionStorage.setItem("techzone-session", JSON.stringify(u));
  }, user);
}
async function login(page, role = "Customer") {
  await page.goto("/dang-nhap");
  const account = demoAccounts.find((user) => user.role === role);
  await page.locator("#identity").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}
const screens = [
  ["landing", "/", null],
  ["home", "/cua-hang", null],
  ["monitors", "/danh-muc/monitor", null],
  ["laptops", "/danh-muc/laptop", null],
  ["product", "/san-pham/ram16", null],
  ["builder", "/build-pc", null],
  ["cart", "/gio-hang", null],
  ["login", "/dang-nhap", null],
  ["register", "/dang-ky", null],
  ["orders", "/don-hang", customer],
  ["order-detail", "/don-hang/TZ-261001-0128", customer],
  ["warranty", "/bao-hanh", customer],
  ["account", "/tai-khoan", customer],
  ["staff", "/van-hanh/don-hang", staff],
  ["handover", "/van-hanh/ban-giao", staff],
  ["intake", "/van-hanh/bao-hanh", staff],
  ["technician", "/ky-thuat", technician],
  ["admin-product", "/quan-tri/san-pham", admin],
  ["admin-specs", "/quan-tri/thong-so", admin],
  ["admin-promotion", "/quan-tri/khuyen-mai", admin],
  ["exceptions", "/trang-thai", null],
];
for (const width of [1440, 390]) {
  test(
    "all screens render, no console errors or horizontal overflow at " +
      width +
      "px",
    async ({ page }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      for (const [name, path, user] of screens) {
        await page.goto("/");
        await page.evaluate((u) => {
          if (u) sessionStorage.setItem("techzone-session", JSON.stringify(u));
          else sessionStorage.removeItem("techzone-session");
        }, user);
        await page.goto(path);
        await expect(page.locator("main").first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(await page.locator("body").innerText()).not.toContain(
          "Trang chưa tải được",
        );
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 2,
        );
        expect.soft(overflow, name + " width overflow").toBeFalsy();
        await page.screenshot({
          path: "test-results/screens/" + name + "-" + width + ".png",
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    },
  );
}
test("shopping, authentication, checkout, staff payment and per-unit handover", async ({
  page,
}) => {
  await page.goto("/san-pham/ram16");
  await page
    .getByRole("button", { name: "Tăng Số lượng", exact: true })
    .click();
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await page.goto("/san-pham/ssd1");
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await page.goto("/gio-hang");
  await expect(page.locator(".total")).toContainText("4.090.000");
  await page.getByRole("link", { name: "Tiếp tục đặt hàng" }).click();
  await expect(page).toHaveURL(/dang-nhap/);
  await page.locator("#identity").fill(customer.email);
  await page.locator("#password").fill(customer.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/thanh-toan/);
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(
    page.getByRole("heading", { name: "Đã tạo đơn hàng của bạn" }),
  ).toBeVisible();
  const orderId = new URL(page.url()).pathname.split("/").pop();
  await expect(page.locator(".total")).toContainText("4.090.000");
  await login(page, "Staff");
  await page.goto("/van-hanh/don-hang?id=" + orderId);
  for (const name of [
    "Xác nhận đơn",
    "Bắt đầu chuẩn bị",
    "Đánh dấu sẵn sàng nhận",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Xác nhận đã thu đủ", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Đã thu đủ tiền", exact: true })
    .click();
  await page.getByRole("button", { name: "Tiếp tục bàn giao" }).click();
  await page
    .getByLabel("Kingston FURY Beast DDR5 · Thiết bị 1", { exact: true })
    .fill("TEST-RAM-A");
  await page
    .getByLabel("Kingston FURY Beast DDR5 · Thiết bị 2", { exact: true })
    .fill("TEST-RAM-B");
  await page
    .getByLabel("Ổ cứng NVMe 1TB · Thiết bị 1", { exact: true })
    .fill("TEST-SSD-A");
  await page
    .getByLabel("Đã đối chiếu người nhận, serial và bàn giao đủ hàng.")
    .check();
  await page
    .getByRole("button", { name: "Hoàn tất bàn giao", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bước tiếp theo", exact: true }),
  ).toHaveCount(0);
  await login(page, "Customer");
  await page.goto("/bao-hanh");
  await expect(page.getByText("TEST-RAM-A", { exact: true })).toBeVisible();
  await expect(page.getByText("TEST-RAM-B", { exact: true })).toBeVisible();
});
test("builder demo explains that AI Build PC needs the backend and keeps the button off", async ({
  page,
}) => {
  await page.goto("/build-pc");
  await expect(page.getByText("Bản demo chạy không có backend")).toBeVisible();
  await page.locator("#inputBudget").fill("25000000");
  await page.locator("#inputNeed").fill("Văn phòng, Excel, họp online");
  await expect(
    page.getByRole("button", { name: "Đề xuất cấu hình với AI", exact: true }),
  ).toBeDisabled();
});
test("admin product and specification updates persist", async ({ page }) => {
  await session(page, admin);
  await page.goto("/quan-tri/san-pham");
  await page.getByLabel("Giá bán (₫)", { exact: true }).fill("1250000");
  await page.getByRole("button", { name: "Lưu & đăng bán" }).click();
  await page.goto("/san-pham/ram16");
  await expect(page.locator(".product-detail .price")).toContainText(
    "1.250.000",
  );
  await page.goto("/quan-tri/thong-so");
  await page
    .getByRole("switch", { name: "Bộ lọc Chuẩn RAM", exact: true })
    .click();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await page.reload();
  await expect(
    page.getByRole("switch", { name: "Bộ lọc Chuẩn RAM", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
});
test("intake avoids duplicates and technician can progress ticket", async ({
  page,
}) => {
  await session(page, staff);
  await page.goto("/van-hanh/bao-hanh");
  await expect(
    page.getByText("Không tạo trùng ticket cho cùng lần tiếp nhận."),
  ).toBeVisible();
  await page
    .getByLabel("Tra cứu serial hoặc số điện thoại")
    .fill("KST26A000429");
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  await page.getByLabel("Mô tả lỗi khách báo").fill("Lỗi nhận RAM");
  await page.getByLabel("Tình trạng ngoại quan").fill("Không trầy");
  await page.getByLabel("Phụ kiện nhận giữ").fill("Không có");
  await page
    .getByLabel("Đã đối chiếu serial và nhận thiết bị từ khách.")
    .check();
  await page.getByRole("button", { name: "Tạo phiếu tiếp nhận" }).click();
  await expect(
    page.getByRole("heading", { name: "Biên nhận đã tạo" }),
  ).toBeVisible();
  await page.evaluate(
    (u) => sessionStorage.setItem("techzone-session", JSON.stringify(u)),
    technician,
  );
  await page.goto("/ky-thuat");
  await page.getByLabel("Ghi chú nội bộ kỹ thuật").fill("Bắt đầu kiểm tra");
  await page
    .getByRole("button", { name: "Bắt đầu kiểm tra", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu sửa chữa" }),
  ).toBeVisible();
});
test("customer cannot access administration", async ({ page }) => {
  await session(page, customer);
  await page.goto("/quan-tri/san-pham");
  await expect(
    page.getByRole("heading", { name: "Bạn chưa có quyền truy cập" }),
  ).toBeVisible();
});
test("catalog filters and variant price change", async ({ page }) => {
  await page.goto("/danh-muc/monitor");
  await page.getByRole("checkbox", { name: "ASUS", exact: true }).check();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/san-pham/ram16");
  await page.getByRole("button", { name: /32GB \/ 5600/ }).click();
  await expect(page.locator(".product-detail .price")).toContainText(
    "2.100.000",
  );
});

test("registration validates fields and stores the API session", async ({
  page,
}) => {
  await page.goto("/dang-ky");
  await page
    .getByRole("button", { name: "Đăng ký tài khoản", exact: true })
    .click();
  await expect(page.locator("#identity")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#name").fill("Khách kiểm thử");
  await page.locator("#phone").fill("0912345678");
  await page.locator("#identity").fill("New.User@example.com");
  await page.locator("#password").fill("Example123");
  await page.locator("#confirm").fill("Example123");
  const requestPromise = page.waitForRequest("**/api/auth/register");
  await page
    .getByRole("button", { name: "Đăng ký tài khoản", exact: true })
    .click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    fullName: "Khách kiểm thử",
    phone: "0912345678",
    email: "new.user@example.com",
    password: "Example123",
    address: "",
  });
  await expect(page).toHaveURL(/tai-khoan/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("techzone-token")),
  ).toBe("test-register-token");
});

test("login keeps API errors visible and preserves the requested destination", async ({
  page,
}) => {
  await page.goto("/don-hang");
  await expect(page).toHaveURL(/dang-nhap/);
  await page.locator("#identity").fill(customer.email);
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Thông tin đăng nhập không đúng.")).toBeVisible();
  await page.locator("#password").fill(customer.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/don-hang/);
});

test("legacy URLs and not-found behavior survive the route split", async ({
  page,
}) => {
  await page.goto("/03-monitors.html");
  await expect(page).toHaveURL(/danh-muc\/monitor/);
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.goto("/san-pham/missing-product");
  await expect(page.getByText("Sản phẩm không còn khả dụng")).toBeVisible();
  await page.goto("/missing-route");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy trang" }),
  ).toBeVisible();
});
