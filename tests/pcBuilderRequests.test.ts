import axios from "axios";
import { afterEach, expect, test, vi } from "vitest";
import {
  buildKey,
  checksToRules,
  createBuildRequests,
  validationFromSuggest,
  type BuildRequestsApi,
} from "../src/features/pc-builder/hooks/buildRequests";
import { checkSuggestInput, saveBuildOrNotify, toApiError } from "../src/features/pc-builder/hooks/usePcBuilder";
import { PcBuildApiError } from "../src/features/pc-builder/api/pcBuilderApi";
import { evaluateHardwareRules, initialBuildParts } from "../src/features/pc-builder/domain";
import type { AiBuildResponse, ValidateBuildResponse } from "../src/features/pc-builder/types/pcBuilder.types";

// Giả lập API: mỗi lời gọi trả về một promise do test tự resolve; abort thì reject CanceledError như axios.
function fakeApi() {
  const calls: { kind: string; payload: any; signal: AbortSignal; resolve: (v: any) => void; reject: (e: any) => void }[] = [];
  const make = (kind: string) =>
    vi.fn((payload: any, { signal }: { signal?: AbortSignal }) =>
      new Promise((resolve, reject) => {
        calls.push({ kind, payload, signal: signal!, resolve, reject });
        signal?.addEventListener("abort", () => reject(new axios.CanceledError()));
      }),
    );
  const api = {
    suggestBuild: make("suggest"),
    validateBuild: make("validate"),
    getCompatibleReplacements: make("replacements"),
  };
  return { api: api as unknown as BuildRequestsApi & typeof api, calls };
}

const handlers = () => ({ onSuccess: vi.fn(), onError: vi.fn() });
const flush = () => new Promise((r) => setTimeout(r, 0));
const cpu = { role: "cpu" as const, variantId: 11, quantity: 1 };
const ram = (q: number) => ({ role: "ram" as const, variantId: 31, quantity: q });
const validation = (ok: boolean) => ({ isCompatible: ok }) as ValidateBuildResponse;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("buildKey sorts role:variantId:quantity lines so order does not matter", () => {
  expect(buildKey([ram(2), cpu])).toBe("cpu:11:1,ram:31:2");
  expect(buildKey([cpu, ram(2)])).toBe(buildKey([ram(2), cpu]));
  expect(buildKey([cpu, ram(4)])).not.toBe(buildKey([cpu, ram(2)]));
});

test("clicking Đề xuất twice while loading sends only one /ai-suggest", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api);
  const h = handlers();
  const first = requests.suggest({ budget: 20_000_000, purpose: "gaming" }, h);
  const second = await requests.suggest({ budget: 20_000_000, purpose: "gaming" }, h);
  expect(second).toBe(false);
  expect(requests.isSuggesting).toBe(true);
  expect(api.suggestBuild).toHaveBeenCalledTimes(1);
  calls[0].resolve({ items: [] });
  expect(await first).toBe(true);
  expect(requests.isSuggesting).toBe(false);
  expect(h.onSuccess).toHaveBeenCalledTimes(1);
});

test("handleRetry resends exactly lastRequest; resuggest carries the edited profile", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api);
  const profile = { profileVersion: 1, source: "USER_EDITED", constraints: [] } as any;
  const payload = { budget: 30_000_000, purpose: "đồ họa", userPrompt: "case trắng", profile };
  const run = requests.suggest(payload, handlers());
  calls[0].reject(new PcBuildApiError("AI bận", 503, "AI_UNAVAILABLE", 5));
  await run;
  expect(requests.lastRequest).toBe(payload);

  const retry = requests.retry(handlers());
  calls[1].resolve({ items: [] });
  await retry;
  expect(api.suggestBuild).toHaveBeenCalledTimes(2);
  expect(api.suggestBuild.mock.calls[1][0]).toEqual(payload);
  expect(api.suggestBuild.mock.calls[1][0].profile).toBe(profile);
});

test("two quick revalidate calls: first request is aborted, only the second result is applied", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api, 0);
  const h = handlers();
  requests.track([cpu, ram(2)]);
  const first = requests.revalidate({ items: [cpu, ram(2)] }, h);
  await flush();
  requests.track([cpu, ram(4)]);
  const second = requests.revalidate({ items: [cpu, ram(4)] }, h);
  await flush();
  expect(calls).toHaveLength(2);
  expect(calls[0].signal.aborted).toBe(true);
  calls[1].resolve(validation(true));
  await Promise.all([first, second]);
  expect(h.onSuccess).toHaveBeenCalledTimes(1);
  expect(h.onSuccess).toHaveBeenCalledWith(validation(true));
  expect(h.onError).not.toHaveBeenCalled(); // AbortError của lần 1 không bị báo
});

test("revalidate is debounced 300 ms: rapid edits send a single /validate", async () => {
  vi.useFakeTimers();
  const { api } = fakeApi();
  const requests = createBuildRequests(api);
  requests.track([cpu]);
  void requests.revalidate({ items: [cpu] }, handlers());
  vi.advanceTimersByTime(200);
  void requests.revalidate({ items: [cpu] }, handlers());
  vi.advanceTimersByTime(299);
  expect(api.validateBuild).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(api.validateBuild).toHaveBeenCalledTimes(1);
});

