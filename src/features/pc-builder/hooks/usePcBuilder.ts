import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { cartApi } from "@/features/cart";
import { money } from "@/utils";
import { pcBuilderApi, PcBuildApiError } from "../api/pcBuilderApi";
import {
  buildKey,
  buildableRequirement,
  checkInput,
  itemsFromCartSet,
  lineTotal,
  replaceLine,
  saveErrorText,
  setLineQty,
  toItemRequests,
  type CartBuildSet,
} from "../domain/buildLines";
import { createBuildRequests } from "./buildRequests";
import type {
  AnalyzeResponse,
  BuildItem,
  BuildItemRequest,
  BuildResult,
  PcBuildConfig,
  PurposeOption,
  ReplacementOption,
} from "../types/pcBuilder.types";

export type BuilderPhase = "idle" | "loading" | "analysis" | "done" | "error";
export type LoadingStep = "analyze" | "build" | "load";

export interface PcBuilderApiError {
  code?: string;
  status?: number;
  message: string;
  retryAfter: number | null;
  data?: unknown;
}

export interface ReplaceState {
  category: string;
  /** Dòng đang đổi; -1 là thêm món cho slot trống. */
  index: number;
  options: ReplacementOption[];
  loading: boolean;
  error: string | null;
}

export interface ConfirmState {
  action: "save" | "cart";
  message: string;
}

interface Outcome {
  analysis: AnalyzeResponse | null;
  build: BuildResult | null;
}

/** Lời giải thích bước 8 cùng khóa của bộ PC nó mô tả. */
interface Explanation {
  message: string;
  key: string;
}

interface GuestDraft {
  budget: number | "";
  message: string;
  analysis: AnalyzeResponse | null;
  build: BuildResult;
  explanation: Explanation | null;
}

// Không đổi tên các khóa này: giỏ hàng và trang đăng nhập dùng chung
const GUEST_BUILD_KEY = "techzone_guest_build";
const PC_SETS_KEY = "techzone_pc_build_sets";

export function toApiError(err: unknown): PcBuilderApiError {
  if (err instanceof PcBuildApiError)
    return { code: err.code, status: err.status, message: err.message, retryAfter: err.retryAfter, data: err.data };
  return {
    message: err instanceof Error && err.message ? err.message : "Máy chủ không phản hồi, vui lòng thử lại sau.",
    retryAfter: null,
  };
}

/** Cấu hình khách làm dở trước khi bị chuyển sang trang đăng nhập. */
function readGuestDraft(): GuestDraft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(GUEST_BUILD_KEY) || "null") as GuestDraft | null;
    return Array.isArray(draft?.build?.items) && draft.build.items.length > 0 ? draft : null;
  } catch {
    return null;
  }
}

function readCartSets(): CartBuildSet[] {
  try {
    const sets = JSON.parse(localStorage.getItem(PC_SETS_KEY) || "[]");
    return Array.isArray(sets) ? sets : [];
  } catch {
    return [];
  }
}

