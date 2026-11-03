import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PartsTable } from "../src/features/pc-builder/components/PartsTable";
import type { BuildPart, PeripheralItem, PeripheralSuggestionResponse } from "../src/features/pc-builder/types/pcBuilder.types";

const part = (role: BuildPart["role"], variantId: number): BuildPart => ({
  role, roleName: role, variantId, productName: `PC ${variantId}`, variantName: "", imageUrl: "/x.png",
  unitPrice: 1_000_000, quantity: 1, specs: {}, aiReason: "",
});
const item = (variantId: number, price: number, reason?: string): PeripheralItem => ({
  variantId, productName: `Phụ kiện ${variantId}`, price, highlights: ["27 inch", "180Hz"], reason,
});
const suggestion: PeripheralSuggestionResponse = {
  pcTotal: 0, available: 0, spendLimit: 0, peripheralTotal: 0, grandTotal: 0,
  roles: [
    { role: "monitor", label: "Màn hình", picked: item(203, 3_890_000, "Tần số quét 180Hz hợp nhu cầu chơi game"), options: [item(203, 3_890_000)] },
    { role: "keyboard", label: "Bàn phím", picked: item(213, 690_000), options: [item(213, 690_000)] },
    { role: "mouse", label: "Chuột", picked: item(224, 490_000), options: [item(224, 490_000)] },
  ],
};
const noop = () => {};

function render(peripherals?: Parameters<typeof PartsTable>[0]["peripherals"]) {
  return renderToStaticMarkup(createElement(PartsTable, {
    parts: [part("cpu", 1), part("gpu", 4)], onReplacePart: noop, onUpdateQuantity: noop, peripherals,
  }));
}

test("B: màn, phím, chuột nằm trong CÙNG bảng với linh kiện PC, có tiêu đề nhóm riêng", () => {
  const html = render({
    status: "ready", suggestion, error: null, onSelect: noop, onRetry: noop,
    selection: { monitor: suggestion.roles[0].picked, keyboard: suggestion.roles[1].picked, mouse: null },
  });

  expect(html.match(/<table/g)).toHaveLength(1);
  expect(html.match(/class="builder-panel"/g)).toHaveLength(1); // không còn khung riêng
  expect(html).toContain('<tbody class="pc-parts">');
  expect(html).toMatch(/<tbody[^>]*id="peripheralPanel"/);
  expect(html).toContain("Phụ kiện đi kèm (không cần lắp ráp)");
  expect(html).toContain("2 nhóm linh kiện · 2 phụ kiện đi kèm");
  // Bảng PC đứng trước nhóm phụ kiện
  expect(html.indexOf("PC 4")).toBeLessThan(html.indexOf("Phụ kiện đi kèm"));
});

test("B: mỗi dòng phụ kiện có đủ 5 cột như dòng PC: loại, sản phẩm, SL, đơn giá, thành tiền", () => {
  const html = render({
    status: "ready", suggestion, error: null, onSelect: noop, onRetry: noop,
    selection: { monitor: suggestion.roles[0].picked, keyboard: suggestion.roles[1].picked, mouse: null },
  });
  const monitorRow = html.match(/<tr class="peripheral-row[^"]*" data-role="monitor">([\s\S]*?)<\/tr>/)?.[1] ?? "";
  const mouseRow = html.match(/<tr class="peripheral-row[^"]*" data-role="mouse">([\s\S]*?)<\/tr>/)?.[1] ?? "";

  expect(monitorRow.match(/<td/g)).toHaveLength(5);
  expect(monitorRow).toContain("Màn hình");
  expect(monitorRow).toContain('type="checkbox"');
  expect(monitorRow).toContain("27 inch · 180Hz");
  expect(monitorRow).toContain("Tần số quét 180Hz");
  expect(monitorRow).toContain("<select");
  expect(monitorRow.match(/3\.890\.000/g)?.length).toBeGreaterThanOrEqual(2); // đơn giá và thành tiền
  // Món bỏ tick: SL là "—", thành tiền là "Không mua"
  expect(mouseRow).toContain("Không mua");
  expect(mouseRow).toContain("—");
  expect(html).toMatch(/<tr class="peripheral-row excluded" data-role="mouse">/);
});

test("B: đang tải và lỗi hiện thành một dòng trong bảng; chế độ chỉ thùng máy không có nhóm phụ kiện", () => {
  expect(render({ status: "loading", suggestion: null, selection: {}, error: null, onSelect: noop, onRetry: noop }))
    .toContain("Đang chọn màn hình, bàn phím, chuột");
  const error = render({ status: "error", suggestion: null, selection: {}, error: "Lỗi máy chủ", onSelect: noop, onRetry: noop });
  expect(error).toContain("Thùng máy vẫn mua được");
  expect(error).toContain("Thử lại");

  const pcOnly = render(undefined);
  expect(pcOnly).not.toContain("peripheralPanel");
  expect(pcOnly).not.toContain("Phụ kiện đi kèm");
  expect(pcOnly).toContain("2 nhóm linh kiện");
  expect(pcOnly).not.toContain("phụ kiện đi kèm");
});
