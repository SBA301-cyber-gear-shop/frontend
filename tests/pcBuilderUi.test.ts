import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalysisPanel } from "../src/features/pc-builder/components/AnalysisPanel";
import { AiErrorBox } from "../src/features/pc-builder/components/AiErrorBox";
import { PartsTable } from "../src/features/pc-builder/components/PartsTable";
import { SummaryCard, buildVerdict } from "../src/features/pc-builder/components/SummaryCard";
import type { AnalyzeResponse, BuildResult } from "../src/features/pc-builder/types/pcBuilder.types";

const noop = () => {};
const vnd = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const analysis = (overrides: Partial<AnalyzeResponse>): AnalyzeResponse => ({
  status: "READY",
  message: "Shop đã hiểu yêu cầu: PC chơi game, ngân sách 20.000.000đ.",
  requirement: { budget: 20_000_000, purpose: "GAMING" },
  minBudget: 16_000_000,
  maxBuildPrice: 200_000_000,
  suggestedPurposes: [],
  explanation: null,
  suggestedBudget: null,
  notes: [],
  ...overrides,
});

const build = (overrides: Partial<BuildResult> = {}): BuildResult => ({
  status: "VALID",
  budget: 20_000_000,
  purpose: "GAMING",
  total: 19_000_000,
  difference: -1_000_000,
  items: [
    { category: "CPU", id: 4, name: "Ryzen 5 7600", qty: 1, maxQty: 1, price: 5_000_000 },
    { category: "RAM", id: 6, name: "DDR5 16GB", qty: 2, maxQty: 2, price: 1_000_000 },
  ],
  violations: [],
  budgetWarning: null,
  message: null,
  ...overrides,
});

const renderAnalysis = (a: AnalyzeResponse) =>
  renderToStaticMarkup(createElement(AnalysisPanel, { analysis: a, isBusy: false, onUseBudget: noop, onPickPurpose: noop }));

test("AnalysisPanel BUDGET_TOO_LOW hiện các mục đích vừa ngân sách và nút tăng lên mức tối thiểu", () => {
  const html = renderAnalysis(
    analysis({
      status: "BUDGET_TOO_LOW",
      message: "Mức nhu cầu tối thiểu cho PC chơi game là 16.000.000đ.",
      requirement: { budget: 13_000_000, purpose: "GAMING" },
      suggestedPurposes: [{ purpose: "OFFICE", label: "PC văn phòng", description: "Văn phòng, học tập", minBudget: 12_500_000 }],
    }),
  );
  expect(html).toContain("Ngân sách chưa đủ cho nhu cầu này");
  expect(html).toContain("Build PC văn phòng");
  expect(html).toContain(vnd(12_500_000));
  expect(html).toContain(`Tăng ngân sách lên ${vnd(16_000_000)}`);
});

test("AnalysisPanel BUDGET_WARNING gợi ý phân tích lại với ngân sách AI đề xuất, kèm ghi chú", () => {
  const html = renderAnalysis(
    analysis({
      status: "BUDGET_WARNING",
      explanation: "Với 20 triệu, máy chơi tốt game eSports.",
      suggestedBudget: 35_000_000,
      notes: ["Mức gợi ý ngân sách là ước lượng từ AI, không đảm bảo chính xác tuyệt đối."],
    }),
  );
  expect(html).toContain("Với 20 triệu, máy chơi tốt game eSports.");
  expect(html).toContain(`Phân tích lại với ${vnd(35_000_000)}`);
  expect(html).toContain("ước lượng từ AI");
});

test("AnalysisPanel NEED_CLARIFICATION hiện câu hỏi và nhắc bổ sung mô tả, không có nút ngân sách", () => {
  const html = renderAnalysis(
    analysis({ status: "NEED_CLARIFICATION", message: "Bạn dùng máy chủ yếu để làm gì?", requirement: { budget: 20_000_000, purpose: null } }),
  );
  expect(html).toContain("Bạn dùng máy chủ yếu để làm gì?");
  expect(html).toContain("Bổ sung mô tả nhu cầu");
  expect(html).not.toContain("btn-secondary");
});

test("AnalysisPanel BUDGET_TOO_HIGH đề nghị dùng giá bộ PC cao cấp nhất", () => {
  const html = renderAnalysis(analysis({ status: "BUDGET_TOO_HIGH", maxBuildPrice: 150_000_000 }));
  expect(html).toContain(`Dùng ngân sách ${vnd(150_000_000)}`);
});

