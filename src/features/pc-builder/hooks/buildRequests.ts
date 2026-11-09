import { isAbortError } from "../api/pcBuilderApi";
import { buildKey } from "../domain/buildLines";
import type { BuildItemRequest } from "../types/pcBuilder.types";

export type RequestKind = "suggest" | "validate" | "replacements";

export interface RequestHandlers<T> {
  onSuccess: (result: T) => void;
  onError: (error: unknown) => void;
}

type Call<T> = (signal: AbortSignal) => Promise<T>;

/**
 * Điều phối request của /build-pc, tách khỏi React để test được:
 * - mỗi loại một AbortController + số thứ tự: request mới hủy request cũ cùng loại;
 * - "suggest" (analyze → auto) chống bấm trùng khi đang chạy;
 * - "validate" debounce 300 ms;
 * - phản hồi validate / replacements của bộ PC cũ (buildKey khác bộ đang hiện) bị bỏ;
 * - lỗi do hủy không bao giờ tới onError.
 */
export function createBuildRequests(debounceMs = 300) {
  const controllers: Partial<Record<RequestKind, AbortController>> = {};
  const sequence: Record<RequestKind, number> = { suggest: 0, validate: 0, replacements: 0 };
  let currentKey = "";
  let suggesting = false;
  let suggestToken = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingValidate: ((started: boolean) => void) | null = null;

  async function run<T>(kind: RequestKind, call: Call<T>, handlers: RequestHandlers<T>, key?: string) {
    controllers[kind]?.abort();
    const controller = new AbortController();
    controllers[kind] = controller;
    const id = ++sequence[kind];
    const stale = () => id !== sequence[kind] || controller.signal.aborted || (key !== undefined && key !== currentKey);
    try {
      const result = await call(controller.signal);
      if (stale()) return false;
      handlers.onSuccess(result);
      return true;
    } catch (error) {
      if (stale() || isAbortError(error)) return false;
      handlers.onError(error);
      return false;
    } finally {
      if (controllers[kind] === controller) delete controllers[kind];
    }
  }

  function clearDebounce() {
    if (timer) clearTimeout(timer);
    timer = null;
    pendingValidate?.(false);
    pendingValidate = null;
  }

  function cancel(kind: RequestKind) {
    if (kind === "validate") clearDebounce();
    if (kind === "suggest") {
      suggesting = false;
      suggestToken++;
    }
    sequence[kind]++;
    controllers[kind]?.abort();
    delete controllers[kind];
  }

  return {
    get isSuggesting() {
      return suggesting;
    },

    /** Ghi nhận bộ PC đang hiện; gọi mỗi khi items đổi. */
    track(items: BuildItemRequest[]) {
      currentKey = buildKey(items);
    },

    /** Trả false khi đang có một lượt khác chạy (bấm trùng), lỗi hoặc bị hủy. */
    async suggest<T>(call: Call<T>, handlers: RequestHandlers<T>) {
      if (suggesting) return false;
      suggesting = true;
      const token = ++suggestToken;
      try {
        return await run("suggest", call, handlers);
      } finally {
        if (token === suggestToken) suggesting = false;
      }
    },

    /** Kiểm lại bộ PC `items` sau debounce; lần gọi mới trong lúc chờ thay thế lần cũ. */
    revalidate<T>(call: Call<T>, items: BuildItemRequest[], handlers: RequestHandlers<T>) {
      const key = buildKey(items);
      clearDebounce();
      return new Promise<boolean>((resolve) => {
        const start = () => {
          timer = null;
          pendingValidate = null;
          void run("validate", call, handlers, key).then(resolve);
        };
        pendingValidate = resolve;
        if (debounceMs <= 0) start();
        else timer = setTimeout(start, debounceMs);
      });
    },

    replacements<T>(call: Call<T>, items: BuildItemRequest[], handlers: RequestHandlers<T>) {
      return run("replacements", call, handlers, buildKey(items));
    },

    cancel,

    /** Unmount / làm lại từ đầu: hủy mọi request và debounce đang chờ. */
    cancelAll() {
      (["suggest", "validate", "replacements"] as const).forEach(cancel);
    },
  };
}

export type BuildRequests = ReturnType<typeof createBuildRequests>;
