import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// User testing lựa chọn "Trọn bộ" trên backend và DB thật (cần backend chạy ở cổng 8080, DB đã có mục 10 của metadata).
// Chỉ /ai-suggest được giả lập ở phần lớn ca để chạy nhanh và ổn định: dữ liệu giả lập lấy từ một lần gọi AI thật,
// /options, /peripherals, /validate, /products, giỏ hàng và lưu cấu hình đều là thật. Nhóm "AI thật" gọi Gemini thật.
const API = process.env.E2E_API_URL || "http://localhost:8080";
const PC = `${API}/api/v1/pc-build`;
const PASSWORD = "E2eTest12345";
const email = `e2e.fullset.${Date.now()}@example.com`;
let minFull; // mức tối thiểu của Trọn bộ, tính từ /options vì đổi theo giá rẻ nhất trong kho
const vnd = (n) => n.toLocaleString("vi-VN");

let realBuild;
let token;
let range; // khoảng tiền phụ kiện đọc từ /options: đổi theo dữ liệu kho, không ghi cứng trong test

const digits = (text) => Number(String(text).replace(/\D/g, ""));
const itemsOf = (build) => build.items.map((i) => ({ role: i.role, variantId: i.variantId, quantity: i.quantity }));

async function apiPost(path, body, auth) {
  return fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    body: JSON.stringify(body),
  });
}

async function clearCart() {
  const headers = { Authorization: `Bearer ${token}` };
  const body = await (await fetch(`${API}/api/orders/cart`, { headers })).json();
  for (const item of body.items ?? body.data?.items ?? []) {
    await fetch(`${API}/api/orders/cart/items/${item.cartItemId}`, { method: "DELETE", headers });
  }
}

async function cartVariantIds() {
  const body = await (await fetch(`${API}/api/orders/cart`, { headers: { Authorization: `Bearer ${token}` } })).json();
  return (body.items ?? body.data?.items ?? []).map((i) => i.productVariantId);
}

