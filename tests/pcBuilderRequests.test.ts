import axios from "axios";
import { afterEach, expect, test, vi } from "vitest";
import { createBuildRequests } from "../src/features/pc-builder/hooks/buildRequests";
import { PcBuildApiError } from "../src/features/pc-builder/api/pcBuilderApi";

// Mỗi lời gọi trả về một promise do test tự resolve; abort thì reject CanceledError như axios.
function fakeCalls() {
  const calls: { signal: AbortSignal; resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];
  const call = vi.fn(
    (signal: AbortSignal) =>
      new Promise((resolve, reject) => {
        calls.push({ signal, resolve, reject });
        signal.addEventListener("abort", () => reject(new axios.CanceledError()));
      }),
  );
  return { call, calls };
}

const handlers = () => ({ onSuccess: vi.fn(), onError: vi.fn() });
const flush = () => new Promise((r) => setTimeout(r, 0));
const cpu = { variantId: 11, qty: 1 };
const ram = (qty: number) => ({ variantId: 31, qty });

afterEach(() => {
  vi.useRealTimers();
});

test("bấm Đề xuất hai lần khi đang chạy chỉ gửi một lượt analyze → auto", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  const h = handlers();
  const first = requests.suggest(call, h);
  expect(await requests.suggest(call, h)).toBe(false);
  expect(requests.isSuggesting).toBe(true);
  expect(call).toHaveBeenCalledTimes(1);
  calls[0].resolve({ build: null });
  expect(await first).toBe(true);
  expect(requests.isSuggesting).toBe(false);
  expect(h.onSuccess).toHaveBeenCalledWith({ build: null });
});

test("lỗi thật của suggest tới onError, sau đó gửi lại được", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  const h = handlers();
  const run = requests.suggest(call, h);
  calls[0].reject(new PcBuildApiError("AI bận", 503, "AI_UNAVAILABLE", 5));
  expect(await run).toBe(false);
  expect(h.onError).toHaveBeenCalledWith(expect.objectContaining({ code: "AI_UNAVAILABLE", retryAfter: 5 }));
  expect(requests.isSuggesting).toBe(false);
  void requests.suggest(call, h);
  expect(call).toHaveBeenCalledTimes(2);
});

test("hai lần đổi số lượng liên tiếp: request đầu bị hủy, chỉ kết quả sau được áp", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests(0);
  const h = handlers();
  requests.track([cpu, ram(2)]);
  const first = requests.revalidate(call, [cpu, ram(2)], h);
  requests.track([cpu, ram(4)]);
  const second = requests.revalidate(call, [cpu, ram(4)], h);
  await flush();
  expect(calls).toHaveLength(2);
  expect(calls[0].signal.aborted).toBe(true);
  calls[1].resolve({ status: "VALID" });
  expect(await Promise.all([first, second])).toEqual([false, true]);
  expect(h.onSuccess).toHaveBeenCalledTimes(1);
  expect(h.onSuccess).toHaveBeenCalledWith({ status: "VALID" });
  expect(h.onError).not.toHaveBeenCalled();
});

test("revalidate debounce 300 ms: sửa nhanh nhiều lần chỉ gửi một /validate", async () => {
  vi.useFakeTimers();
  const { call } = fakeCalls();
  const requests = createBuildRequests();
  requests.track([cpu]);
  const first = requests.revalidate(call, [cpu], handlers());
  vi.advanceTimersByTime(200);
  void requests.revalidate(call, [cpu], handlers());
  vi.advanceTimersByTime(299);
  expect(call).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(call).toHaveBeenCalledTimes(1);
  expect(await first).toBe(false); // lần chờ bị thay thế trả false, không treo
});

test("phản hồi /validate về muộn cho bộ PC cũ bị bỏ", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests(0);
  const h = handlers();
  requests.track([cpu, ram(2)]);
  const run = requests.revalidate(call, [cpu, ram(2)], h);
  await flush();
  requests.track([cpu, ram(4)]); // khách đổi tiếp nhưng response cũ về trước khi kịp hủy
  calls[0].resolve({ status: "INCOMPATIBLE" });
  expect(await run).toBe(false);
  expect(h.onSuccess).not.toHaveBeenCalled();
  expect(h.onError).not.toHaveBeenCalled();
});

test("buildKey không phụ thuộc thứ tự dòng: bộ PC xếp khác vẫn nhận phản hồi", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests(0);
  const h = handlers();
  requests.track([ram(2), cpu]);
  const run = requests.revalidate(call, [cpu, ram(2)], h);
  await flush();
  calls[0].resolve({ status: "VALID" });
  expect(await run).toBe(true);
});

test("danh sách đổi món của bộ PC cũ bị bỏ", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  const h = handlers();
  requests.track([cpu]);
  const run = requests.replacements(call, [cpu], h);
  requests.track([{ variantId: 12, qty: 1 }]);
  calls[0].resolve([{ id: 13 }]);
  expect(await run).toBe(false);
  expect(h.onSuccess).not.toHaveBeenCalled();
});

test("lỗi do hủy không tới onError, lỗi thật thì có", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  const h = handlers();
  requests.track([cpu]);
  const aborted = requests.replacements(call, [cpu], h);
  requests.cancel("replacements");
  await aborted;
  expect(h.onError).not.toHaveBeenCalled();

  const failed = requests.replacements(call, [cpu], h);
  calls[1].reject(new PcBuildApiError("Lỗi máy chủ", 500));
  await failed;
  expect(h.onError).toHaveBeenCalledTimes(1);
});

test("cancel bỏ cả kết quả của request không hủy được (promise không nghe signal)", async () => {
  let resolve: (v: unknown) => void = () => {};
  const call = vi.fn(() => new Promise((r) => (resolve = r)));
  const requests = createBuildRequests();
  const h = handlers();
  const run = requests.suggest(call, h);
  requests.cancel("suggest");
  resolve({ build: null });
  expect(await run).toBe(false);
  expect(h.onSuccess).not.toHaveBeenCalled();
});

test("unmount (cancelAll) hủy mọi request và debounce đang chờ", async () => {
  vi.useFakeTimers();
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  const h = handlers();
  requests.track([cpu]);
  void requests.suggest(call, h);
  void requests.replacements(call, [cpu], h);
  const pending = requests.revalidate(call, [cpu], h);
  requests.cancelAll();
  vi.advanceTimersByTime(1000);
  expect(calls.map((c) => c.signal.aborted)).toEqual([true, true]);
  expect(call).toHaveBeenCalledTimes(2); // /validate chưa kịp gửi
  expect(requests.isSuggesting).toBe(false);
  vi.useRealTimers();
  expect(await pending).toBe(false);
  await flush();
  expect(h.onError).not.toHaveBeenCalled();
  expect(h.onSuccess).not.toHaveBeenCalled();
});

test("lượt suggest cũ kết thúc sau khi bị hủy không mở khóa lượt mới", async () => {
  const { call, calls } = fakeCalls();
  const requests = createBuildRequests();
  void requests.suggest(call, handlers());
  requests.cancel("suggest");
  const second = requests.suggest(call, handlers());
  await flush(); // finally của lượt đầu chạy xong
  expect(requests.isSuggesting).toBe(true);
  calls[1].resolve({ build: null });
  expect(await second).toBe(true);
  expect(requests.isSuggesting).toBe(false);
});
