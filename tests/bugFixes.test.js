import { expect, test } from "vitest";
import { apiCache } from "@/services/apiCache";
import {
  parsePriceInput,
  toVariantAttributes,
} from "@/features/products/domain";

const specCatalog = [
  { id: 1, name: "Socket" },
  { id: 2, name: "Max_TDP_W" },
];

test("C2: yêu cầu sau không nhận lỗi canceled của yêu cầu trước đã bị hủy", async () => {
  apiCache.clear();
  const canceled = Object.assign(new Error("canceled"), {
    code: "ERR_CANCELED",
  });
  let rejectFirst;
  const first = apiCache.fetchWithCache(
    "c2",
    () => new Promise((_, reject) => (rejectFirst = reject)),
  );
  const second = apiCache.fetchWithCache("c2", async () => "dữ liệu thật");
  rejectFirst(canceled);
  await expect(first).rejects.toBe(canceled);
  await expect(second).resolves.toBe("dữ liệu thật");
});

test("C2: lỗi thật vẫn báo cho mọi yêu cầu đang chờ chung", async () => {
  apiCache.clear();
  const boom = new Error("Lỗi máy chủ");
  let rejectFirst;
  const first = apiCache.fetchWithCache(
    "c2b",
    () => new Promise((_, reject) => (rejectFirst = reject)),
  );
  const second = apiCache.fetchWithCache("c2b", async () => "không được gọi");
  rejectFirst(boom);
  await expect(first).rejects.toBe(boom);
  await expect(second).rejects.toBe(boom);
});

test("N2: đổi tên thông số sang specificationId", () => {
  expect(
    toVariantAttributes({ socket: "AM5", Max_TDP_W: "170" }, specCatalog),
  ).toEqual([
    { specificationId: 1, optionId: null, value: "AM5" },
    { specificationId: 2, optionId: null, value: "170" },
  ]);
});

test("N2: tên thông số không tồn tại phải báo lỗi, không âm thầm bỏ qua", () => {
  expect(() => toVariantAttributes({ "Chuẩn RAM": "DDR5" }, specCatalog)).toThrow(
    "Chuẩn RAM",
  );
});

test("N2: giữ option khi giá trị không đổi, bỏ option khi giá trị đổi", () => {
  const existing = [{ specificationId: 1, optionId: 9, value: "AM5" }];
  expect(
    toVariantAttributes({ Socket: "AM5" }, specCatalog, existing)[0].optionId,
  ).toBe(9);
  expect(
    toVariantAttributes({ Socket: "LGA1700" }, specCatalog, existing)[0].optionId,
  ).toBeNull();
});

test.each([["-1000"], ["-"], ["1000đ"], ["abc"], ["1e5"]])(
  "Giá: từ chối %s, không tự đổi thành số khác",
  (raw) => {
    expect(parsePriceInput(raw).error).toBeTruthy();
  },
);

test.each([
  ["", 0],
  ["1500000", 1500000],
  ["1.500.000", 1500000],
  ["1.5000", 15000], // đang gõ thêm số vào ô đã định dạng
  ["9999999999", 9999999999],
])("Giá: nhận %s = %d", (raw, value) => {
  expect(parsePriceInput(raw)).toEqual({ value });
});

test("Giá: vượt giới hạn cột numeric(12,2) bị từ chối", () => {
  expect(parsePriceInput("10000000000").error).toBeTruthy();
});

test("Giá: chế độ chặt không hiểu số lẻ thành số lớn hơn", () => {
  expect(parsePriceInput("1500.50", true).error).toBeTruthy();
  expect(parsePriceInput("1.500.000", true)).toEqual({ value: 1500000 });
  expect(parsePriceInput("1500000", true)).toEqual({ value: 1500000 });
});