export function usePcBuilder() {
  const { user, notify, demoMode, mutateCart, reloadCart } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBuildId = searchParams.get("editBuildId");
  const [requests] = useState(() => createBuildRequests());
  const [draft] = useState(readGuestDraft);
  // Bộ PC từ giỏ hàng ("Sửa trong bộ lắp ráp"); khôi phục bản nháp sau đăng nhập được ưu tiên
  const [cartSet] = useState(() =>
    draft || !editBuildId ? null : readCartSets().find((set) => String(set.id) === editBuildId) ?? null,
  );
  const [cartItems] = useState(() => itemsFromCartSet(cartSet));

  // Form
  const [budget, setBudget] = useState<number | "">(draft?.budget ?? cartItems?.budget ?? "");
  const [message, setMessage] = useState(draft?.message ?? "");
  const [config, setConfig] = useState<PcBuildConfig | null>(null);

  // Kết quả
  const [phase, setPhase] = useState<BuilderPhase>(draft ? "done" : cartItems ? "loading" : "idle");
  const [step, setStep] = useState<LoadingStep>("load");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(draft?.analysis ?? null);
  const [build, setBuild] = useState<BuildResult | null>(draft?.build ?? null);
  const [explanation, setExplanation] = useState<Explanation | null>(draft?.explanation ?? null);
  const [error, setError] = useState<PcBuilderApiError | null>(null);
  const [retryLockedUntil, setRetryLockedUntil] = useState(0);

  // Kiểm tra lại sau khi khách đổi món
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Đổi món, lưu, giỏ hàng
  const [replace, setReplace] = useState<ReplaceState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBuildId, setSavedBuildId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const saving = useRef(false);
  const adding = useRef(false);
  const lastAction = useRef<(() => void) | null>(null);

  const numericBudget = typeof budget === "number" ? budget : Number(budget) || 0;

  useEffect(() => () => requests.cancelAll(), [requests]);

  useEffect(() => {
    let active = true;
    pcBuilderApi
      .getConfig()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch((err) => {
        console.warn("[PC Builder] Không lấy được cấu hình PC:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draft) return;
    sessionStorage.removeItem(GUEST_BUILD_KEY);
    requests.track(toItemRequests(draft.build.items));
    notify("Đã khôi phục cấu hình bạn vừa tạo.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cartSet) return;
    if (!cartItems) {
      notify("Không đọc được bộ PC này trong giỏ hàng, vui lòng tạo cấu hình mới.", "warning");
      return;
    }
    const name = cartSet.name || "từ giỏ hàng";
    void requests.suggest(
      async (signal) => ({
        analysis: null,
        build: await pcBuilderApi.validate({ budget: cartItems.budget, items: cartItems.items }, { signal }),
      }),
      {
        onSuccess: (outcome: Outcome) => {
          applyOutcome(outcome);
          notify(`✨ Đã nạp cấu hình "${name}" vào bộ lắp ráp.`, "success");
        },
        onError: applyError,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mọi lần thay cả bộ PC đi qua đây để phản hồi /validate, /replacements cũ bị bỏ. */
  function applyBuild(next: BuildResult | null) {
    requests.cancel("validate");
    requests.track(next ? toItemRequests(next.items) : []);
    setBuild(next);
    setIsChecking(false);
    setCheckError(null);
  }

  function applyOutcome({ analysis: nextAnalysis, build: nextBuild }: Outcome) {
    setAnalysis(nextAnalysis);
    setError(null);
    setRetryLockedUntil(0);
    setSavedBuildId(null);
    if (!nextBuild) {
      applyBuild(null);
      setExplanation(null);
      setPhase("analysis");
      return;
    }
    if (!Array.isArray(nextBuild.items) || nextBuild.items.length === 0) {
      applyError(new Error("Chưa tìm được bộ linh kiện phù hợp với ngân sách này trong kho."));
      return;
    }
    applyBuild(nextBuild);
    setExplanation(
      nextBuild.message ? { message: nextBuild.message, key: buildKey(toItemRequests(nextBuild.items)) } : null,
    );
    setPhase("done");
  }

  function applyError(err: unknown) {
    console.warn("[PC Builder] Lỗi khi đề xuất cấu hình:", err);
    const apiError = toApiError(err);
    // Không giữ bộ PC cũ trên màn hình khi lỗi
    applyBuild(null);
    setExplanation(null);
    setError(apiError);
    setRetryLockedUntil(apiError.retryAfter ? Date.now() + apiError.retryAfter * 1000 : 0);
    setPhase("error");
  }

  function runSuggest(call: (signal: AbortSignal) => Promise<Outcome>, firstStep: LoadingStep) {
    setPhase("loading");
    setStep(firstStep);
    setError(null);
    setReplace(null);
    setConfirm(null);
    void requests.suggest(call, { onSuccess: applyOutcome, onError: applyError });
  }

  /** Bấm "Đề xuất": analyze, rồi tự gọi /builds/auto khi READY. */
  function submit(budgetOverride?: number) {
    if (requests.isSuggesting) return;
    const value = budgetOverride ?? numericBudget;
    const text = message.trim();
    const invalid = checkInput(value, text, config?.maxBuildPrice);
    if (invalid) {
      notify(invalid, "danger");
      return;
    }
    if (budgetOverride !== undefined) setBudget(budgetOverride);
    lastAction.current = () => submit(value);
    setAnalysis(null);
    runSuggest(async (signal) => {
      const result = await pcBuilderApi.analyze({ budget: value, message: text }, { signal });
      const requirement = buildableRequirement(result);
      if (!requirement) return { analysis: result, build: null };
      setStep("build");
      return { analysis: result, build: await pcBuilderApi.autoBuild(requirement, { signal }) };
    }, "analyze");
  }

  /** BUDGET_TOO_LOW: khách chọn một mục đích vừa ngân sách trong suggestedPurposes. */
  function buildWithPurpose(option: PurposeOption) {
    if (requests.isSuggesting) return;
    const value = analysis?.requirement?.budget ?? numericBudget;
    lastAction.current = () => buildWithPurpose(option);
    runSuggest(
      async (signal) => ({
        analysis: null,
        build: await pcBuilderApi.autoBuild({ budget: value, purpose: option.purpose }, { signal }),
      }),
      "build",
    );
  }

  /** "Thử lại": chạy lại đúng thao tác vừa lỗi, khóa trong Retry-After giây. */
  function retry() {
    if (requests.isSuggesting) return;
    if (Date.now() < retryLockedUntil) {
      const seconds = Math.ceil((retryLockedUntil - Date.now()) / 1000);
      notify(`Hệ thống đang bận, vui lòng thử lại sau ${seconds} giây.`, "warning");
      return;
    }
    if (lastAction.current) lastAction.current();
    else submit();
  }

  function reset() {
    requests.cancelAll();
    lastAction.current = null;
    applyBuild(null);
    setPhase("idle");
    setAnalysis(null);
    setExplanation(null);
    setError(null);
    setRetryLockedUntil(0);
    setReplace(null);
    setConfirm(null);
    setSavedBuildId(null);
    setBudget("");
    setMessage("");
  }

  /** Khách đổi món / số lượng: hiện ngay theo giá đang có, rồi /validate (debounce) trả trạng thái thật. */
  function updateItems(items: BuildItem[]) {
    if (!build) return;
    const requestItems = toItemRequests(items);
    const total = lineTotal(items);
    requests.track(requestItems);
    setBuild({ ...build, items, total, difference: total - build.budget });
    setSavedBuildId(null);
    setIsChecking(true);
    setCheckError(null);
    void revalidate(build.budget, requestItems);
  }

  function revalidate(budgetValue: number, items: BuildItemRequest[]) {
    return requests.revalidate(
      (signal) => pcBuilderApi.validate({ budget: budgetValue, items }, { signal }),
      items,
      {
        onSuccess: (result: BuildResult) => {
          // /validate không có mục đích và lời giải thích: giữ của lần tự build
          setBuild((prev) => ({ ...result, purpose: prev?.purpose ?? result.purpose, message: null }));
          setIsChecking(false);
        },
        onError: (err) => {
          console.warn("[PC Builder] Lỗi kiểm tra lại cấu hình:", err);
          setIsChecking(false);
          setCheckError(toApiError(err).message);
        },
      },
    );
  }

  function recheck() {
    if (!build) return;
    setIsChecking(true);
    setCheckError(null);
    void revalidate(build.budget, toItemRequests(build.items));
  }

  function changeQty(index: number, qty: number) {
    if (!build) return;
    const items = setLineQty(build.items, index, qty);
    if (items !== build.items) updateItems(items);
  }

  function openReplace(category: string, index: number) {
    if (!build) return;
    setReplace({ category, index, options: [], loading: true, error: null });
    const items = toItemRequests(build.items);
    const isSame = (prev: ReplaceState | null) => prev?.category === category && prev.index === index;
    void requests.replacements(
      (signal) => pcBuilderApi.replacements({ category, items }, { signal }),
      items,
      {
        onSuccess: (options: ReplacementOption[]) =>
          setReplace((prev) => (prev && isSame(prev) ? { ...prev, options, loading: false } : prev)),
        onError: (err) =>
          setReplace((prev) =>
            prev && isSame(prev) ? { ...prev, loading: false, error: toApiError(err).message } : prev,
          ),
      },
    );
  }

  function closeReplace() {
    requests.cancel("replacements");
    setReplace(null);
  }

  function chooseReplacement(option: ReplacementOption) {
    if (!build || !replace) return;
    const current = build.items[replace.index];
    closeReplace();
    if (option.current && current?.id === option.id && current.qty === option.qty) return;
    updateItems(replaceLine(build.items, replace.index, replace.category, option));
    notify(`Đã chọn "${option.name}".`);
  }

  function redirectGuestToLogin() {
    if (build) {
      try {
        const guestDraft: GuestDraft = { budget, message, analysis, build, explanation };
        sessionStorage.setItem(GUEST_BUILD_KEY, JSON.stringify(guestDraft));
      } catch (err) {
        console.warn("[PC Builder] Không lưu tạm được cấu hình:", err);
      }
    }
    navigate("/dang-nhap", { state: { from: "/build-pc" } });
  }

  /** Chặn lưu / thêm giỏ khi bộ PC chưa có kết quả kiểm tra mới nhất hoặc đang xung đột. */
  function blockedReason(): string | null {
    if (!build) return "Chưa có cấu hình nào.";
    if (isChecking) return "Đang kiểm tra lại cấu hình, vui lòng đợi trong giây lát.";
    if (checkError) return "Chưa kiểm tra được cấu hình mới nhất. Bấm \"Kiểm tra lại\" rồi thử lại.";
    if (build.status === "INCOMPATIBLE") return "Cấu hình có linh kiện không tương thích, hãy đổi linh kiện trước.";
    return null;
  }

  /** Lưu bộ PC (bước 9). Vượt ngân sách thì server trả 409 và câu popup; khách bấm "Tiếp tục" thì gửi lại kèm xác nhận. */
  async function save(confirmOverBudget = false) {
    if (!build || saving.current) return;
    if (!user) {
      notify("Vui lòng đăng nhập để lưu cấu hình.", "warning");
      redirectGuestToLogin();
      return;
    }
    const blocked = blockedReason();
    if (blocked) {
      notify(blocked, "warning");
      return;
    }
    saving.current = true;
    setIsSaving(true);
    try {
      const result = await pcBuilderApi.save({
        budget: build.budget,
        items: toItemRequests(build.items),
        ...(confirmOverBudget ? { confirmOverBudget: true } : {}),
      });
      setSavedBuildId(result.buildId);
      notify(`💾 Đã lưu cấu hình #${result.buildId} vào tài khoản của bạn.`, "success");
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "OVER_BUDGET_NOT_CONFIRMED") {
        setConfirm({ action: "save", message: apiError.message });
      } else if (apiError.status === 401) {
        notify("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "warning");
        redirectGuestToLogin();
      } else {
        console.warn("[PC Builder] Lỗi lưu cấu hình:", err);
        notify(`❌ Lưu cấu hình thất bại: ${saveErrorText(apiError.message, apiError.data)}`, "danger");
      }
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  function addToCart(confirmed = false) {
    if (!build) return;
    const blocked = blockedReason();
    if (blocked) {
      notify(blocked, "warning");
      return;
    }
    if (build.status === "OVER_BUDGET" && !confirmed) {
      const warning = build.budgetWarning || `Bộ PC vượt ngân sách ${money(build.difference)}.`;
      setConfirm({ action: "cart", message: `${warning}. Bạn vẫn muốn thêm vào giỏ hàng?` });
      return;
    }
    void addBuildToCart(build);
  }

  async function addBuildToCart(current: BuildResult) {
    if (adding.current) return;
    if (!user) {
      redirectGuestToLogin();
      return;
    }
    adding.current = true;
    setIsAdding(true);
    let added = 0;
    try {
      const quantities = new Map<number, number>();
      for (const item of current.items) quantities.set(item.id, (quantities.get(item.id) || 0) + item.qty);
      const updated = await mutateCart(async () => {
        for (const [variantId, qty] of quantities) {
          await cartApi.add(String(variantId), qty);
          added++;
        }
      });
      if (!updated) return;
      rememberCartSet(current);
      notify("Đã thêm các linh kiện vào giỏ hàng.");
      navigate("/gio-hang");
    } catch (err) {
      if (added) await reloadCart();
      const reason = err instanceof Error && err.message ? err.message : "Không thêm được cấu hình vào giỏ hàng.";
      notify(added ? `${reason} Đã thêm ${added} linh kiện; kiểm tra giỏ hàng trước khi thêm lại.` : reason, "danger");
    } finally {
      adding.current = false;
      setIsAdding(false);
    }
  }

  /** Giỏ hàng gom các linh kiện này thành một bộ PC (chỉ lưu ở trình duyệt). */
  function rememberCartSet(current: BuildResult) {
    try {
      const set: CartBuildSet & { createdAt: number } = {
        id: savedBuildId ?? "set_" + Date.now(),
        name: "Bộ PC AI Build" + (message.trim() ? ": " + message.trim().slice(0, 30) : ""),
        budget: current.budget,
        itemVariantIds: current.items.map((item) => String(item.id)),
        parts: current.items.map((item) => ({ ...item })),
        createdAt: Date.now(),
      };
      localStorage.setItem(PC_SETS_KEY, JSON.stringify([...readCartSets(), set]));
    } catch (err) {
      console.error(err);
    }
  }

  function confirmContinue() {
    const pending = confirm;
    setConfirm(null);
    if (pending?.action === "save") void save(true);
    else if (pending?.action === "cart") addToCart(true);
  }

  return {
    config,
    demoMode,
    budget,
    setBudget,
    message,
    setMessage,
    phase,
    step,
    analysis,
    build,
    explanation: explanation?.message ?? null,
    isEdited: Boolean(explanation && build && buildKey(toItemRequests(build.items)) !== explanation.key),
    error,
    retryLockedUntil,
    isChecking,
    checkError,
    replace,
    confirm,
    isSaving,
    savedBuildId,
    isAdding,
    isBusy: phase === "loading" || isSaving || isAdding,
    submit,
    buildWithPurpose,
    retry,
    reset,
    recheck,
    changeQty,
    openReplace,
    closeReplace,
    chooseReplacement,
    save: () => save(false),
    addToCart: () => addToCart(false),
    confirmContinue,
    cancelConfirm: () => setConfirm(null),
  };
}
