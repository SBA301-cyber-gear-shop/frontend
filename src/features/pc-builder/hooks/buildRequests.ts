import { isAbortError } from "../api/pcBuilderApi";
import type {
  AiBuildRequestPayload,
  AiBuildResponse,
  BuildItemPayload,
  BuildPart,
  CompatibilityCheckResponse,
  CompatibleReplacementResponse,
  CompatibleReplacementsQuery,
  RuleCheck,
  ValidateBuildPayload,
  ValidateBuildResponse,
} from "../types/pcBuilder.types";

type Line = Pick<BuildPart, "role" | "variantId" | "quantity">;

/** buildKey = các dòng role:variantId:quantity sắp xếp rồi nối bằng dấu phẩy (DD 10.4, D26). */
export function buildKey(lines: Line[]): string {
  return lines
    .map((l) => `${l.role}:${l.variantId}:${l.quantity}`)
    .sort()
    .join(",");
}

export function toBuildItems(parts: Line[]): BuildItemPayload[] {
  return parts.map((p) => ({ role: p.role, variantId: Number(p.variantId), quantity: p.quantity }));
}

/** Check backend → dạng RuleCheck mà SummaryCard đang hiển thị. */
export function checksToRules(checks: CompatibilityCheckResponse[]): RuleCheck[] {
  return checks.map((c, i) => ({
    id: c.key || `check-${i}`,
    title: c.label,
    detail: c.detail,
    status: c.status,
  }));
}

/** Kết quả /ai-suggest cũng là một lần kiểm tra: dùng chung state `validation` với /validate. */
export function validationFromSuggest(res: AiBuildResponse): ValidateBuildResponse {
  const checks = res.checks || [];
  return {
    isCompatible: res.isCompatible,
    hasWarnings: checks.some((c) => c.status === "warning"),
    hasUnknown: checks.some((c) => c.status === "unknown"),
    totalPrice: res.totalPrice,
    budgetFit: res.budgetFit ?? null,
    checks,
    requiredPsuW: res.requiredPsuW ?? 0,
    capacity: res.capacity ?? {
      ramSlotsUsed: 0,
      ramSlotsMax: 0,
      ramGb: 0,
      ramMaxGb: 0,
      m2Used: 0,
      m2Max: 0,
      gpuCount: 0,
      gpuMax: 0,
    },
    items: res.items || [],
  };
}

export interface BuildRequestsApi {
  suggestBuild(p: AiBuildRequestPayload, o: { signal?: AbortSignal }): Promise<AiBuildResponse>;
  validateBuild(p: ValidateBuildPayload, o: { signal?: AbortSignal }): Promise<ValidateBuildResponse>;
  getCompatibleReplacements(
    q: CompatibleReplacementsQuery,
    o: { signal?: AbortSignal },
  ): Promise<CompatibleReplacementResponse[]>;
}

type Kind = "suggest" | "validate" | "replacements";
type Handlers<T> = { onSuccess: (result: T) => void; onError: (error: unknown) => void };

/**
 * Điều phối request của PC Builder (DD 10.4, U16): mỗi loại một AbortController + requestSeq,
 * chống gửi trùng /ai-suggest, bỏ phản hồi lỗi thời theo buildKey, giữ lastRequest để "Thử lại".
 * Lỗi do hủy không bao giờ tới onError.
 */
export function createBuildRequests(api: BuildRequestsApi, debounceMs = 300) {
  const controllers: Partial<Record<Kind, AbortController>> = {};
  const seq: Record<Kind, number> = { suggest: 0, validate: 0, replacements: 0 };
  let currentKey = "";
  let lastRequest: AiBuildRequestPayload | null = null;
  let suggesting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel(kind: Kind) {
    if (kind === "validate") clearTimeout(timer);
    if (kind === "suggest") suggesting = false;
    controllers[kind]?.abort();
    delete controllers[kind];
    seq[kind]++;
  }

  async function run<T>(
    kind: Kind,
    call: (signal: AbortSignal) => Promise<T>,
    key: string | null,
    { onSuccess, onError }: Handlers<T>,
  ) {
    controllers[kind]?.abort();
    const controller = new AbortController();
    controllers[kind] = controller;
    const id = ++seq[kind];
    // Chỉ áp khi là request mới nhất của loại này và (nếu có key) build chưa đổi
    const current = () =>
      id === seq[kind] && !controller.signal.aborted && (key === null || key === currentKey);
    try {
      const result = await call(controller.signal);
      if (current()) onSuccess(result);
    } catch (error) {
      if (!isAbortError(error) && current()) onError(error);
    } finally {
      if (controllers[kind] === controller) delete controllers[kind];
    }
  }

  return {
    /** Ghi nhận buildParts hiện tại; phản hồi mang buildKey khác sẽ bị bỏ. */
    track(parts: Line[]) {
      currentKey = buildKey(parts);
    },
    get lastRequest() {
      return lastRequest;
    },
    get isSuggesting() {
      return suggesting;
    },
    /** false khi đang có /ai-suggest chạy: request mới bị bỏ qua (chống gửi trùng). */
    async suggest(payload: AiBuildRequestPayload, handlers: Handlers<AiBuildResponse>) {
      if (suggesting) return false;
      suggesting = true;
      lastRequest = payload;
      const id = seq.suggest + 1;
      try {
        await run("suggest", (signal) => api.suggestBuild(payload, { signal }), null, handlers);
      } finally {
        if (seq.suggest === id) suggesting = false;
      }
      return true;
    },
    async retry(handlers: Handlers<AiBuildResponse>) {
      return lastRequest ? this.suggest(lastRequest, handlers) : false;
    },
    /** Debounce rồi gọi /validate; lần gọi mới hủy lần trước. */
    revalidate(payload: ValidateBuildPayload, handlers: Handlers<ValidateBuildResponse>) {
      clearTimeout(timer);
      const key = buildKey(payload.items);
      return new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          void run("validate", (signal) => api.validateBuild(payload, { signal }), key, handlers).then(resolve);
        }, debounceMs);
      });
    },
    replacements(query: CompatibleReplacementsQuery, handlers: Handlers<CompatibleReplacementResponse[]>) {
      return run(
        "replacements",
        (signal) => api.getCompatibleReplacements(query, { signal }),
        buildKey(query.items),
        handlers,
      );
    },
    cancel,
    cancelAll() {
      (["suggest", "validate", "replacements"] as Kind[]).forEach(cancel);
    },
  };
}

export type BuildRequests = ReturnType<typeof createBuildRequests>;