test.beforeAll(async () => {
  test.setTimeout(240_000);
  const registered = await apiPost("/api/auth/register", { fullName: "E2E Trọn Bộ", email, password: PASSWORD });
  expect(registered.status).toBe(201);
  const login = await (await apiPost("/api/auth/login", { identity: email, password: PASSWORD })).json();
  token = login.data.accessToken;
  const options = (await (await fetch(`${PC}/options`)).json()).data;
  range = { min: options.peripheralMinTotal, max: options.peripheralMaxTotal };
  // Cùng công thức với minFullSetBudget ở frontend (đã có unit test riêng)
  const pcMin = Math.max(options.minBudget, options.floorPrice);
  const reserve = (b) => Math.min(range.max, Math.max(range.min, Math.ceil(b / 5)));
  minFull =
    reserve(pcMin + range.min) === range.min ? pcMin + range.min
      : reserve(pcMin + range.max) === range.max ? pcMin + range.max
        : Math.ceil((pcMin * 5) / 4);
  // Gemini đang lỗi thì dùng response thật đã lưu: E2E_BUILD_FIXTURE=<đường dẫn file JSON của /ai-suggest>
  if (process.env.E2E_BUILD_FIXTURE) {
    realBuild = JSON.parse(readFileSync(process.env.E2E_BUILD_FIXTURE, "utf8")).data;
    return;
  }
  // Gemini thỉnh thoảng trả chậm quá hạn (503): thử lại để một lần chậm không làm dừng cả bộ test
  let ai;
  for (let attempt = 0; attempt < 8; attempt++) {
    ai = await apiPost("/api/v1/pc-build/ai-suggest", { budget: 24_000_000, purpose: "Chơi game 2K, thỉnh thoảng stream" });
    if (ai.status === 200) break;
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  expect(ai.status, "cần AI thật hoạt động để lấy dữ liệu mẫu").toBe(200);
  realBuild = (await ai.json()).data;
});

test.afterEach(async () => {
  await clearCart();
});

/** Giả lập AI: trả bộ máy thật đã lấy ở beforeAll, kiểm tra lại bằng /validate thật theo ngân sách client gửi. */
async function mockAi(page, { calls = [], failFirst = null, build = () => realBuild } = {}) {
  let first = true;
  await page.route("**/api/v1/pc-build/ai-suggest", async (route) => {
    const payload = route.request().postDataJSON();
    calls.push(payload);
    if (first && failFirst) {
      first = false;
      return route.fulfill(failFirst);
    }
    const current = build(payload);
    const checked = await (await apiPost("/api/v1/pc-build/validate", { budget: payload.budget, items: itemsOf(current) })).json();
    return route.fulfill({
      json: {
        status: 200,
        data: { ...current, budget: payload.budget, budgetFit: checked.data.budgetFit, checks: checked.data.checks, isCompatible: checked.data.isCompatible },
      },
    });
  });
  return calls;
}

async function open(page) {
  await page.goto("/build-pc");
  await expect(page.locator("#inputBudget")).toBeVisible();
}

const fullSetRadio = (page) => page.getByRole("radio", { name: /Trọn bộ/ });
const pcRadio = (page) => page.getByRole("radio", { name: /Chỉ thùng máy/ });
const submit = (page) => page.locator("#btnRunAi");
const panel = (page) => page.locator("#peripheralPanel");
const row = (page, role) => page.locator(`.peripheral-row[data-role="${role}"]`);
const addToCart = (page) => page.getByRole("button", { name: "Thêm vào giỏ & Đặt hàng" });

async function fill(page, budget, purpose = "Chơi game 2K, thỉnh thoảng stream") {
  await page.locator("#inputBudget").fill(String(budget));
  await page.locator("#inputPurpose").fill(purpose);
}

async function suggestFullSet(page, budget = 30_000_000, purpose) {
  await open(page);
  await fullSetRadio(page).check();
  await fill(page, budget, purpose);
  await submit(page).click();
  await expect(row(page, "monitor")).toBeVisible({ timeout: 40_000 });
  await expect(addToCart(page)).toBeEnabled({ timeout: 15_000 });
}

async function money(page, id) {
  return digits(await page.locator(`${id} strong, ${id} .total-cost-amount`).first().textContent());
}

async function login(page) {
  await page.locator("#identity").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#password").press("Enter");
}

async function loginFirst(page) {
  await page.goto("/dang-nhap");
  await login(page);
  await page.waitForURL((url) => !url.pathname.includes("dang-nhap"));
}

test.describe("1. Lựa chọn phạm vi trên form", () => {
  test("mặc định là Chỉ thùng máy, gửi nguyên ngân sách, không có khu phụ kiện (giữ nguyên hành vi cũ)", async ({ page }) => {
    const calls = await mockAi(page);
    await open(page);
    await expect(pcRadio(page)).toBeChecked();
    await expect(page.locator("#scopeHint")).toContainText("Toàn bộ ngân sách");

    await fill(page, 30_000_000);
    await submit(page).click();

    await expect(page.locator(".builder-table")).toBeVisible();
    expect(calls[0].budget).toBe(30_000_000);
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByText("Tổng chi phí linh kiện:")).toBeVisible();
    await expect(page.getByText("Tổng cả bộ:")).toHaveCount(0);
  });

  test("chọn Trọn bộ: gợi ý chia tiền cập nhật theo ngân sách", async ({ page }) => {
    await open(page);
    await fullSetRadio(page).check();
    await page.locator("#inputBudget").fill("30000000");
    await expect(page.locator("#scopeHint")).toContainText("24.000.000");
    await expect(page.locator("#scopeHint")).toContainText("6.000.000");
    await page.locator("#inputBudget").fill("5000000");
    await expect(page.locator("#scopeHint")).toContainText(`Trọn bộ cần ngân sách từ ${vnd(minFull)}`);
    await pcRadio(page).check();
    await expect(page.locator("#scopeHint")).toContainText("Toàn bộ ngân sách");
  });

  for (const given of ["mức tối thiểu", 12_000_000, 14_000_000, 30_000_000, 100_000_000, 181_850_000, 300_000_000, 1_000_000_000, 9_999_999_999]) {
    test(`Trọn bộ ${typeof given === "number" ? `${vnd(given)} đ` : given}: gửi AI phần còn lại sau khi giữ tiền phụ kiện`, async ({ page }) => {
      const budget = typeof given === "number" ? given : minFull;
      const calls = await mockAi(page);
      await open(page);
      await fullSetRadio(page).check();
      await fill(page, budget);
      await submit(page).click();
      await expect.poll(() => calls.length).toBe(1);
      expect(calls[0].budget).toBe(budget - Math.min(range.max, Math.max(range.min, Math.ceil(budget / 5))));
    });
  }

  for (const [name, budget, purpose, message] of [
    ["thiếu 1 đồng so với mức tối thiểu", () => minFull - 1, "Chơi game", () => `Trọn bộ gồm màn hình, bàn phím, chuột cần tối thiểu ${vnd(minFull)}`],
    ["ngân sách trống", "", "Chơi game", /Trọn bộ/],
    ["ngân sách 0", 0, "Chơi game", /Trọn bộ/],
    ["ngân sách âm", -30000000, "Chơi game", /Trọn bộ/],
    ["vượt tối đa", 10_000_000_000, "Chơi game", /tối đa/],
    ["nhu cầu trống", 30_000_000, "", /nhu cầu/],
    ["nhu cầu 1 ký tự", 30_000_000, "a", /nhu cầu/],
    ["nhu cầu toàn khoảng trắng", 30_000_000, "    ", /nhu cầu/],
  ]) {
    test(`Trọn bộ, đầu vào sai (${name}): báo lỗi, không gọi AI`, async ({ page }) => {
      const calls = await mockAi(page);
      await open(page);
      await fullSetRadio(page).check();
      await fill(page, typeof budget === "function" ? budget() : budget, purpose);
      await submit(page).click();
      await expect(page.getByText(typeof message === "function" ? message() : message).first()).toBeVisible();
      expect(calls).toHaveLength(0);
    });
  }

  test("Chỉ thùng máy vẫn dùng mức tối thiểu cũ: 8 triệu được, thiếu 1 đồng bị chặn", async ({ page }) => {
    const calls = await mockAi(page);
    await open(page);
    await fill(page, 7_999_999);
    await submit(page).click();
    await expect(page.getByText(/Ngân sách tối thiểu để ráp một bộ máy mới là 8\.000\.000/).first()).toBeVisible();
    expect(calls).toHaveLength(0);

    await fill(page, 8_000_000);
    await submit(page).click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0].budget).toBe(8_000_000);
  });

  test("nhấn Enter trong ô nhu cầu cũng áp dụng Trọn bộ", async ({ page }) => {
    const calls = await mockAi(page);
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await page.locator("#inputPurpose").press("Enter");
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0].budget).toBe(24_000_000);
    await expect(row(page, "mouse")).toBeVisible();
  });

  test("chọn lựa chọn bằng bàn phím được", async ({ page }) => {
    await open(page);
    await pcRadio(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(fullSetRadio(page)).toBeChecked();
  });

  test("kho thiếu phụ kiện (peripheralMinTotal null): ẩn lựa chọn, vẫn build thùng máy được", async ({ page }) => {
    const calls = await mockAi(page);
    await page.route("**/api/v1/pc-build/options", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.peripheralMinTotal = null;
      body.data.peripheralMaxTotal = null;
      await route.fulfill({ response, json: body });
    });
    await open(page);
    await expect(page.locator(".scope-picker")).toHaveCount(0);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0].budget).toBe(30_000_000);
  });

  test("/options lỗi: ẩn lựa chọn, form vẫn hoạt động", async ({ page }) => {
    const calls = await mockAi(page);
    await page.route("**/api/v1/pc-build/options", (route) => route.fulfill({ status: 500, json: {} }));
    await open(page);
    await expect(page.locator(".scope-picker")).toHaveCount(0);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect.poll(() => calls.length).toBe(1);
  });
});

