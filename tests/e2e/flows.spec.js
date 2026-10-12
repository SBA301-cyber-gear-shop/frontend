import { test, expect } from "@playwright/test";
import { demoAccounts } from "../../src/data/seed.js";
const customer = demoAccounts[0],
  staff = demoAccounts[1],
  technician = demoAccounts[2],
  admin = demoAccounts[3];
async function session(page, user) {
  await page.goto("/");
  await page.evaluate((u) => {
    sessionStorage.setItem("techzone-session", JSON.stringify(u));
  }, user);
}
async function login(page, role = "Customer") {
  await page.goto("/dang-nhap");
  await page.getByText("Tài khoản trải nghiệm · Demo").click();
  await page.getByRole("button", { name: role, exact: true }).click();
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
  await page.getByText("Tài khoản trải nghiệm · Demo").click();
  await page.getByRole("button", { name: "Customer", exact: true }).click();
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
    page.getByText("Đã bàn giao và kích hoạt bảo hành."),
  ).toBeVisible();
  await login(page, "Customer");
  await page.goto("/bao-hanh");
  await expect(page.getByText("TEST-RAM-A", { exact: true })).toBeVisible();
  await expect(page.getByText("TEST-RAM-B", { exact: true })).toBeVisible();
});
test("builder blocks unknown specs and rechecks RAM edits", async ({
  page,
}) => {
  await page.goto("/build-pc");
  await expect(
    page.getByRole("button", { name: "Mua cấu hình này" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Đề xuất cấu hình" }).click();
  await expect(
    page.getByRole("button", { name: "Mua cấu hình này" }),
  ).toBeEnabled();
  await page.getByLabel("Số lượng ram", { exact: true }).fill("8");
  await expect(
    page.getByRole("button", { name: "Mua cấu hình này" }),
  ).toBeDisabled();
  await page.getByLabel("Số lượng ram", { exact: true }).fill("2");
  await expect(
    page.getByRole("button", { name: "Mua cấu hình này" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Mua cấu hình này" }),
  ).toBeEnabled();
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
test("intake avoids duplicates, technician repairs and staff returns the device", async ({
  page,
}) => {
  const lookup = async (text) => {
    await page.getByLabel("Tra cứu serial hoặc số điện thoại").fill(text);
    await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  };
  await session(page, staff);
  await page.goto("/van-hanh/bao-hanh");
  await lookup("KST26A000428");
  await expect(
    page.getByText("Không tạo trùng ticket cho cùng lần tiếp nhận."),
  ).toBeVisible();
  await lookup("KST26A000429");
  await page.getByLabel("Mô tả lỗi khách báo").fill("Lỗi nhận RAM");
  await page.getByLabel("Tình trạng ngoại quan").fill("Không trầy");
  await page.getByLabel("Phụ kiện nhận giữ").fill("Không có");
  await page.getByLabel("Ngày hẹn trả").fill("2029-01-15");
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
  // Trả khách là việc của lễ tân, kỹ thuật viên không có nút này.
  await page.getByLabel("Ghi chú nội bộ kỹ thuật").fill("Thay khe RAM");
  await page.getByRole("button", { name: "Bắt đầu sửa chữa" }).click();
  await page.getByLabel("Ghi chú nội bộ kỹ thuật").fill("Chạy thử 30 phút");
  await page
    .getByLabel("Thông tin hiển thị cho khách")
    .fill("Đã sửa xong, mời bạn đến nhận.");
  await page.getByRole("button", { name: "Hoàn tất sửa chữa" }).click();
  await expect(page.getByText("Đã sửa xong").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xác nhận đã trả khách" }),
  ).toHaveCount(0);
  await page.evaluate(
    (u) => sessionStorage.setItem("techzone-session", JSON.stringify(u)),
    staff,
  );
  await page.goto("/van-hanh/bao-hanh");
  await lookup("KST26A000429");
  await page.getByLabel("Ghi chú bàn giao hoặc lý do").fill("Khách đã kiểm tra");
  await page.getByRole("button", { name: "Xác nhận đã trả khách" }).click();
  await expect(
    page.getByRole("heading", { name: "Thông tin tiếp nhận" }),
  ).toBeVisible();
  await expect(page.getByText("Đã trả khách").first()).toBeVisible();
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
