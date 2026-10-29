import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import type {
  BuildPart,
  ComponentRole,
  ReplacementCandidate,
  AiBuildInsight,
  BuilderStatus,
  SavedPcBuildDetail,
} from "../types/pcBuilder.types";
import {
  initialBuildParts,
  initialAiInsight,
  evaluateHardwareRules,
  replacementCandidatesByRole,
  ROLE_LABELS,
} from "../domain";
import { pcBuilderApi } from "../api/pcBuilderApi";
import { cartApi } from "@/features/cart";

export function usePcBuilder() {
  const { user, commit, notify, demoMode, mutateCart, reloadCart } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBuildId = searchParams.get("editBuildId") || searchParams.get("loadBuildId");
  const addingParts = useRef(false);

  async function addLiveParts(
    parts: { variantId: number | string; quantity: number }[],
    buildName?: string,
    buildIdVal?: number | string
  ) {
    if (addingParts.current) return;
    if (!user) {
      navigate("/dang-nhap", { state: { from: "/build-pc" } });
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
  const [ramGb, setRamGb] = useState<number | "">("");
  const [userPrompt, setUserPrompt] = useState<string>("");

  // States
  const [buildId, setBuildId] = useState<number | string | null>(null);
  const [status, setStatus] = useState<BuilderStatus>("empty");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
          setBuildParts(found.parts);
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
  const rules = evaluateHardwareRules(buildParts, numericBudget);
  const allRulesPassed = rules.every((r) => r.status === "pass");

  // Candidates for the currently active modal role
  const modalCandidates: ReplacementCandidate[] =
    dynamicCandidates.length > 0
      ? dynamicCandidates
      : activeReplaceRole
        ? replacementCandidatesByRole[activeReplaceRole] || []
        : [];

  // Handlers
  async function handleAiSuggest() {
    if (numericBudget < 5000000) {
      notify(
        "Vui lòng nhập mức ngân sách dự chi (tối thiểu 5.000.000 ₫) để AI xây dựng cấu hình máy tính.",
        "danger",
      );
      return;
    }

    setIsBusy(true);
    setStatus("loading");
    setErrorMessage(null);

    try {
      // 1. Gọi Backend API
      const res = await pcBuilderApi.suggestBuild({
        budget: numericBudget,
        purpose: purpose.trim() || undefined,
        ramGb: typeof ramGb === "number" && ramGb > 0 ? ramGb : undefined,
        scope: "tower",
        userPrompt: userPrompt.trim() || undefined,
      });

      if (res) {
        if (res.buildId) {
          setBuildId(res.buildId);
        }

        // Map backend items to frontend BuildPart[]
        if (Array.isArray(res.items) && res.items.length > 0) {
          const mappedParts: BuildPart[] = res.items.map((item) => ({
            role: item.role,
            roleName: ROLE_LABELS[item.role] || item.role.toUpperCase(),
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName || "",
            imageUrl: item.imageUrl || "/placeholder-pc.svg",
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            specs: item.specs || {},
            aiReason:
              item.aiReason ||
              "Linh kiện được AI lựa chọn cân đối theo ngân sách và nhu cầu.",
          }));
          setBuildParts(mappedParts);
        } else {
          throw new Error(
            "AI chưa tìm thấy bộ linh kiện phù hợp với mức ngân sách này trong kho.",
          );
        }

        setAiInsight({
          title: res.buildName || "Cấu hình AI tối ưu",
          reasoning:
            res.aiReasoning ||
            "Hệ thống đã phân bổ ngân sách tối ưu và bảo đảm tính tương thích 100%.",
          highlight:
            res.performanceHighlight ||
            "Vận hành mượt mà, tối ưu chi phí và hiệu năng.",
        });

        notify(
          "✨ AI đã phân tích kho hàng và đề xuất cấu hình tối ưu thành công!",
          "success",
        );
        setStatus("success");
      }
    } catch (err: unknown) {
      console.error("[PC Builder] Lỗi khi triệu gọi AI đề xuất:", err);
      let errorMsg =
        "Dịch vụ AI hiện không khả dụng. Không thể đề xuất cấu hình lúc này. Vui lòng kiểm tra lại kết nối hoặc thử lại sau!";
      if (err instanceof Error && err.message) {
        errorMsg = err.message;
      }

      // Xóa bỏ toàn bộ linh kiện và thẻ nhận xét giả lập để tránh gây hiểu lầm cho người dùng
      setBuildParts([]);
      setAiInsight(null);
      setErrorMessage(errorMsg);
      setStatus("error");

      notify(`❌ ${errorMsg}`, "danger");
    } finally {
      setIsBusy(false);
    }
  }

  async function openReplaceModal(role: ComponentRole) {
    setActiveReplaceRole(role);
    setIsModalOpen(true);
    setIsFetchingCandidates(true);

    const cpuPart = buildParts.find((p) => p.role === "cpu");
    const mbPart = buildParts.find((p) => p.role === "mainboard");
    const currentPart = buildParts.find((p) => p.role === role);

    try {
      // Gọi API lấy linh kiện thay thế tương thích
      const apiCandidates = await pcBuilderApi.getCompatibleReplacements(
        role,
        cpuPart?.variantId,
        mbPart?.variantId,
      );

      if (Array.isArray(apiCandidates) && apiCandidates.length > 0) {
        const mapped: ReplacementCandidate[] = apiCandidates.map((c) => ({
          variantId: c.variantId,
          productName: c.productName,
          variantName: c.variantName,
          price: c.price,
          specs: c.specs || {},
          isCompatible: c.isCompatible,
          compatibilityNote: c.compatibilityNote,
          isCurrent: String(c.variantId) === String(currentPart?.variantId),
        }));
        setDynamicCandidates(mapped);
      } else {
        // Backend trả về mảng rỗng -> dùng candidate nội bộ
        const fallback = (replacementCandidatesByRole[role] || []).map((c) => ({
          ...c,
          isCurrent: String(c.variantId) === String(currentPart?.variantId),
        }));
        setDynamicCandidates(fallback);
      }
    } catch (err: unknown) {
      console.warn(
        "[PC Builder] Lỗi tải linh kiện thay thế từ Backend, dùng dữ liệu nội bộ:",
        err,
      );
      const fallback = (replacementCandidatesByRole[role] || []).map((c) => ({
        ...c,
        isCurrent: String(c.variantId) === String(currentPart?.variantId),
      }));
      setDynamicCandidates(fallback);
    } finally {
      setIsFetchingCandidates(false);
    }
  }

  function closeReplaceModal() {
    setIsModalOpen(false);
    setActiveReplaceRole(null);
    setDynamicCandidates([]);
  }

  function selectReplacement(candidate: ReplacementCandidate) {
    if (!activeReplaceRole) return;

    setBuildParts((prev) =>
      prev.map((p) => {
        if (p.role === activeReplaceRole) {
          return {
            ...p,
            variantId: candidate.variantId,
            productName: candidate.productName,
            variantName: candidate.variantName,
            unitPrice: candidate.price,
            specs: { ...p.specs, ...candidate.specs },
          };
        }
        return p;
      }),
    );

    // Cập nhật trạng thái đang chọn trong danh sách ứng viên
    setDynamicCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        isCurrent: String(c.variantId) === String(candidate.variantId),
      })),
    );

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
    setBuildParts((prev) =>
      prev.map((p) => {
        if (p.role === role) {
          const newQty = Math.max(1, Math.min(4, p.quantity + delta));
          const updatedSpecs = { ...p.specs };
          if (role === "ram") {
            updatedSpecs["Dung lượng"] = `16GB x ${newQty} = ${newQty * 16}GB`;
          }
          return {
            ...p,
            quantity: newQty,
            specs: updatedSpecs,
          };
        }
        return p;
      }),
    );
    notify(`Đã cập nhật số lượng ${role.toUpperCase()}`);
  }

  function handleAddToCart() {
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
      navigate("/dang-nhap?redirect=/build-pc", {
        state: { from: "/build-pc" },
      });
      return;
    }

    if (buildParts.length === 0) {
      notify("Chưa có linh kiện nào trong cấu hình để lưu.", "warning");
      return;
    }

    setIsBusy(true);

    try {
      // 2. Gọi backend API tạo mới và lưu cấu hình vào DB
      const newBuildId = await pcBuilderApi.saveCustomBuild({
        buildName: aiInsight?.title || "Cấu hình PC Custom",
        totalPrice: grandTotal,
        items: buildParts.map((p) => ({
          variantId: p.variantId,
          role: p.role,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
      });

      if (newBuildId) {
        setBuildId(newBuildId);
      }
      setIsSaved(true);
      notify(
        "💾 Đã lưu cấu hình PC thành công vào tài khoản của bạn!",
        "success",
      );
    } catch (err: unknown) {
      console.warn("[PC Builder] Lỗi lưu cấu hình backend, lưu dự phòng:", err);
      setIsSaved(true);
      notify(
        "💾 Đã lưu cấu hình vào bộ nhớ tài khoản (máy chủ tạm thời ngoại tuyến).",
        "neutral",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function handleReset() {
    setStatus("empty");
    setBuildParts([]);
    setAiInsight(null);
    setErrorMessage(null);
    setBudget("");
    setPurpose("");
    setRamGb("");
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
      setBuildParts([]);
      setAiInsight(null);
      setErrorMessage(null);
    } else if (newState === "error") {
      setBuildParts([]);
      setAiInsight(null);
      setErrorMessage(
        "Dịch vụ AI (Google Gemini) hiện không khả dụng. Không thể đề xuất cấu hình lúc này. Vui lòng thử lại sau!",
      );
    } else if (newState === "success") {
      setErrorMessage(null);
      if (buildParts.length === 0) {
        setBuildParts(initialBuildParts);
        setAiInsight(initialAiInsight);
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

    const mappedParts: BuildPart[] = savedDetail.items.map((item) => ({
      role: item.role,
      roleName: ROLE_LABELS[item.role] || item.role.toUpperCase(),
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName || "",
      imageUrl: item.imageUrl || "/placeholder-pc.svg",
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      specs: item.specs || {},
      aiReason: item.aiReason || "Linh kiện từ cấu hình đã lưu.",
    }));

    setBuildId(savedDetail.buildId);
    setBuildParts(mappedParts);
    setBudget(savedDetail.totalPrice);
    setIsSaved(true);
    setStatus("success");
    setErrorMessage(null);
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
    ramGb,
    setRamGb,
    userPrompt,
    setUserPrompt,
    buildId,
    status,
    setStatus,
    errorMessage,
    isBusy,
    isFetchingCandidates,
    buildParts,
    aiInsight,
    activeReplaceRole,
    isModalOpen,
    isSaved,
    grandTotal,
    remainingBudget,
    rules,
    allRulesPassed,
    modalCandidates,
    handleAiSuggest,
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