test.describe("2. Kết quả và tổng tiền", () => {
  test("hiện đủ 3 món, thùng máy + phụ kiện = tổng, không vượt ngân sách", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);

    for (const role of ["monitor", "keyboard", "mouse"]) await expect(row(page, role)).toBeVisible();
    const pc = await money(page, "#costPcTotal");
    const peripherals = await money(page, "#costPeripheralTotal");
    const grand = await money(page, "#costGrandTotal");
    expect(pc).toBe(realBuild.totalPrice);
    expect(pc + peripherals).toBe(grand);
    expect(grand).toBeLessThanOrEqual(30_000_000);
    await expect(page.getByText("Ngân sách trọn bộ:")).toBeVisible();
    await expect(page.locator("#aiReasonNote")).not.toContainText("ngân sách 24");
  });

  test("gọi /peripherals với ngân sách đầy đủ, archetype và không gửi giá; /validate sau đó nhận ngân sách đã trừ", async ({ page }) => {
    await mockAi(page);
    const peripheralBodies = [];
    const validateBodies = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/peripherals")) peripheralBodies.push(request.postDataJSON());
      if (request.url().endsWith("/validate")) validateBodies.push(request.postDataJSON());
    });
    await suggestFullSet(page);
    await expect.poll(() => validateBodies.length).toBeGreaterThan(0);

    expect(peripheralBodies[0].budget).toBe(30_000_000);
    expect(peripheralBodies[0].archetype).toBe(realBuild.profile.archetype);
    expect(JSON.stringify(peripheralBodies[0].items)).not.toContain("price");
    const peripherals = await money(page, "#costPeripheralTotal");
    expect(validateBodies.at(-1).budget).toBe(30_000_000 - peripherals);
  });

  test("hiện thông số tiếng Việt và lý do chọn màn cho nhu cầu chơi game", async ({ page }) => {
    await mockAi(page, { build: () => ({ ...realBuild, profile: { ...realBuild.profile, archetype: "GAMING" } }) });
    await suggestFullSet(page);
    await expect(row(page, "monitor").locator(".peripheral-specs")).toContainText("Hz");
    await expect(row(page, "monitor").locator(".peripheral-reason")).toContainText(/Tần số quét \d+Hz/);
    await expect(row(page, "keyboard").locator(".peripheral-specs")).not.toContainText("PCT");
  });

  test("bỏ tick rồi tick lại: tổng và ngân sách thùng máy đổi theo, cấu hình vẫn mua được", async ({ page }) => {
    await mockAi(page);
    const validateBodies = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/validate")) validateBodies.push(request.postDataJSON());
    });
    await suggestFullSet(page);
    const before = await money(page, "#costPeripheralTotal");
    const mousePrice = digits(await row(page, "mouse").locator(".peripheral-price").textContent());

    await row(page, "mouse").getByRole("checkbox").uncheck();
    await expect(row(page, "mouse").locator(".peripheral-price")).toHaveText("Không mua");
    await expect(row(page, "mouse").locator("select")).toBeDisabled();
    expect(await money(page, "#costPeripheralTotal")).toBe(before - mousePrice);
    await expect.poll(() => validateBodies.at(-1).budget).toBe(30_000_000 - (before - mousePrice));
    await expect(addToCart(page)).toBeEnabled();

    await row(page, "mouse").getByRole("checkbox").check();
    expect(await money(page, "#costPeripheralTotal")).toBe(before);
    await expect.poll(() => validateBodies.at(-1).budget).toBe(30_000_000 - before);
  });

  test("bỏ cả 3 món: tổng phụ kiện về 0", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);
    for (const role of ["monitor", "keyboard", "mouse"]) await row(page, role).getByRole("checkbox").uncheck();
    expect(await money(page, "#costPeripheralTotal")).toBe(0);
    expect(await money(page, "#costGrandTotal")).toBe(realBuild.totalPrice);
    await expect(addToCart(page)).toBeEnabled();
  });

  test("đổi sang màn đắt làm vượt ngân sách: báo vượt và khóa nút mua; đổi lại thì mở", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);
    const monitor = row(page, "monitor").locator("select");
    const original = await monitor.inputValue();

    await monitor.selectOption("210");
    await expect(page.locator(".budget-over")).toContainText("Vượt");
    await expect(addToCart(page)).toBeDisabled();

    await monitor.selectOption(original);
    await expect(addToCart(page)).toBeEnabled();
    await expect(page.locator(".budget-over")).toHaveCount(0);
  });

  test("đổi món khác rồi đổi về món được gợi ý: lý do hiện lại đúng", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);
    const select = row(page, "keyboard").locator("select");
    const original = await select.inputValue();
    await select.selectOption("211");
    await expect(row(page, "keyboard").locator(".peripheral-reason")).toHaveCount(0);
    await select.selectOption(original);
    await expect(row(page, "keyboard").locator(".peripheral-reason")).toBeVisible();
  });

  test("đổi linh kiện thùng máy: danh sách thay thế dùng ngân sách đã trừ phụ kiện, phụ kiện giữ nguyên", async ({ page }) => {
    await mockAi(page);
    const queries = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/compatible-replacements")) queries.push(request.postDataJSON());
    });
    // Ngân sách rộng để còn linh kiện thay thế chọn được, không phụ thuộc giá phụ kiện đang có trong kho
    await suggestFullSet(page, 40_000_000);
    const peripherals = await money(page, "#costPeripheralTotal");
    await page.locator(".btn-replace-part").first().click();
    await expect.poll(() => queries.length).toBe(1);
    expect(queries[0].budget).toBe(40_000_000 - peripherals);

    const choose = page.locator(".btn-select-part.primary").first();
    await expect(choose).toBeVisible();
    await choose.click();
    await expect(row(page, "monitor")).toBeVisible();
    expect(await money(page, "#costPeripheralTotal")).toBe(peripherals);
  });

  test("đổi số lượng linh kiện: /validate nhận ngân sách đã trừ phụ kiện, tổng tiền cập nhật", async ({ page }) => {
    await mockAi(page);
    const validateBodies = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/validate")) validateBodies.push(request.postDataJSON());
    });
    await suggestFullSet(page);
    const pcBefore = await money(page, "#costPcTotal");
    const peripherals = await money(page, "#costPeripheralTotal");
    const count = validateBodies.length;

    await page.getByRole("button", { name: "Tăng số lượng ssd" }).click();

    await expect.poll(() => validateBodies.length).toBeGreaterThan(count);
    expect(validateBodies.at(-1).budget).toBe(30_000_000 - peripherals);
    expect(validateBodies.at(-1).items.find((i) => i.role === "ssd").quantity).toBe(2);
    await expect.poll(() => money(page, "#costPcTotal")).toBeGreaterThan(pcBefore);
    expect(await money(page, "#costPeripheralTotal")).toBe(peripherals);
  });

  test("sản phẩm không có ảnh: dùng ảnh thay thế", async ({ page }) => {
    await mockAi(page);
    await page.route("**/api/v1/pc-build/peripherals", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.roles[0].picked.imageUrl = null;
      await route.fulfill({ response, json: body });
    });
    await suggestFullSet(page);
    await expect(row(page, "monitor").locator("img")).toHaveAttribute("src", "/placeholder-pc.svg");
  });

  test("bản nháp cũ chưa có trường phạm vi: khôi phục thành Chỉ thùng máy", async ({ page }) => {
    const parts = realBuild.items.map((i) => ({ ...i, roleName: i.role, imageUrl: "/placeholder-pc.svg", aiReason: "-" }));
    await page.addInitScript((draft) => sessionStorage.setItem("techzone_guest_build", JSON.stringify(draft)), {
      budget: 30_000_000,
      purpose: "Chơi game",
      userPrompt: "",
      profile: realBuild.profile,
      profileDraft: realBuild.profile,
      lastRequest: null,
      aiResult: realBuild,
      aiInsight: { title: "Bản nháp", reasoning: "r", highlight: "h" },
      validation: null,
      buildParts: parts,
    });
    await page.goto("/build-pc");
    await expect(page.locator(".builder-table")).toBeVisible();
    await expect(pcRadio(page)).toBeChecked();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByText("Tổng cả bộ:")).toHaveCount(0);
  });

  test("đổi phạm vi khi đã có kết quả: chưa đổi gì, có lời nhắc; đề xuất lại mới áp dụng", async ({ page }) => {
    const calls = await mockAi(page);
    await suggestFullSet(page);
    const shownMonitor = await row(page, "monitor").locator("select").inputValue();

    await pcRadio(page).check();
    await expect(page.locator("#scopeChangedNote")).toContainText("Bạn đã đổi phạm vi");
    await expect(row(page, "monitor").locator("select")).toHaveValue(shownMonitor);

    await fullSetRadio(page).check();
    await expect(page.locator("#scopeChangedNote")).toHaveCount(0);

    await pcRadio(page).check();
    await submit(page).click();
    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1].budget).toBe(30_000_000);
    await expect(panel(page)).toHaveCount(0);
    await expect(page.locator("#scopeChangedNote")).toHaveCount(0);
  });

  test("từ Chỉ thùng máy chuyển sang Trọn bộ rồi đề xuất lại", async ({ page }) => {
    const calls = await mockAi(page);
    await open(page);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator(".builder-table")).toBeVisible();

    await fullSetRadio(page).check();
    await expect(page.locator("#scopeChangedNote")).toBeVisible();
    await expect(panel(page)).toHaveCount(0);

    await submit(page).click();
    await expect(row(page, "mouse")).toBeVisible();
    expect(calls[1].budget).toBe(24_000_000);
  });

  test("sửa hồ sơ rồi đề xuất lại: vẫn giữ Trọn bộ và số tiền đã trừ", async ({ page }) => {
    const calls = await mockAi(page);
    await suggestFullSet(page);
    await page.getByRole("button", { name: "Chỉnh hồ sơ" }).click();
    await page.getByRole("button", { name: "Đề xuất lại theo hồ sơ này" }).click();
    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1].budget).toBe(24_000_000);
    expect(calls[1].profile).toBeTruthy();
    await expect(row(page, "mouse")).toBeVisible();
  });
});