test("a late /validate response for an old buildKey is dropped and state is untouched", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api, 0);
  const h = handlers();
  requests.track([cpu, ram(2)]);
  const run = requests.revalidate({ items: [cpu, ram(2)] }, h);
  await flush();
  requests.track([cpu, ram(4)]); // khách đổi tiếp nhưng response cũ về trước khi kịp hủy
  calls[0].resolve(validation(false));
  await run;
  expect(h.onSuccess).not.toHaveBeenCalled();
  expect(h.onError).not.toHaveBeenCalled();
});

test("stale replacement list for an old build is dropped too", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api);
  const h = handlers();
  requests.track([cpu]);
  const run = requests.replacements({ role: "cpu", items: [cpu] }, h);
  requests.track([{ ...cpu, variantId: 12 }]);
  calls[0].resolve([{ variantId: 13 }]);
  await run;
  expect(h.onSuccess).not.toHaveBeenCalled();
});

test("AbortError never reaches onError, real errors do", async () => {
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api);
  const h = handlers();
  requests.track([cpu]);
  const aborted = requests.replacements({ role: "cpu", items: [cpu] }, h);
  requests.cancel("replacements");
  await aborted;
  expect(h.onError).not.toHaveBeenCalled();

  const failed = requests.replacements({ role: "cpu", items: [cpu] }, h);
  calls[1].reject(new PcBuildApiError("Lỗi máy chủ", 500));
  await failed;
  expect(h.onError).toHaveBeenCalledTimes(1);
});

test("unmount (cancelAll) aborts every running request and pending debounce", async () => {
  vi.useFakeTimers();
  const { api, calls } = fakeApi();
  const requests = createBuildRequests(api);
  const h = handlers();
  requests.track([cpu]);
  void requests.suggest({ budget: 20_000_000, purpose: "gaming" }, h);
  void requests.replacements({ role: "cpu", items: [cpu] }, h);
  void requests.revalidate({ items: [cpu] }, h);
  requests.cancelAll();
  vi.advanceTimersByTime(1000);
  expect(calls.map((c) => c.signal.aborted)).toEqual([true, true]);
  expect(api.validateBuild).not.toHaveBeenCalled();
  expect(requests.isSuggesting).toBe(false);
  vi.useRealTimers();
  await flush();
  expect(h.onError).not.toHaveBeenCalled();
  expect(h.onSuccess).not.toHaveBeenCalled();
});

test("API mode uses backend checks, not rules.ts", () => {
  const res = {
    isCompatible: false,
    totalPrice: 1,
    checks: [
      { key: "R1", label: "Socket", status: "fail", detail: "AM5 ≠ LGA1700" },
      { key: "J4", label: "Nguồn", status: "warning", detail: "Dư tải thấp" },
    ],
    items: [],
  } as unknown as AiBuildResponse;
  const v = validationFromSuggest(res);
  expect(v).toMatchObject({ isCompatible: false, hasWarnings: true, hasUnknown: false });
  expect(checksToRules(v.checks)).toEqual([
    { id: "R1", title: "Socket", status: "fail", detail: "AM5 ≠ LGA1700" },
    { id: "J4", title: "Nguồn", status: "warning", detail: "Dư tải thấp" },
  ]);
});

test("suggest input: budget window from /options and purpose ≥ 2 chars", () => {
  const options = { minBudget: 8_000_000, floorPrice: 9_000_000, maxBudget: 9_999_999_999 };
  expect(checkSuggestInput(8_500_000, "gaming", options)).toContain("9.000.000");
  expect(checkSuggestInput(10_000_000_000, "gaming", options)).toContain("tối đa");
  expect(checkSuggestInput(20_000_000, " a ", options)).toContain("nhu cầu");
  expect(checkSuggestInput(20_000_000, "", options, true)).toBeNull(); // gửi kèm hồ sơ thì không bắt purpose
  expect(checkSuggestInput(8_000_000, "gaming", null)).toBeNull();
  expect(checkSuggestInput(7_999_999, "gaming", null)).not.toBeNull();
});

test("toApiError keeps code, retryAfter and data for the error box", () => {
  expect(toApiError(new PcBuildApiError("bận", 503, "AI_UNAVAILABLE", 9, { detail: "TIMEOUT" }))).toEqual({
    code: "AI_UNAVAILABLE",
    message: "bận",
    retryAfter: 9,
    data: { detail: "TIMEOUT" },
  });
  expect(toApiError(new Error("mạng lỗi"))).toEqual({ message: "mạng lỗi", retryAfter: null });
});

test("save 422 lists the failing checks and never claims success", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const notify = vi.fn();
  const err = new PcBuildApiError("Cấu hình có linh kiện không tương thích", 422, "BUILD_INCOMPATIBLE", null, {
    checks: [
      { label: "Socket CPU", status: "fail" },
      { label: "Nguồn", status: "pass" },
    ],
  });
  expect(await saveBuildOrNotify(() => Promise.reject(err), notify)).toEqual({ saved: false });
  expect(notify.mock.calls[0][0]).toContain("Socket CPU");
  expect(notify.mock.calls[0][0]).not.toContain("Nguồn");
  expect(notify.mock.calls[0][1]).toBe("danger");
});

test("demo rules read standard spec keys and report unknown instead of guessing", () => {
  const rules = evaluateHardwareRules(initialBuildParts, 30_000_000);
  expect(rules.every((r) => r.status === "pass")).toBe(true);
  const noSocket = initialBuildParts.map((p) => (p.role === "cpu" ? { ...p, specs: {} } : p));
  const socket = evaluateHardwareRules(noSocket, 30_000_000).find((r) => r.id === "socket-match");
  expect(socket?.status).toBe("unknown");
});
