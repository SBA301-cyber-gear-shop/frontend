import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { cartApi } from "@/features/cart";
import { pcBuilderApi } from "../api/pcBuilderApi";
import {
  MAX_BUDGET,
  buildKey,
  lineTotal,
  replaceLine,
  saveErrorText,
  setLineQty,
  toItemRequests,
} from "../domain/buildLines";
import { createBuildRequests } from "./buildRequests";
import { rememberCartSet, toApiError, type ReplaceState } from "./usePcBuilder";
import type { BuildItem, BuildItemRequest, BuildResult, ReplacementOption, SavedBuild } from "../types/pcBuilder.types";

/** Bộ đã lưu không có ngân sách: kiểm với trần ngân sách để /validate chỉ báo xung đột phần cứng, không báo vượt tiền. */
const NO_BUDGET = MAX_BUDGET;

/**
 * Đổi linh kiện của một bộ đã lưu ngay trong popup: /validate lấy giá, tồn kho và maxQty hiện tại,
 * đổi món qua /replacements như bộ lắp ráp, "Lưu thay đổi" ghi đè bằng PUT /builds/saved/{id}.
 */
export function useSavedBuildEditor(saved: SavedBuild, onSaved: () => void) {
  const { notify, data, mutateCart, reloadCart } = useStore();
  const navigate = useNavigate();
  const [requests] = useState(() => createBuildRequests());
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [replace, setReplace] = useState<ReplaceState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => () => requests.cancelAll(), [requests]);

  useEffect(() => {
    const items = toItemRequests(saved.items);
    requests.track(items);
    void requests.suggest((signal) => pcBuilderApi.validate({ budget: NO_BUDGET, items }, { signal }), {
      onSuccess: (result: BuildResult) => {
        setBuild(result);
        setLoadError(null);
      },
      onError: (err) => setLoadError(toApiError(err).message),
    });
  }, [requests, saved, attempt]);

  function revalidate(items: BuildItemRequest[]) {
    setIsChecking(true);
    setCheckError(null);
    void requests.revalidate((signal) => pcBuilderApi.validate({ budget: NO_BUDGET, items }, { signal }), items, {
      onSuccess: (result: BuildResult) => {
        setBuild(result);
        setIsChecking(false);
      },
      onError: (err) => {
        setIsChecking(false);
        setCheckError(toApiError(err).message);
      },
    });
  }

  /** Hiện ngay theo giá đang có, rồi /validate (debounce) trả trạng thái và maxQty thật. */
  function updateItems(items: BuildItem[]) {
    if (!build) return;
    const requestItems = toItemRequests(items);
    requests.track(requestItems);
    setBuild({ ...build, items, total: lineTotal(items) });
    revalidate(requestItems);
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
    void requests.replacements((signal) => pcBuilderApi.replacements({ category, items }, { signal }), items, {
      onSuccess: (options: ReplacementOption[]) =>
        setReplace((prev) => (prev && isSame(prev) ? { ...prev, options, loading: false } : prev)),
      onError: (err) =>
        setReplace((prev) => (prev && isSame(prev) ? { ...prev, loading: false, error: toApiError(err).message } : prev)),
    });
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
  }

  const isDirty = build ? buildKey(toItemRequests(build.items)) !== buildKey(toItemRequests(saved.items)) : false;
  /** Lý do chưa thêm giỏ được: chưa có kết quả /validate mới nhất hoặc đang xung đột. */
  const cartBlockedReason = !build
    ? "Đang tải cấu hình"
    : isChecking
      ? "Đang kiểm tra lại cấu hình"
      : checkError
        ? "Chưa kiểm tra được cấu hình mới nhất"
        : build.status === "INCOMPATIBLE"
          ? "Cấu hình có linh kiện không tương thích"
          : null;
  const blockedReason = cartBlockedReason ?? (!isDirty ? "Chưa có thay đổi nào" : null);

  /**
   * Thêm bộ vào giỏ dưới pc_custom của bộ đã lưu. Đang sửa dở thì lưu trước để giỏ và bộ đã lưu khớp nhau;
   * bộ đã có trong giỏ thì thay hẳn vì backend cộng dồn số lượng khi thêm trùng.
   */
  async function addToCart() {
    if (!build || cartBlockedReason || isSaving || isAdding) return;
    const buildId = saved.buildId;
    const items = toItemRequests(build.items);
    setIsAdding(true);
    let savedNow = false;
    let cartTouched = false;
    try {
      if (isDirty) {
        await pcBuilderApi.updateSaved(buildId, { items });
        savedNow = true;
      }
      const inCart = (data.cart as { pcCustomId?: number | null }[]).some((line) => line.pcCustomId === buildId);
      const updated = await mutateCart(async () => {
        cartTouched = true;
        if (inCart) await cartApi.removePcSet(buildId);
        await cartApi.addBatch(
          items.map((item) => ({ productVariantId: item.variantId, quantity: item.qty })),
          buildId,
        );
      });
      if (!updated) return;
      rememberCartSet({
        id: buildId,
        name: `Cấu hình #${buildId}`,
        itemVariantIds: build.items.map((item) => String(item.id)),
        parts: build.items.map((item) => ({ ...item })),
        createdAt: Date.now(),
      });
      notify(inCart ? `Đã cập nhật cấu hình #${buildId} trong giỏ hàng.` : "Đã thêm cấu hình vào giỏ hàng.", "success");
      navigate("/gio-hang");
    } catch (err) {
      const apiError = toApiError(err);
      console.warn("[PC Builder] Lỗi thêm cấu hình đã lưu vào giỏ:", err);
      if (cartTouched) await reloadCart();
      if (!savedNow) {
        notify(`❌ Không thêm được vào giỏ hàng: ${saveErrorText(apiError.message, apiError.data)}`, "danger");
        return;
      }
      notify(`Đã lưu thay đổi nhưng chưa thêm được vào giỏ hàng: ${apiError.message}`, "warning");
      onSaved();
    } finally {
      setIsAdding(false);
    }
  }

  async function save() {
    if (!build || blockedReason || isSaving || isAdding) return;
    setIsSaving(true);
    try {
      await pcBuilderApi.updateSaved(saved.buildId, { items: toItemRequests(build.items) });
      notify(`💾 Đã cập nhật cấu hình #${saved.buildId}.`, "success");
      onSaved();
    } catch (err) {
      const apiError = toApiError(err);
      console.warn("[PC Builder] Lỗi cập nhật cấu hình đã lưu:", err);
      notify(`❌ Lưu thay đổi thất bại: ${saveErrorText(apiError.message, apiError.data)}`, "danger");
      setIsSaving(false);
    }
  }

  return {
    build,
    loadError,
    reload: () => {
      setLoadError(null);
      setAttempt((count) => count + 1);
    },
    isChecking,
    checkError,
    recheck: () => build && revalidate(toItemRequests(build.items)),
    replace,
    isDirty,
    blockedReason,
    cartBlockedReason,
    isSaving,
    isAdding,
    addToCart,
    changeQty,
    openReplace,
    closeReplace,
    chooseReplacement,
    save,
  };
}