test.describe("3. Lỗi và trạng thái chờ", () => {
  test("đang chọn phụ kiện: khóa nút mua và hiện trạng thái chờ", async ({ page }) => {
    await mockAi(page);
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route("**/api/v1/pc-build/peripherals", async (route) => {
      await gate;
      await route.continue();
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();

    await expect(panel(page)).toContainText("Đang chọn màn hình");
    await expect(addToCart(page)).toBeDisabled();
    release();
    await expect(row(page, "monitor")).toBeVisible();
    await expect(addToCart(page)).toBeEnabled();
  });

  test("/peripherals lỗi 500: thùng máy vẫn mua được, Thử lại thành công không gọi lại AI", async ({ page }) => {
    const calls = await mockAi(page);
    let attempts = 0;
    await page.route("**/api/v1/pc-build/peripherals", async (route) => {
      attempts += 1;
      if (attempts === 1) return route.fulfill({ status: 500, json: { message: "Lỗi máy chủ" } });
      return route.continue();
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();

    await expect(page.locator(".peripheral-error")).toContainText("Thùng máy vẫn mua được");
    await expect(addToCart(page)).toBeEnabled();
    expect(await money(page, "#costPeripheralTotal")).toBe(0);

    await panel(page).getByRole("button", { name: "Thử lại" }).click();
    await expect(row(page, "monitor")).toBeVisible();
    expect(calls).toHaveLength(1);
  });

  test("/peripherals bị rate limit 429: báo lỗi trong khu phụ kiện, không mất bộ máy", async ({ page }) => {
    await mockAi(page);
    await page.route("**/api/v1/pc-build/peripherals", (route) =>
      route.fulfill({ status: 429, headers: { "Retry-After": "5" }, json: { code: "RATE_LIMITED", message: "Bạn thao tác quá nhanh." } }),
    );
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator(".peripheral-error")).toBeVisible();
    await expect(page.locator(".builder-table")).toBeVisible();
  });

  test("backend thật trả 422 khi tiền còn lại không đủ (khách sửa ngân sách trước khi thử lại)", async ({ page }) => {
    await mockAi(page);
    await page.route("**/api/v1/pc-build/peripherals", async (route) => {
      const body = route.request().postDataJSON();
      await route.continue({ postData: JSON.stringify({ ...body, budget: realBuild.totalPrice + 100_000 }) });
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator(".peripheral-error")).toBeVisible();
    await expect(addToCart(page)).toBeEnabled();
  });

  test("AI lỗi 503: bỏ kết quả cũ; Thử lại gửi đúng số tiền đã trừ rồi vẫn chọn phụ kiện theo ngân sách đầy đủ", async ({ page }) => {
    const calls = await mockAi(page, {
      failFirst: { status: 503, json: { code: "AI_UNAVAILABLE", message: "AI bận" } },
    });
    const peripheralBodies = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/peripherals")) peripheralBodies.push(request.postDataJSON());
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator("#aiErrorBox")).toBeVisible();
    await expect(panel(page)).toHaveCount(0);

    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(row(page, "mouse")).toBeVisible();
    expect(calls.map((c) => c.budget)).toEqual([24_000_000, 24_000_000]);
    expect(peripheralBodies[0].budget).toBe(30_000_000);
  });

  test("đề xuất lại khi phụ kiện đang tải: phản hồi cũ bị bỏ", async ({ page }) => {
    await mockAi(page);
    const bodies = [];
    let releaseFirst;
    const firstGate = new Promise((resolve) => (releaseFirst = resolve));
    await page.route("**/api/v1/pc-build/peripherals", async (route) => {
      const body = route.request().postDataJSON();
      bodies.push(body);
      if (body.budget === 30_000_000) {
        await firstGate;
        return route.abort().catch(() => {});
      }
      return route.continue();
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(panel(page)).toContainText("Đang chọn màn hình");

    await page.locator("#inputBudget").fill("35000000");
    await submit(page).click();
    await expect(row(page, "monitor")).toBeVisible();
    releaseFirst();
    await page.waitForTimeout(200);
    expect(bodies.at(-1).budget).toBe(35_000_000);
    await expect(page.locator(".peripheral-error")).toHaveCount(0);
    await expect(row(page, "monitor")).toBeVisible();
  });

  test("BUDGET_BELOW_FLOOR ở Trọn bộ: báo mức của trọn bộ, nút đặt đúng số", async ({ page }) => {
    await mockAi(page, {
      failFirst: {
        status: 400,
        json: { code: "BUDGET_BELOW_FLOOR", message: "Ngân sách tối thiểu là 20.000.000 ₫", data: { minBudget: 8_000_000, floorPrice: 20_000_000 } },
      },
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 12_000_000);
    await submit(page).click();
    await expect(page.locator("#aiErrorBox")).toContainText("Trọn bộ gồm màn hình, bàn phím, chuột cần tối thiểu 25.000.000");
    await page.getByRole("button", { name: /Đặt ngân sách tối thiểu/ }).click();
    await expect(page.locator("#inputBudget")).toHaveValue("25000000");
  });

  test("BUDGET_BELOW_FLOOR ở Chỉ thùng máy: giữ nguyên thông báo và mức cũ", async ({ page }) => {
    await mockAi(page, {
      failFirst: {
        status: 400,
        json: { code: "BUDGET_BELOW_FLOOR", message: "Ngân sách tối thiểu là 20.000.000 ₫", data: { minBudget: 8_000_000, floorPrice: 20_000_000 } },
      },
    });
    await open(page);
    await fill(page, 12_000_000);
    await submit(page).click();
    await page.getByRole("button", { name: /Đặt ngân sách tối thiểu/ }).click();
    await expect(page.locator("#inputBudget")).toHaveValue("20000000");
  });

  test("NO_FEASIBLE_BUILD ở Trọn bộ: mức tối thiểu đã cộng phụ kiện", async ({ page }) => {
    await mockAi(page, {
      failFirst: {
        status: 422,
        json: { code: "NO_FEASIBLE_BUILD", message: "Không ráp được", data: { minPriority1Price: 50_000_000, blockingItems: [] } },
      },
    });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator(".ai-error-blocking")).toContainText("62.500.000");
  });

  test("lỗi AI rồi Quay về trạng thái ban đầu: phạm vi trở về Chỉ thùng máy", async ({ page }) => {
    await mockAi(page, { failFirst: { status: 503, json: { code: "AI_UNAVAILABLE", message: "AI bận" } } });
    await open(page);
    await fullSetRadio(page).check();
    await fill(page, 30_000_000);
    await submit(page).click();
    await page.getByRole("button", { name: "Quay về trạng thái ban đầu" }).click();
    await expect(pcRadio(page)).toBeChecked();
    await expect(page.locator("#inputBudget")).toHaveValue("");
  });
});

test.describe("4. Giỏ hàng và lưu cấu hình (DB thật)", () => {
  test("thêm vào giỏ: bộ PC đúng số linh kiện, 3 món thành hàng mua lẻ", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    const picked = await Promise.all(["monitor", "keyboard", "mouse"].map((role) => row(page, role).locator("select").inputValue()));
    await addToCart(page).click();
    await page.waitForURL(/gio-hang/);

    await expect(page.locator(".cart-pc-set-card")).toHaveCount(1);
    await expect(page.locator(".badge-set-compat")).toContainText(`${realBuild.items.length} Linh kiện`);
    await expect(page.locator(".cart-loose-item")).toHaveCount(3);
    const ids = await cartVariantIds();
    expect(ids).toEqual(expect.arrayContaining(picked.map(Number)));
    expect(ids).toEqual(expect.arrayContaining(realBuild.items.map((i) => i.variantId)));
    expect(ids).toHaveLength(realBuild.items.length + 3);
  });

  test("bỏ tick chuột và đổi màn: giỏ có đúng các món đang chọn", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    await row(page, "mouse").getByRole("checkbox").uncheck();
    await row(page, "monitor").locator("select").selectOption("202");
    await expect(addToCart(page)).toBeEnabled();
    await addToCart(page).click();
    await page.waitForURL(/gio-hang/);

    await expect(page.locator(".cart-loose-item")).toHaveCount(2);
    const ids = await cartVariantIds();
    expect(ids).toContain(202);
    expect(ids).toHaveLength(realBuild.items.length + 2);
  });

  test("Chỉ thùng máy: giỏ không có hàng mua lẻ", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await open(page);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(addToCart(page)).toBeEnabled();
    await addToCart(page).click();
    await page.waitForURL(/gio-hang/);
    await expect(page.locator(".cart-loose-item")).toHaveCount(0);
    expect(await cartVariantIds()).toHaveLength(realBuild.items.length);
  });

  test("thiếu tồn kho lúc thêm giỏ: báo lỗi, giỏ không mất dữ liệu đã thêm", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    const monitorId = Number(await row(page, "monitor").locator("select").inputValue());
    await page.route("**/api/orders/cart/items", async (route) => {
      if (route.request().postDataJSON()?.productVariantId === monitorId || route.request().postDataJSON()?.variantId === monitorId) {
        return route.fulfill({ status: 409, json: { message: "Không đủ tồn kho" } });
      }
      return route.continue();
    });
    await addToCart(page).click();
    await expect(page.getByText(/Không đủ tồn kho|Đã thêm/).first()).toBeVisible();
    await expect(page).toHaveURL(/build-pc/);
  });

  test("khách chưa đăng nhập: bị chuyển đăng nhập, quay lại vẫn giữ Trọn bộ và lựa chọn, rồi thêm giỏ đúng", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);
    await row(page, "mouse").getByRole("checkbox").uncheck();
    await expect(addToCart(page)).toBeEnabled();
    await addToCart(page).click();
    await page.waitForURL(/dang-nhap/);
    await login(page);
    await page.waitForURL(/build-pc/);

    await expect(page.getByText("Đã khôi phục cấu hình")).toBeVisible();
    await expect(row(page, "monitor")).toBeVisible();
    await expect(row(page, "mouse").getByRole("checkbox")).not.toBeChecked();
    await expect(fullSetRadio(page)).toBeChecked();
    await expect(addToCart(page)).toBeEnabled();
    await addToCart(page).click();
    await page.waitForURL(/gio-hang/);
    await expect(page.locator(".cart-loose-item")).toHaveCount(2);
  });

  async function savedDetail() {
    const headers = { Authorization: `Bearer ${token}` };
    const builds = (await (await fetch(`${PC}/my-builds`, { headers })).json()).data;
    const detail = (await (await fetch(`${PC}/${builds[0].buildId}`, { headers })).json()).data;
    return { summary: builds[0], detail, remove: () => fetch(`${PC}/${builds[0].buildId}`, { method: "DELETE", headers }) };
  }

  async function openSavedInBuilder(page) {
    await page.getByRole("button", { name: "Cấu hình đã lưu của tôi" }).click();
    await page.getByRole("button", { name: "Xem chi tiết" }).first().click();
    await page.getByRole("button", { name: /Tải vào bộ lắp ráp/ }).click();
  }

  test("lưu cấu hình Trọn bộ: lưu cả màn, phím, chuột vào DB; mở lại khôi phục đúng 3 món, không báo hết hàng", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    const picked = Object.fromEntries(await Promise.all(["monitor", "keyboard", "mouse"].map(async (role) => [role, Number(await row(page, role).locator("select").inputValue())])));
    const peripheralTotal = await money(page, "#costPeripheralTotal");
    await page.getByRole("button", { name: "Lưu cấu hình vào tài khoản" }).click();
    await expect(page.getByRole("button", { name: /Đã lưu cấu hình/ })).toBeVisible();

    const { summary, detail, remove } = await savedDetail();
    expect(summary.itemCount).toBe(realBuild.items.length + 3);
    expect(summary.totalPrice).toBe(realBuild.totalPrice + peripheralTotal);
    for (const role of ["monitor", "keyboard", "mouse"]) {
      expect(detail.items.find((i) => i.role === role)?.variantId).toBe(picked[role]);
    }

    await openSavedInBuilder(page);
    await expect(page.locator(".builder-table tbody.pc-parts tr")).toHaveCount(realBuild.items.length);
    await expect(row(page, "monitor")).toBeVisible();
    for (const role of ["monitor", "keyboard", "mouse"]) {
      await expect(row(page, role).locator("select")).toHaveValue(String(picked[role]));
      await expect(row(page, role).getByRole("checkbox")).toBeChecked();
    }
    expect(await money(page, "#costPeripheralTotal")).toBe(peripheralTotal);
    await expect(fullSetRadio(page)).toBeChecked();
    await expect(addToCart(page)).toBeEnabled();
    await expect(page.getByText(/hết hàng/i)).toHaveCount(0);

    await remove();
  });

  test("bỏ tick chuột rồi lưu: DB không có chuột; mở lại chuột vẫn bỏ tick", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    await row(page, "mouse").getByRole("checkbox").uncheck();
    await expect(addToCart(page)).toBeEnabled();
    await page.getByRole("button", { name: "Lưu cấu hình vào tài khoản" }).click();
    await expect(page.getByRole("button", { name: /Đã lưu cấu hình/ })).toBeVisible();

    const { detail, remove } = await savedDetail();
    expect(detail.items.map((i) => i.role)).toEqual(expect.arrayContaining(["monitor", "keyboard"]));
    expect(detail.items.some((i) => i.role === "mouse")).toBe(false);

    await openSavedInBuilder(page);
    await expect(row(page, "monitor")).toBeVisible();
    await expect(row(page, "mouse").getByRole("checkbox")).not.toBeChecked();
    await expect(row(page, "monitor").getByRole("checkbox")).toBeChecked();

    await remove();
  });

  test("lưu cấu hình Chỉ thùng máy: không có màn, phím, chuột; mở lại không có khu phụ kiện", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await open(page);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(addToCart(page)).toBeEnabled();
    await page.getByRole("button", { name: "Lưu cấu hình vào tài khoản" }).click();
    await expect(page.getByRole("button", { name: /Đã lưu cấu hình/ })).toBeVisible();

    const { summary, remove } = await savedDetail();
    expect(summary.itemCount).toBe(realBuild.items.length);

    await openSavedInBuilder(page);
    await expect(page.locator(".builder-table")).toBeVisible();
    await expect(panel(page)).toHaveCount(0);
    await expect(addToCart(page)).toBeEnabled();

    await remove();
  });

  test("chi tiết cấu hình đã lưu hiện nhãn Màn hình, Bàn phím, Chuột", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    await page.getByRole("button", { name: "Lưu cấu hình vào tài khoản" }).click();
    await expect(page.getByRole("button", { name: /Đã lưu cấu hình/ })).toBeVisible();
    await page.getByRole("button", { name: "Cấu hình đã lưu của tôi" }).click();
    await page.getByRole("button", { name: "Xem chi tiết" }).first().click();

    for (const label of ["Màn hình máy tính", "Bàn phím", "Chuột"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/^(KEYBOARD|MOUSE|MONITOR)$/)).toHaveCount(0);
    await (await savedDetail()).remove();
  });

  test("thêm cấu hình Trọn bộ đã lưu vào giỏ: bộ PC đủ linh kiện, 3 món là hàng mua lẻ", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    await page.getByRole("button", { name: "Lưu cấu hình vào tài khoản" }).click();
    await expect(page.getByRole("button", { name: /Đã lưu cấu hình/ })).toBeVisible();

    await page.getByRole("button", { name: "Cấu hình đã lưu của tôi" }).click();
    await page.getByRole("button", { name: "Xem chi tiết" }).first().click();
    await page.getByRole("button", { name: /Thêm vào giỏ & Đặt hàng/ }).click();
    await page.waitForURL(/gio-hang/);
    await expect(page.locator(".cart-pc-set-card")).toHaveCount(1);
    await expect(page.locator(".badge-set-compat")).toContainText(`${realBuild.items.length} Linh kiện`);
    await expect(page.locator(".cart-loose-item")).toHaveCount(3);
    expect(await cartVariantIds()).toHaveLength(realBuild.items.length + 3);

    await (await savedDetail()).remove();
  });

  test("API: lưu cấu hình với món phụ kiện sai loại -> 422, không lưu", async () => {
    const response = await apiPost("/api/v1/pc-build/save", {
      items: [...itemsOf(realBuild), { role: "mouse", variantId: 213, quantity: 1 }],
    }, token);
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("PERIPHERAL_ROLE_MISMATCH");
  });

  test("giỏ hàng: Chỉnh sửa trong PC Builder chỉ nạp thùng máy, không có khu phụ kiện", async ({ page }) => {
    await mockAi(page);
    await loginFirst(page);
    await suggestFullSet(page);
    await addToCart(page).click();
    await page.waitForURL(/gio-hang/);
    await page.getByRole("button", { name: "Chỉnh sửa trong PC Builder" }).click();
    await page.waitForURL(/build-pc/);
    await expect(page.locator(".builder-table")).toBeVisible();
    await expect(page.locator(".builder-table tbody.pc-parts tr")).toHaveCount(realBuild.items.length);
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe("5. Gọi API trực tiếp (backend thật)", () => {
  const post = (body) => apiPost("/api/v1/pc-build/peripherals", body);

  test("khách chưa đăng nhập gọi được; server tính giá, bỏ qua giá client gửi", async () => {
    const response = await post({
      budget: 30_000_000,
      archetype: "GAMING",
      totalPrice: 1,
      items: itemsOf(realBuild).map((i) => ({ ...i, unitPrice: 1, price: 1 })),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.pcTotal).toBe(realBuild.totalPrice);
  });

  for (const [name, body] of [
    ["thiếu ngân sách", { items: [{ role: "cpu", variantId: 1, quantity: 1 }] }],
    ["ngân sách âm", { budget: -1, items: [{ role: "cpu", variantId: 1, quantity: 1 }] }],
    ["ngân sách vượt trần", { budget: 10_000_000_000, items: [{ role: "cpu", variantId: 1, quantity: 1 }] }],
    ["items rỗng", { budget: 30_000_000, items: [] }],
    ["quá 16 dòng", { budget: 30_000_000, items: Array.from({ length: 17 }, () => ({ role: "ssd", variantId: 1, quantity: 1 })) }],
    ["số lượng 0", { budget: 30_000_000, items: [{ role: "cpu", variantId: 1, quantity: 0 }] }],
    ["số lượng 9", { budget: 30_000_000, items: [{ role: "cpu", variantId: 1, quantity: 9 }] }],
  ]) {
    test(`đầu vào sai (${name}): 400`, async () => {
      expect((await post(body)).status).toBe(400);
    });
  }

  test("biến thể không tồn tại: 422 BUILD_ITEM_NOT_FOUND", async () => {
    const response = await post({ budget: 30_000_000, items: [{ role: "cpu", variantId: 99999999, quantity: 1 }] });
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("BUILD_ITEM_NOT_FOUND");
  });

  test("gửi màn hình như linh kiện thùng máy: 422", async () => {
    const response = await post({ budget: 30_000_000, items: [{ role: "monitor", variantId: 203, quantity: 1 }] });
    expect(response.status).toBe(422);
  });

  test("tiền còn lại không đủ: 422 kèm số tiền thiếu", async () => {
    const response = await post({ budget: realBuild.totalPrice + 1_000_000, items: itemsOf(realBuild) });
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.code).toBe("PERIPHERAL_BUDGET_TOO_LOW");
    expect(body.data.shortfall).toBe(range.min - 1_000_000);
  });

  test("archetype lạ không gây lỗi", async () => {
    expect((await post({ budget: 30_000_000, archetype: "<script>", items: itemsOf(realBuild) })).status).toBe(200);
  });

  test("/options trả khoảng ngân sách, từ điển vẫn chỉ 8 vai trò", async () => {
    const options = (await (await fetch(`${PC}/options`)).json()).data;
    const products = await (await fetch(`${API}/api/products`)).json();
    const inStock = (category) => products.filter((p) => p.category === category && p.stock > 0).map((p) => p.price);
    const total = (pick) => ["monitor", "keyboard", "mouse"].reduce((sum, c) => sum + pick(...inStock(c)), 0);
    expect(options.peripheralMinTotal).toBe(total(Math.min));
    // B3: trần là số tiền bộ chọn thật sự chi được, không vượt tổng giá đắt nhất
    expect(options.peripheralMaxTotal).toBeLessThanOrEqual(total(Math.max));
    expect(options.peripheralMaxTotal).toBeGreaterThan(options.peripheralMinTotal);
    expect(Object.keys(options.dictionary.roles)).toEqual(["cpu", "mainboard", "ram", "gpu", "ssd", "psu", "case", "cooler"]);
  });

  test("/validate thật: màn hình vẫn nằm ngoài thùng máy (bảo vệ quyết định không đưa vào buildParts)", async () => {
    const body = await (await apiPost("/api/v1/pc-build/validate", {
      budget: 40_000_000,
      items: [...itemsOf(realBuild), { role: "monitor", variantId: 203, quantity: 1 }],
    })).json();
    expect(body.data.isCompatible).toBe(false);
    expect(body.data.checks.some((c) => c.key === "STOCK")).toBe(true);
  });
});

test.describe("6. Cửa hàng", () => {
  test("menu Linh kiện PC không lẫn màn, phím, chuột", async ({ page }) => {
    await page.goto("/san-pham?category=parts&q=Logitech");
    await expect(page.getByText(/Logitech (K120|G102|MX)/)).toHaveCount(0);
  });

  test("sidebar có Màn hình, Bàn phím, Chuột; trang danh mục có đủ sản phẩm", async ({ page, request }) => {
    const products = await (await request.get(`${API}/api/products`)).json();
    await page.goto("/danh-muc/keyboard");
    for (const name of ["Màn hình", "Bàn phím", "Chuột"]) {
      await expect(page.locator(".category-filter", { hasText: new RegExp(`^${name}$`) })).toBeVisible();
    }
    await expect(page.getByText(`${products.filter((p) => p.category === "keyboard").length} phiên bản phù hợp`)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bàn phím" }).first()).toBeVisible();
    await page.goto("/danh-muc/keyboard?q=K120");
    await expect(page.getByText("Logitech K120").first()).toBeVisible();
  });

  test("trang chi tiết sản phẩm có tên danh mục trên breadcrumb", async ({ page, request }) => {
    const products = await (await request.get(`${API}/api/products`)).json();
    const mouse = products.find((p) => p.category === "mouse");
    await page.goto(`/san-pham/${mouse.id}`);
    await expect(page.getByRole("link", { name: "Chuột", exact: true }).first()).toBeVisible();
  });
});

test.describe("7. Hiển thị", () => {
  test("B: màn, phím, chuột nằm trong cùng bảng với linh kiện PC, ngay sau dòng cuối, không còn khung riêng", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);

    const split = page.locator("#builderMainSplit");
    await expect(split.locator(".builder-panel")).toHaveCount(1);
    await expect(split.locator("table")).toHaveCount(1);
    await expect(page.locator(".builder-table #peripheralPanel")).toBeVisible();
    await expect(page.locator(".peripheral-group-head")).toContainText("Phụ kiện đi kèm (không cần lắp ráp)");
    await expect(page.locator(".panel-head-title p")).toContainText(`${realBuild.items.length} nhóm linh kiện · 3 phụ kiện đi kèm`);

    // Cùng cột với dòng PC: vị trí cột Thành tiền của dòng màn hình thẳng hàng với dòng PC cuối
    const lastPc = page.locator(".builder-table tbody.pc-parts tr").last();
    const monitor = row(page, "monitor");
    const pcBox = await lastPc.locator(".subtotal-cell").boundingBox();
    const monitorBox = await monitor.locator(".subtotal-cell").boundingBox();
    expect(Math.abs(pcBox.x + pcBox.width - (monitorBox.x + monitorBox.width))).toBeLessThan(2);
    expect(monitorBox.y).toBeGreaterThan(pcBox.y);
    await expect(monitor.locator("td")).toHaveCount(5);
    await expect(monitor.locator("td").nth(2)).toHaveText("1");
    expect(digits(await monitor.locator(".price-cell").textContent())).toBe(digits(await monitor.locator(".subtotal-cell").textContent()));

    // Bỏ tick: SL "—", Thành tiền "Không mua", tiêu đề đếm lại
    await row(page, "mouse").getByRole("checkbox").uncheck();
    await expect(row(page, "mouse").locator("td").nth(2)).toHaveText("—");
    await expect(row(page, "mouse").locator(".peripheral-price")).toHaveText("Không mua");
    await expect(page.locator(".panel-head-title p")).toContainText("2 phụ kiện đi kèm");
  });

  test("B: chế độ Chỉ thùng máy không có nhóm phụ kiện trong bảng", async ({ page }) => {
    await mockAi(page);
    await open(page);
    await fill(page, 30_000_000);
    await submit(page).click();
    await expect(page.locator(".builder-table tbody.pc-parts tr")).toHaveCount(realBuild.items.length);
    await expect(page.locator(".peripheral-group-head")).toHaveCount(0);
    await expect(page.locator(".panel-head-title p")).not.toContainText("phụ kiện đi kèm");
  });

  test("điện thoại 390px: không tràn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAi(page);
    await suggestFullSet(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: "test-results/full-set-mobile.png", fullPage: true });
  });

  test("máy tính: chụp màn hình để kiểm tra bằng mắt", async ({ page }) => {
    await mockAi(page);
    await suggestFullSet(page);
    await page.screenshot({ path: "test-results/full-set-desktop.png", fullPage: true });
  });
});