test("buildVerdict tách xung đột phần cứng và vượt tiền; đang kiểm tra hoặc lỗi thì không báo tương thích", () => {
  expect(buildVerdict(build(), false, null).label).toBe("TƯƠNG THÍCH");
  expect(buildVerdict(build({ status: "INCOMPATIBLE" }), false, null).label).toBe("KHÔNG TƯƠNG THÍCH");
  expect(buildVerdict(build({ status: "OVER_BUDGET" }), false, null).label).toBe("VƯỢT NGÂN SÁCH");
  expect(buildVerdict(build(), true, null).label).toBe("ĐANG KIỂM TRA…");
  expect(buildVerdict(build(), false, "mạng lỗi").label).toBe("CHƯA KIỂM TRA");
});

const renderSummary = (b: BuildResult, extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    createElement(SummaryCard, {
      build: b,
      isChecking: false,
      checkError: null,
      savedBuildId: null,
      isSaving: false,
      isAdding: false,
      onRecheck: noop,
      onAddToCart: noop,
      onSave: noop,
      ...extra,
    }),
  );

test("SummaryCard: còn dư khi difference âm, vượt và câu cảnh báo khi OVER_BUDGET", () => {
  expect(renderSummary(build())).toContain(`Còn dư <strong style="color:#148465">${vnd(1_000_000)}`);
  const over = renderSummary(
    build({ status: "OVER_BUDGET", total: 21_000_000, difference: 1_000_000, budgetWarning: "Vượt ngân sách 1.000.000đ" }),
  );
  expect(over).toContain(`Vượt ${vnd(1_000_000)}`);
  expect(over).toContain("Vượt ngân sách 1.000.000đ");
  expect(over).not.toMatch(/btn-buy-now"[^>]*disabled/); // vượt tiền vẫn mua được sau khi xác nhận
});

test("SummaryCard khóa giỏ hàng và lưu khi INCOMPATIBLE, liệt kê luật vi phạm", () => {
  const html = renderSummary(build({ status: "INCOMPATIBLE", violations: [{ rule: "RULE_7", message: "RAM DDR4 không hợp main DDR5" }] }));
  expect(html).toContain("RULE_7");
  expect(html).toContain("RAM DDR4 không hợp main DDR5");
  expect(html).toMatch(/btn-buy-now"[^>]*disabled/);
  expect(html).toMatch(/btn-save-build[^"]*"[^>]*disabled/);
});

test("SummaryCard khi /validate lỗi: báo lỗi, có nút Kiểm tra lại và khóa nút mua", () => {
  const html = renderSummary(build(), { checkError: "Máy chủ không phản hồi" });
  expect(html).toContain("Không kiểm tra được cấu hình: Máy chủ không phản hồi");
  expect(html).toContain("Kiểm tra lại");
  expect(html).toMatch(/btn-buy-now"[^>]*disabled/);
});

test("PartsTable: ô số lượng chỉ có nút khi maxQty > 1, nút + khóa ở maxQty, slot trống có nút Chọn", () => {
  const html = renderToStaticMarkup(
    createElement(PartsTable, {
      items: build().items,
      verdict: { label: "TƯƠNG THÍCH", tone: "success" },
      onReplace: noop,
      onChangeQty: noop,
    }),
  );
  expect(html).not.toContain("Tăng số lượng CPU");
  expect(html).toMatch(/aria-label="Tăng số lượng RAM"[^>]*disabled/); // qty 2 = maxQty 2
  expect(html).toContain('aria-label="Chọn Card đồ họa"');
  expect(html).toContain('aria-label="Đổi CPU"');
  expect(html).toContain(vnd(2_000_000)); // thành tiền RAM 2 × 1.000.000
});

const renderError = (error: Parameters<typeof AiErrorBox>[0]["error"], retryLockedUntil = 0) =>
  renderToStaticMarkup(createElement(AiErrorBox, { error, retryLockedUntil, isBusy: false, onRetry: noop, onReset: noop }));

test("AiErrorBox: AI bận thì có Thử lại (khóa theo Retry-After); lỗi đầu vào thì không", () => {
  expect(renderError({ code: "AI_UNAVAILABLE", status: 503, message: "AI bận", retryAfter: null })).toContain(">Thử lại<");
  expect(renderError({ code: "RATE_LIMITED", status: 429, message: "Chậm lại", retryAfter: 30 }, Date.now() + 30_000)).toMatch(
    /disabled[^>]*>Thử lại sau 30s/,
  );
  expect(renderError({ code: "BUILD_NOT_FOUND", status: 422, message: "Không ráp được", retryAfter: null })).not.toContain("Thử lại");
  expect(renderError({ status: 400, message: "Ngân sách tối đa là 9.999.999.999đ", retryAfter: null })).not.toContain("Thử lại");
});
