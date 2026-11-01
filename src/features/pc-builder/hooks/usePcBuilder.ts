import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import type {
  AiBuildRequestPayload,
  AiBuildResponse,
  BuildOptionsResponse,
  BuildPart,
  CompatibilityCheckResponse,
  ComponentRole,
  ReplacementCandidate,
  AiBuildInsight,
  BuilderStatus,
  RequirementProfile,
  SavedPcBuildDetail,
  ValidateBuildResponse,
} from "../types/pcBuilder.types";
import {
  initialBuildParts,
  initialAiInsight,
  initialProfile,
  evaluateHardwareRules,
  replacementCandidatesByRole,
  ROLE_LABELS,
} from "../domain";
import { pcBuilderApi, PcBuildApiError } from "../api/pcBuilderApi";
import { cartApi } from "@/features/cart";
import { checksToRules, createBuildRequests, toBuildItems, validationFromSuggest } from "./buildRequests";

// Dùng khi /options chưa tải được; backend vẫn kiểm lại (DD 5.2)
const DEFAULT_MIN_BUDGET = 8_000_000;
const DEFAULT_MAX_BUDGET = 9_999_999_999;

export interface PcBuilderApiError {
  code?: string;
  message: string;
  retryAfter: number | null;
  data?: unknown;
}

// Tách khỏi hook để test được: lưu lỗi thì báo lỗi, không báo "Đã lưu" (B27)
export async function saveBuildOrNotify(
  save: () => Promise<number>,
  notify: (message: string, tone?: string) => void,
): Promise<{ saved: boolean; buildId?: number }> {
  try {
    const buildId = await save();
    notify("💾 Đã lưu cấu hình PC thành công vào tài khoản của bạn!", "success");
    return { saved: true, buildId };
  } catch (err: unknown) {
    console.warn("[PC Builder] Lỗi lưu cấu hình:", err);
    let reason = err instanceof Error && err.message ? err.message : "Máy chủ không phản hồi";
    // 422 BUILD_INCOMPATIBLE: liệt kê check fail (DD 10.4)
    const checks = (err instanceof PcBuildApiError &&
      (err.data as { checks?: CompatibilityCheckResponse[] } | undefined)?.checks) || [];
    const failed = checks.filter((c) => c.status === "fail").map((c) => c.label);
    if (failed.length) reason += ` (${failed.join(", ")})`;
    notify(`❌ Lưu cấu hình thất bại: ${reason}. Vui lòng thử lại.`, "danger");
    return { saved: false };
  }
}

export function toApiError(err: unknown): PcBuilderApiError {
  if (err instanceof PcBuildApiError)
    return { code: err.code, message: err.message, retryAfter: err.retryAfter, data: err.data };
  return {
    message:
      err instanceof Error && err.message
        ? err.message
        : "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau!",
    retryAfter: null,
  };
}

/** Kiểm tra form trước khi gửi /ai-suggest; trả câu báo lỗi hoặc null (DD 10.4). */
export function checkSuggestInput(
  budget: number,
  purpose: string,
  options: Pick<BuildOptionsResponse, "minBudget" | "floorPrice" | "maxBudget"> | null,
  hasProfile = false,
): string | null {
  const min = Math.max(options?.minBudget ?? DEFAULT_MIN_BUDGET, options?.floorPrice ?? 0);
  const max = options?.maxBudget ?? DEFAULT_MAX_BUDGET;
  const vnd = (n: number) => n.toLocaleString("vi-VN") + " ₫";
  if (!budget || budget < min) return `Ngân sách tối thiểu để ráp một bộ máy mới là ${vnd(min)}.`;
  if (budget > max) return `Ngân sách tối đa là ${vnd(max)}.`;
  if (!hasProfile && purpose.trim().length < 2) return "Vui lòng mô tả nhu cầu sử dụng chính (ít nhất 2 ký tự).";
  return null;
}

