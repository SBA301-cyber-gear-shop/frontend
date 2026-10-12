import { useMemo } from "react";
import { useStore } from "../state/context";
import type { CartLine, ProductDisplay } from "../types";

export interface CartDetailedItem {
  id: string;
  quantity: number;
  product?: ProductDisplay;
  unitPrice: number;
  subtotal: number;
}

/**
 * Hook quản lý giỏ hàng.
 * Tự động đồng bộ hóa với state toàn cục và tính toán thành tiền chi tiết.
 */
export function useCart() {
  const { data, commit, notify, addCart } = useStore();
  const rawCart: CartLine[] = data.cart || [];
  const products: ProductDisplay[] = data.products || [];

  /**
   * Danh sách sản phẩm trong giỏ hàng kèm theo thông tin chi tiết và thành tiền
   */
  const items: CartDetailedItem[] = useMemo(() => {
    return rawCart.map((line) => {
      const product = products.find((p) => String(p.id) === String(line.id));
      const unitPrice = product?.price || 0;
      return {
        id: line.id,
        quantity: line.quantity,
        product,
        unitPrice,
        subtotal: unitPrice * line.quantity,
      };
    });
  }, [rawCart, products]);

  /** Tổng số lượng sản phẩm trong giỏ */
  const totalCount = useMemo(() => {
    return rawCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [rawCart]);

  /** Tổng tiền tạm tính trước khi áp voucher */
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  /** Cập nhật số lượng của 1 món hàng */
  const updateQuantity = (id: string, nextQty: number) => {
    if (nextQty <= 0) {
      removeFromCart(id);
      return;
    }
    const product = products.find((p) => String(p.id) === String(id));
    if (product && nextQty > product.stock) {
      notify(`Kho chỉ còn ${product.stock} sản phẩm.`, "danger");
      return;
    }
    commit((prev: any) => ({
      ...prev,
      cart: prev.cart.map((line: CartLine) =>
        String(line.id) === String(id) ? { ...line, quantity: nextQty } : line,
      ),
    }));
  };

  /** Xóa 1 món khỏi giỏ hàng */
  const removeFromCart = (id: string) => {
    commit((prev: any) => ({
      ...prev,
      cart: prev.cart.filter((line: CartLine) => String(line.id) !== String(id)),
    }));
    notify("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  /** Xóa sạch giỏ hàng */
  const clearCart = () => {
    commit((prev: any) => ({
      ...prev,
      cart: [],
    }));
  };

  return {
    rawCart,
    items,
    totalCount,
    totalAmount,
    addToCart: addCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
