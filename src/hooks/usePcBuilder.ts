import { useState, useMemo, useCallback } from "react";
import { useStore } from "../state/context";
import { defaultBuild } from "../data/seed";
import { validateBuild, totalOf } from "../domain/commerce";
import { request } from "../services/demoStore";
import type {
  BuildLine,
  ValidationReport,
  ProductDisplay,
  AiBuildRequestPayload,
  AiBuildSuggestionResponse,
} from "../types";

/**
 * Hook quản lý toàn bộ luồng lắp ráp PC (PC Builder) & tư vấn cấu hình bằng AI.
 */
export function usePcBuilder(initialBudget = 25000000) {
  const { data, commit, notify } = useStore();
  const products: ProductDisplay[] = data.products || [];

  const [lines, setLines] = useState<BuildLine[]>(() =>
    structuredClone(defaultBuild),
  );
  const [budget, setBudget] = useState<number>(initialBudget);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] =
    useState<AiBuildSuggestionResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  /**
   * Danh sách linh kiện đã chọn kèm thông tin chi tiết từ ProductDisplay
   */
  const selectedParts = useMemo(() => {
    return lines.map((line) => {
      const product = products.find((p) => String(p.id) === String(line.id));
      return {
        ...line,
        product,
        unitPrice: product?.price || 0,
        subtotal: (product?.price || 0) * line.quantity,
      };
    });
  }, [lines, products]);

  /** Tổng giá tiền của toàn bộ cấu hình máy hiện tại */
  const totalPrice = useMemo(() => {
    return totalOf(lines, products);
  }, [lines, products]);

  /** Báo cáo kiểm định tương thích phần cứng từ Rule Engine */
  const validation: ValidationReport = useMemo(() => {
    return validateBuild(lines, products, budget);
  }, [lines, products, budget]);

  /**
   * Thay đổi hoặc thêm một linh kiện vào cấu hình
   */
  const setPart = useCallback(
    (targetCategory: string, newProductId: string, quantity = 1) => {
      setLines((prev) => {
        // Tìm sản phẩm mới được chọn để xác định category
        const newProduct = products.find(
          (p) => String(p.id) === String(newProductId),
        );
        if (!newProduct) return prev;

        // Nếu là RAM hoặc SSD thì có thể giữ nhiều mục, các loại khác thay thế món cũ cùng category
        const isMulti =
          targetCategory === "ram" ||
          targetCategory === "ssd" ||
          newProduct.category === "ram" ||
          newProduct.category === "ssd";

        if (isMulti) {
          const exists = prev.find((l) => String(l.id) === String(newProductId));
          if (exists) {
            return prev.map((l) =>
              String(l.id) === String(newProductId) ? { ...l, quantity } : l,
            );
          }
          return [...prev, { id: newProductId, quantity }];
        }

        // Thay thế linh kiện cùng category
        const filtered = prev.filter((l) => {
          const itemProd = products.find((p) => String(p.id) === String(l.id));
          return itemProd?.category !== targetCategory;
        });

        return [...filtered, { id: newProductId, quantity }];
      });
    },
    [products],
  );

  /**
   * Gỡ bỏ một linh kiện khỏi cấu hình
   */
  const removePart = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => String(l.id) !== String(productId)));
  }, []);

  /**
   * Khôi phục về cấu hình mặc định ban đầu
   */
  const resetToDefault = useCallback(() => {
    setLines(structuredClone(defaultBuild));
    setAiSuggestion(null);
    setAiError(null);
  }, []);

  /**
   * Gọi AI PC Builder tư vấn cấu hình theo ngân sách & nhu cầu
   */
  const requestAiSuggestion = async (payload: AiBuildRequestPayload) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await request("/api/v1/pc-build/ai-suggest", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result: AiBuildSuggestionResponse = res?.data || res;
      setAiSuggestion(result);

      // Nếu AI trả về danh sách parts, cập nhật vào lines
      if (result.parts) {
        const newLines: BuildLine[] = Object.values(result.parts)
          .filter(Boolean)
          .map((part: any) => ({
            id: String(part.variantId || part.productId || part.id),
            quantity: part.quantity || 1,
          }));

        if (newLines.length > 0) {
          setLines(newLines);
        }
      }

      notify("AI đã hoàn thành phân tích và đề xuất cấu hình tối ưu!");
      return result;
    } catch (err: any) {
      const msg =
        err.message || "Không thể kết nối dịch vụ AI. Đang kích hoạt chế độ mẫu.";
      setAiError(msg);
      notify(msg, "warning");
      throw new Error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Thêm toàn bộ các linh kiện trong dàn máy vào giỏ hàng
   */
  const addAllToCart = () => {
    if (!validation.valid) {
      notify("Cấu hình chưa hoàn tất hoặc còn lỗi tương thích.", "danger");
      return false;
    }

    commit((prev: any) => {
      const cart = [...(prev.cart || [])];
      for (const line of lines) {
        const oldIndex = cart.findIndex(
          (c) => String(c.id) === String(line.id),
        );
        if (oldIndex >= 0) {
          cart[oldIndex] = {
            ...cart[oldIndex],
            quantity: cart[oldIndex].quantity + line.quantity,
          };
        } else {
          cart.push({ id: line.id, quantity: line.quantity });
        }
      }
      return { ...prev, cart };
    });

    notify("Đã thêm toàn bộ dàn PC vào giỏ hàng!");
    return true;
  };

  return {
    lines,
    budget,
    selectedParts,
    totalPrice,
    validation,
    aiLoading,
    aiSuggestion,
    aiError,
    setBudget,
    setLines,
    setPart,
    removePart,
    resetToDefault,
    requestAiSuggestion,
    addAllToCart,
  };
}