function toBuildParts(
  items: AiBuildResponse["items"],
  fallbackReason: string,
): BuildPart[] {
  return items.map((item) => ({
    role: item.role,
    roleName: ROLE_LABELS[item.role] || item.role.toUpperCase(),
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName || "",
    imageUrl: item.imageUrl || "/placeholder-pc.svg",
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    specs: item.specs || {},
    aiReason: item.aiReason || fallbackReason,
  }));
}

const GUEST_BUILD_KEY = "techzone_guest_build";

export function usePcBuilder() {
  const { user, commit, notify, demoMode, mutateCart, reloadCart } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBuildId = searchParams.get("editBuildId") || searchParams.get("loadBuildId");
  const addingParts = useRef(false);
  const [requests] = useState(() => createBuildRequests(pcBuilderApi));

  async function addLiveParts(
    parts: { variantId: number | string; quantity: number }[],
    buildName?: string,
    buildIdVal?: number | string
  ) {
    if (addingParts.current) return;
    if (!user) {
      redirectGuestToLogin();
      return;
    }
    if (!parts.length) return;
    addingParts.current = true;
    setIsBusy(true);
    let added = 0;
    try {
      const quantities = new Map<string, number>();
      for (const part of parts) {
        const id = String(part.variantId);
        if (
          !Number.isInteger(Number(id)) ||
          Number(id) <= 0 ||
          !Number.isInteger(part.quantity) ||
          part.quantity < 1
        )
          throw new Error("Cấu hình có linh kiện hoặc số lượng không hợp lệ.");
        quantities.set(id, (quantities.get(id) || 0) + part.quantity);
      }
      const updated = await mutateCart(async () => {
        for (const [id, quantity] of quantities) {
          await cartApi.add(id, quantity);
          added++;
        }
      });
      if (!updated) return;
      try {
        const buildSet = {
          id: buildIdVal || ("set_" + Date.now()),
          name: buildName || (userPrompt ? ("Dàn PC AI Build: " + userPrompt.slice(0, 30)) : "Dàn PC Gaming & Đồ Họa Pro"),
          itemVariantIds: parts.map((p) => String(p.variantId)),
          parts: buildParts.length > 0 ? buildParts : parts,
          createdAt: Date.now(),
        };
        const existingSets = JSON.parse(localStorage.getItem("techzone_pc_build_sets") || "[]");
        localStorage.setItem("techzone_pc_build_sets", JSON.stringify([...existingSets, buildSet]));
      } catch (e) {
        console.error(e);
      }
      notify("Đã thêm các linh kiện vào giỏ hàng.");
      navigate("/gio-hang");
    } catch (error) {
      if (added) await reloadCart();
      const message =
        error instanceof Error
          ? error.message
          : "Không thêm được cấu hình vào giỏ hàng.";
      notify(
        added
          ? `${message} Đã thêm ${added} phiên bản; kiểm tra giỏ hàng trước khi thêm lại.`
          : message,
        "danger",
      );
    } finally {
      addingParts.current = false;
      setIsBusy(false);
    }
  }

  // Inputs
  const [budget, setBudget] = useState<number | "">("");
  const [purpose, setPurpose] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");

  // States
  const [buildId, setBuildId] = useState<number | string | null>(null);
  const [status, setStatus] = useState<BuilderStatus>("empty");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<PcBuilderApiError | null>(null);
  const [retryLockedUntil, setRetryLockedUntil] = useState<number>(0);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isFetchingCandidates, setIsFetchingCandidates] =
    useState<boolean>(false);
  const [buildParts, setBuildParts] = useState<BuildPart[]>([]);
  const [aiInsight, setAiInsight] = useState<AiBuildInsight | null>(null);
  const [activeReplaceRole, setActiveReplaceRole] =
    useState<ComponentRole | null>(null);
  const [dynamicCandidates, setDynamicCandidates] = useState<
    ReplacementCandidate[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Hồ sơ nhu cầu & kết quả kiểm tra của backend (DD 10.4)
  const [options, setOptions] = useState<BuildOptionsResponse | null>(null);
  const [profile, setProfile] = useState<RequirementProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<RequirementProfile | null>(null);
  const [lastRequest, setLastRequest] = useState<AiBuildRequestPayload | null>(null);
  const [aiResult, setAiResult] = useState<AiBuildResponse | null>(null);
  const [validation, setValidation] = useState<ValidateBuildResponse | null>(null);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  useEffect(() => () => requests.cancelAll(), [requests]);

  // Khách đăng nhập xong quay lại: khôi phục cấu hình đang làm dở.
  useEffect(() => {
    if (editBuildId) return;
    const saved = sessionStorage.getItem(GUEST_BUILD_KEY);
    if (!saved) return;
    sessionStorage.removeItem(GUEST_BUILD_KEY);
    try {
      const draft = JSON.parse(saved);
      setBudget(draft.budget);
      setPurpose(draft.purpose);
      setUserPrompt(draft.userPrompt);
      setProfile(draft.profile);
      setProfileDraft(draft.profileDraft);
      setLastRequest(draft.lastRequest);
      setAiResult(draft.aiResult);
      setAiInsight(draft.aiInsight);
      setValidation(draft.validation);
      applyParts(draft.buildParts);
      setStatus("success");
      notify("Đã khôi phục cấu hình bạn vừa tạo.");
    } catch (error) {
      console.warn("[PC Builder] Không khôi phục được cấu hình:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectGuestToLogin() {
    if (buildParts.length > 0) {
      try {
        sessionStorage.setItem(
          GUEST_BUILD_KEY,
          JSON.stringify({
            budget,
            purpose,
            userPrompt,
            profile,
            profileDraft,
            lastRequest,
            aiResult,
            aiInsight,
            validation,
            buildParts,
          }),
        );
      } catch (error) {
        console.warn("[PC Builder] Không lưu tạm được cấu hình:", error);
      }
    }
    navigate("/dang-nhap", { state: { from: "/build-pc" } });
  }

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    pcBuilderApi
      .getBuildOptions()
      .then((o) => active && setOptions(o))
      .catch((err) => console.warn("[PC Builder] Không tải được /options:", err));
    return () => {
      active = false;
    };
  }, [demoMode]);

  /** Mọi thay đổi buildParts đi qua đây để phản hồi /validate, /replacements cũ bị bỏ theo buildKey. */
  function applyParts(next: BuildPart[]) {
    requests.track(next);
    setBuildParts(next);
  }

  /** Gọi /validate (debounce 300 ms) sau khi khách đổi linh kiện / số lượng. Demo mode dùng rules.ts. */
  function revalidate(next: BuildPart[], budgetValue = numericBudget) {
    if (demoMode || next.length === 0) return;
    setIsRevalidating(true);
    void requests.revalidate(
      { budget: budgetValue || undefined, profile, items: toBuildItems(next) },
      {
        onSuccess: (result) => {
          setValidation(result);
          setIsRevalidating(false);
        },
        onError: (err) => {
          console.warn("[PC Builder] Lỗi kiểm tra tương thích:", err);
          setValidation(null);
          setIsRevalidating(false);
          notify(`❌ Không kiểm tra được tương thích: ${toApiError(err).message}`, "danger");
        },
      },
    );
  }

  /** Bỏ mọi kết quả kiểm tra đang chờ: dùng khi buildParts được thay cả bộ. */
  function resetValidation(next: ValidateBuildResponse | null) {
    requests.cancel("validate");
    setIsRevalidating(false);
    setValidation(next);
  }

  useEffect(() => {
    if (!editBuildId) return;
    let isMounted = true;
    setIsBusy(true);

    const numericId = Number(editBuildId);
    if (numericId && user) {
      pcBuilderApi
        .getSavedBuildDetail(numericId)
        .then((detail) => {
          if (!isMounted) return;
          loadSavedBuildIntoBuilder(detail);
        })
        .catch(() => {
          loadFromLocal(editBuildId, isMounted);
        })
        .finally(() => {
          if (isMounted) setIsBusy(false);
        });
    } else {
      loadFromLocal(editBuildId, isMounted);
      setIsBusy(false);
    }

    function loadFromLocal(idToFind: string, mounted: boolean) {
      try {
        const sets = JSON.parse(localStorage.getItem("techzone_pc_build_sets") || "[]");
        const found = sets.find((s: any) => String(s.id) === String(idToFind));
        if (found && Array.isArray(found.parts) && found.parts.length > 0 && mounted) {
          applyParts(found.parts);
          resetValidation(null);
          revalidate(found.parts);
          setBuildId(null);
          setIsSaved(false);
          setStatus("success");
          setAiInsight({
            title: found.name || "Cấu hình chỉnh sửa",
            reasoning: "Cấu hình đã được nạp từ giỏ hàng vào bộ lắp ráp.",
            highlight: "Bạn có thể tiếp tục tùy chỉnh các linh kiện bên dưới hoặc thêm lại vào giỏ.",
          });
          notify("✨ Đã nạp cấu hình \"" + (found.name || "từ giỏ hàng") + "\" vào bộ lắp ráp!", "success");
        }
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [editBuildId, user]);

  // Derived calculations
  const grandTotal = buildParts.reduce(
    (sum, p) => sum + p.unitPrice * p.quantity,
    0,
  );
  const numericBudget =
    typeof budget === "number" ? budget : Number(budget) || 0;
  const remainingBudget = numericBudget - grandTotal;
  // API mode: check của backend; demo mode: rules.ts (DD 10.4)
  const rules = demoMode
    ? evaluateHardwareRules(buildParts, numericBudget)
    : checksToRules(validation?.checks || []);
  const allRulesPassed = demoMode
    ? rules.every((r) => r.status === "pass")
    : Boolean(validation?.isCompatible && !validation.hasWarnings && !validation.hasUnknown);
  const canAddToCart = demoMode
    ? rules.every((r) => r.status !== "fail")
    : Boolean(validation?.isCompatible && !isRevalidating && validation.budgetFit?.status !== "OVER");

  // Candidates for the currently active modal role
  const modalCandidates: ReplacementCandidate[] =
    dynamicCandidates.length > 0 || !demoMode
      ? dynamicCandidates
      : activeReplaceRole
        ? replacementCandidatesByRole[activeReplaceRole] || []
        : [];

  function onSuggestSuccess(res: AiBuildResponse) {
    if (!Array.isArray(res.items) || res.items.length === 0) {
      onSuggestError(new Error("AI chưa tìm thấy bộ linh kiện phù hợp với mức ngân sách này trong kho."));
      return;
    }
    const parts = toBuildParts(res.items, "Linh kiện được AI lựa chọn cân đối theo ngân sách và nhu cầu.");
    applyParts(parts);
    resetValidation(validationFromSuggest(res));
    setBuildId(res.buildId ?? null);
    setIsSaved(false);
    setAiResult(res);
    setProfile(res.profile ?? null);
    setProfileDraft(res.profile ?? null);
    setAiInsight({
      title: res.buildName || "Cấu hình AI tối ưu",
      reasoning:
        res.aiReasoning ||
        "Hệ thống đã phân bổ ngân sách tối ưu và bảo đảm tính tương thích 100%.",
      highlight:
        res.performanceHighlight ||
        "Vận hành mượt mà, tối ưu chi phí và hiệu năng.",
    });
    setApiError(null);
    setErrorMessage(null);
    setStatus("success");
    setIsBusy(false);
    notify("✨ AI đã phân tích kho hàng và đề xuất cấu hình tối ưu thành công!", "success");
  }

  function onSuggestError(err: unknown) {
    console.error("[PC Builder] Lỗi khi triệu gọi AI đề xuất:", err);
    const error = toApiError(err);
    const question = (error.data as { clarifyingQuestion?: string } | undefined)?.clarifyingQuestion;
    const message = error.code === "NEEDS_UNCLEAR" && question ? question : error.message;
    // Không giữ bộ máy cũ / nửa vời trên màn hình khi lỗi (DD 10.4, AC6)
    applyParts([]);
    resetValidation(null);
    setAiResult(null);
    setAiInsight(null);
    setApiError(error);
    setRetryLockedUntil(error.retryAfter ? Date.now() + error.retryAfter * 1000 : 0);
    setErrorMessage(message);
    setStatus("error");
    setIsBusy(false);
    notify(`❌ ${message}`, "danger");
  }

  async function sendSuggest(payload: AiBuildRequestPayload | null) {
    // Đang tải thì không làm gì: chống gửi trùng (DD 10.4, U16)
    if (requests.isSuggesting) return;
    if (!payload) return;
    setLastRequest(payload);
    if (demoMode) {
      // Demo mode không có backend: hiện bộ máy mẫu từ mockData
      applyParts(initialBuildParts);
      resetValidation(null);
      setAiResult(null);
      setAiInsight(initialAiInsight);
      setProfile(initialProfile);
      setProfileDraft(initialProfile);
      setApiError(null);
      setErrorMessage(null);
      setStatus("success");
      return;
    }
    setIsBusy(true);
    setStatus("loading");
    setErrorMessage(null);
    setApiError(null);
    await requests.suggest(payload, { onSuccess: onSuggestSuccess, onError: onSuggestError });
  }

  function suggestPayload(withProfile: RequirementProfile | null): AiBuildRequestPayload | null {
    const invalid = checkSuggestInput(numericBudget, purpose, options, Boolean(withProfile));
    if (invalid) {
      notify(invalid, "danger");
      return null;
    }
    return {
      budget: numericBudget,
      purpose: purpose.trim() || undefined,
      userPrompt: userPrompt.trim() || undefined,
      ...(withProfile ? { profile: withProfile } : {}),
    };
  }

  // Handlers
  async function handleAiSuggest() {
    if (requests.isSuggesting) return;
    await sendSuggest(suggestPayload(null));
  }

  /** "Đề xuất lại theo hồ sơ này": gửi kèm hồ sơ khách đã sửa. */
  async function handleResuggestWithProfile() {
    if (requests.isSuggesting) return;
    const edited = profileDraft ?? profile;
    if (!edited) return handleAiSuggest();
    await sendSuggest(suggestPayload(edited));
  }

  /** "Thử lại": gửi lại đúng request cũ, bị khóa trong retryAfter giây. */
  async function handleRetry() {
    if (requests.isSuggesting) return;
    if (Date.now() < retryLockedUntil) {
      const seconds = Math.ceil((retryLockedUntil - Date.now()) / 1000);
      notify(`Trợ lý AI đang bận, vui lòng thử lại sau ${seconds} giây.`, "warning");
      return;
    }
    if (!requests.lastRequest) return handleAiSuggest();
    await sendSuggest(requests.lastRequest);
  }

  async function openReplaceModal(role: ComponentRole) {
    setActiveReplaceRole(role);
    setIsModalOpen(true);
    setIsFetchingCandidates(true);
    setDynamicCandidates([]);

    const currentPart = buildParts.find((p) => p.role === role);

    if (demoMode) {
      setDynamicCandidates(mockCandidates(role, currentPart));
      setIsFetchingCandidates(false);
      return;
    }

    // Gửi toàn bộ build + hồ sơ; mở modal role khác thì request cũ bị hủy (DD 10.4)
    await requests.replacements(
      {
        role,
        budget: numericBudget || undefined,
        profile,
        items: toBuildItems(buildParts),
        lineIndex: Math.max(0, buildParts.findIndex((p) => p.role === role)),
      },
      {
        onSuccess: (list) => {
          setDynamicCandidates(
            list.map((c) => ({
              variantId: c.variantId,
              productName: c.productName,
              variantName: c.variantName,
              price: c.price,
              specs: c.specs || {},
              isCompatible: c.isCompatible,
              compatibilityNote: c.compatibilityNote,
              isCurrent: String(c.variantId) === String(currentPart?.variantId),
              status: c.status,
              warningChecks: c.warningChecks,
              priceDelta: c.priceDelta,
              newPercent: c.newPercent,
            })),
          );
          setIsFetchingCandidates(false);
        },
        onError: (err) => {
          // API mode: không hiện dữ liệu mock như thể là hàng trong kho (B26)
          console.warn("[PC Builder] Lỗi tải linh kiện thay thế từ Backend:", err);
          setDynamicCandidates([]);
          setIsFetchingCandidates(false);
          notify("❌ Không tải được danh sách linh kiện thay thế. Vui lòng thử lại.", "danger");
        },
      },
    );
  }

  function mockCandidates(role: ComponentRole, currentPart?: BuildPart) {
    return (replacementCandidatesByRole[role] || []).map((c) => ({
      ...c,
      isCurrent: String(c.variantId) === String(currentPart?.variantId),
    }));
  }

  function closeReplaceModal() {
    requests.cancel("replacements");
    setIsModalOpen(false);
    setActiveReplaceRole(null);
    setDynamicCandidates([]);
    setIsFetchingCandidates(false);
  }

  function selectReplacement(candidate: ReplacementCandidate) {
    if (!activeReplaceRole) return;

    const next = buildParts.map((p) =>
      p.role === activeReplaceRole
        ? {
            ...p,
            variantId: candidate.variantId,
            productName: candidate.productName,
            variantName: candidate.variantName,
            unitPrice: candidate.price,
            specs: { ...p.specs, ...candidate.specs },
          }
        : p,
    );
    applyParts(next);
    revalidate(next);

    const pool = replacementCandidatesByRole[activeReplaceRole];
    if (pool) {
      pool.forEach((c) => {
        c.isCurrent = String(c.variantId) === String(candidate.variantId);
      });
    }

    notify(`Đã thay đổi linh kiện thành "${candidate.productName}"`);
    closeReplaceModal();
  }

  function updateQuantity(role: ComponentRole, delta: number) {
    // Giới hạn theo capacity của backend khi có (thông tin dung lượng không ghi cứng nữa)
    const capacity = validation?.capacity;
    const max =
      (role === "ram" && capacity?.ramSlotsMax) ||
      (role === "gpu" && capacity?.gpuMax) ||
      (role === "cpu" && 2) ||
      8; // /validate nhận quantity 1–8 (DD 9.2)
    const next = buildParts.map((p) =>
      p.role === role
        ? { ...p, quantity: Math.max(1, Math.min(max, p.quantity + delta)) }
        : p,
    );
    applyParts(next);
    revalidate(next);
    notify(`Đã cập nhật số lượng ${role.toUpperCase()}`);
  }

  function handleAddToCart() {
    if (!canAddToCart) {
      notify(
        isRevalidating
          ? "Đang kiểm tra tương thích, vui lòng đợi trong giây lát."
          : "Cấu hình chưa tương thích hoặc vượt ngân sách, chưa thể thêm vào giỏ.",
        "warning",
      );
      return;
    }
    const buildName = userPrompt ? ("Dàn PC AI Build: " + userPrompt.slice(0, 30)) : "Dàn PC Gaming & Đồ Họa Pro";
    if (!demoMode) return addLiveParts(buildParts, buildName, buildId || undefined);
    try {
      const buildSet = {
        id: buildId || ("set_" + Date.now()),
        name: buildName,
        itemVariantIds: buildParts.map((p) => String(p.variantId)),
        parts: buildParts,
        createdAt: Date.now(),
      };
      const existingSets = JSON.parse(localStorage.getItem("techzone_pc_build_sets") || "[]");
      localStorage.setItem("techzone_pc_build_sets", JSON.stringify([...existingSets, buildSet]));
    } catch (e) {
      console.error(e);
    }
    // Thêm các linh kiện vào giỏ hàng, đồng thời liên kết buildId vào store
    commit((current: any) => {
      const existingProducts = Array.isArray(current.products)
        ? [...current.products]
        : [];
      const cart = Array.isArray(current.cart) ? [...current.cart] : [];

      buildParts.forEach((part) => {
        const partIdStr = String(part.variantId);
        const found = existingProducts.find((p) => String(p.id) === partIdStr);
        if (!found) {
          existingProducts.push({
            id: partIdStr,
            name: part.productName,
            price: part.unitPrice,
            stock: 99,
            status: "active",
            category: part.role,
            description: part.variantName || part.productName,
            image: part.imageUrl,
          });
        }

        const oldLine = cart.find((l) => String(l.id) === partIdStr);
        if (oldLine) {
          cart[cart.indexOf(oldLine)] = {
            ...oldLine,
            quantity: oldLine.quantity + part.quantity,
          };
        } else {
          cart.push({ id: partIdStr, quantity: part.quantity });
        }
      });

      return {
        ...current,
        products: existingProducts,
        cart,
        currentBuildId: buildId || Date.now(),
      };
    });

    notify("🛒 Đã thêm toàn bộ 8 linh kiện cấu hình vào giỏ hàng!");
    navigate("/gio-hang");
  }

  async function handleSaveBuild() {
    // 1. Kiểm tra trạng thái đăng nhập
    if (!user) {
      notify("Vui lòng đăng nhập để lưu cấu hình.", "warning");
      redirectGuestToLogin();
      return;
    }

    if (buildParts.length === 0) {
      notify("Chưa có linh kiện nào trong cấu hình để lưu.", "warning");
      return;
    }

    setIsBusy(true);

    try {
      // 2. Gọi backend API tạo mới và lưu cấu hình vào DB (giá do server tính lại)
      const result = await saveBuildOrNotify(
        () =>
          pcBuilderApi.saveCustomBuild({
            buildName: aiInsight?.title || "Cấu hình PC Custom",
            items: buildParts.map((p) => ({
              variantId: p.variantId,
              role: p.role,
              quantity: p.quantity,
            })),
          }),
        notify,
      );

      if (result.buildId) {
        setBuildId(result.buildId);
      }
      setIsSaved(result.saved);
    } finally {
      setIsBusy(false);
    }
  }

  function handleReset() {
    requests.cancelAll();
    applyParts([]);
    resetValidation(null);
    setIsBusy(false);
    setStatus("empty");
    setAiInsight(null);
    setAiResult(null);
    setErrorMessage(null);
    setApiError(null);
    setRetryLockedUntil(0);
    setProfile(null);
    setProfileDraft(null);
    setLastRequest(null);
    setBudget("");
    setPurpose("");
    setUserPrompt("");
  }

  function switchPreviewState(newState: BuilderStatus) {
    setStatus(newState);
    if (newState === "loading") {
      setIsBusy(true);
    } else {
      setIsBusy(false);
    }

    if (newState === "empty") {
      applyParts([]);
      setAiInsight(null);
      setErrorMessage(null);
    } else if (newState === "error") {
      applyParts([]);
      setAiInsight(null);
      setErrorMessage(
        "Dịch vụ AI (Google Gemini) hiện không khả dụng. Không thể đề xuất cấu hình lúc này. Vui lòng thử lại sau!",
      );
    } else if (newState === "success") {
      setErrorMessage(null);
      if (buildParts.length === 0) {
        applyParts(initialBuildParts);
        setAiInsight(initialAiInsight);
        setProfile(initialProfile);
        setProfileDraft(initialProfile);
      }
    }
  }

  function loadSavedBuildIntoBuilder(savedDetail: SavedPcBuildDetail) {
    if (
      !savedDetail ||
      !Array.isArray(savedDetail.items) ||
      savedDetail.items.length === 0
    ) {
      notify("Cấu hình này không có linh kiện nào.", "warning");
      return;
    }

    const mappedParts = toBuildParts(savedDetail.items, "Linh kiện từ cấu hình đã lưu.");

    setBuildId(savedDetail.buildId);
    applyParts(mappedParts);
    resetValidation(null);
    revalidate(mappedParts, savedDetail.totalPrice);
    setBudget(savedDetail.totalPrice);
    setIsSaved(true);
    setStatus("success");
    setErrorMessage(null);
    setApiError(null);
    setAiInsight({
      title: savedDetail.buildName || "Cấu hình đã lưu",
      reasoning: "Cấu hình đã được tải từ danh mục lưu trữ vào bộ lắp ráp.",
      highlight:
        "Bạn có thể kiểm tra tương thích, thay thế linh kiện hoặc thêm vào giỏ hàng ngay.",
    });

    notify(
      `✨ Đã nạp thành công "${savedDetail.buildName}" vào bộ lắp ráp!`,
      "success",
    );
  }

  function addSavedBuildToCart(savedDetail: SavedPcBuildDetail) {
    if (
      !savedDetail ||
      !Array.isArray(savedDetail.items) ||
      savedDetail.items.length === 0
    ) {
      notify("Cấu hình này không có linh kiện nào.", "warning");
      return;
    }

    if (!demoMode) return addLiveParts(savedDetail.items, savedDetail.buildName || ("Dàn PC #" + savedDetail.buildId), savedDetail.buildId);
    try {
      const buildSet = {
        id: savedDetail.buildId || Date.now(),
        name: savedDetail.buildName || ("Dàn PC #" + savedDetail.buildId),
        itemVariantIds: savedDetail.items.map((p) => String(p.variantId)),
        createdAt: Date.now(),
      };
      const existingSets = JSON.parse(localStorage.getItem("techzone_pc_build_sets") || "[]");
      localStorage.setItem("techzone_pc_build_sets", JSON.stringify([...existingSets, buildSet]));
    } catch (e) {
      console.error(e);
    }

    commit((current: any) => {
      const existingProducts = Array.isArray(current.products)
        ? [...current.products]
        : [];
      const cart = Array.isArray(current.cart) ? [...current.cart] : [];

      savedDetail.items.forEach((part) => {
        const partIdStr = String(part.variantId);
        const found = existingProducts.find((p) => String(p.id) === partIdStr);
        if (!found) {
          existingProducts.push({
            id: partIdStr,
            name: part.productName,
            price: part.unitPrice,
            stock: 99,
            status: "active",
            category: part.role,
            description: part.variantName || part.productName,
            image: part.imageUrl,
          });
        }

        const oldLine = cart.find((l) => String(l.id) === partIdStr);
        if (oldLine) {
          cart[cart.indexOf(oldLine)] = {
            ...oldLine,
            quantity: oldLine.quantity + part.quantity,
          };
        } else {
          cart.push({ id: partIdStr, quantity: part.quantity });
        }
      });

      return {
        ...current,
        products: existingProducts,
        cart,
        currentBuildId: savedDetail.buildId || Date.now(),
      };
    });

    notify("🛒 Đã thêm các linh kiện của bộ PC vào giỏ hàng!");
    navigate("/gio-hang");
  }

  return {
    budget,
    setBudget,
    purpose,
    setPurpose,
    userPrompt,
    setUserPrompt,
    buildId,
    status,
    setStatus,
    errorMessage,
    apiError,
    retryLockedUntil,
    isBusy,
    isSuggesting: status === "loading",
    isFetchingCandidates,
    buildParts,
    aiInsight,
    aiResult,
    activeReplaceRole,
    isModalOpen,
    isSaved,
    grandTotal,
    remainingBudget,
    rules,
    allRulesPassed,
    canAddToCart,
    options,
    profile,
    profileDraft,
    setProfileDraft,
    lastRequest,
    validation,
    isRevalidating,
    revalidate: () => revalidate(buildParts),
    modalCandidates,
    handleAiSuggest,
    handleResuggestWithProfile,
    handleRetry,
    handleReset,
    openReplaceModal,
    closeReplaceModal,
    selectReplacement,
    updateQuantity,
    handleAddToCart,
    handleSaveBuild,
    loadSavedBuildIntoBuilder,
    addSavedBuildToCart,
    switchPreviewState,
  };
}