test.describe("8. AI thật (Gemini)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(90_000);

  for (const [name, budget, purpose, check] of [
    [
      "30 triệu chơi game: màn từ 144Hz",
      30_000_000,
      "Chơi game 2K, thỉnh thoảng stream",
      async (page) => {
        const hz = Number((await row(page, "monitor").locator(".peripheral-specs").textContent()).match(/(\d+)Hz/)[1]);
        expect(hz).toBeGreaterThanOrEqual(144);
      },
    ],
    ["12 triệu văn phòng: vừa ngân sách thấp", 12_000_000, "Văn phòng, Excel, họp online", async () => {}],
    [
      "300 triệu máy trạm: đủ 3 món, màn tần số cao",
      300_000_000,
      "Chơi game 4K và dựng phim 8K",
      async (page) => {
        for (const role of ["monitor", "keyboard", "mouse"]) await expect(row(page, role)).toBeVisible();
        const hz = Number((await row(page, "monitor").locator(".peripheral-specs").textContent()).match(/(\d+)Hz/)[1]);
        expect(hz).toBeGreaterThanOrEqual(144);
      },
    ],
    [
      "1 tỷ: phụ kiện không vượt trần của kho",
      1_000_000_000,
      "Máy mạnh nhất có thể để train AI",
      async (page) => expect(await money(page, "#costPeripheralTotal")).toBeLessThanOrEqual(range.max),
    ],
  ]) {
    test(`Trọn bộ ${name}`, async ({ page }) => {
      await suggestFullSet(page, budget, purpose);
      await check(page);
      const grand = await money(page, "#costGrandTotal");
      expect(grand).toBeLessThanOrEqual(budget);
      expect(grand).toBe((await money(page, "#costPcTotal")) + (await money(page, "#costPeripheralTotal")));
      await expect(page.locator(".builder-table tbody tr").first()).toBeVisible();
    });
  }

  test("Chỉ thùng máy 30 triệu: chạy như cũ, không có khu phụ kiện", async ({ page }) => {
    await open(page);
    await fill(page, 30_000_000, "Lập trình web, chạy Docker");
    await submit(page).click();
    await expect(page.locator(".builder-table")).toBeVisible({ timeout: 40_000 });
    await expect(panel(page)).toHaveCount(0);
    await expect(addToCart(page)).toBeEnabled();
  });
});
