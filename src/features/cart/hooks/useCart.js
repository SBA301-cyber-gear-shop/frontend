import { useStore } from "@/store";
import { totalOf } from "@/features/products";
export function useCart() {
  const { data, commit, notify } = useStore();
  const totalCount = data.cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalAmount = totalOf(data.cart, data.products);
  const hasRam = data.cart.some(
    (line) =>
      data.products.find((product) => product.id === line.id)?.category ===
      "ram",
  );
  function addToCart(id, quantity = 1) {
    try {
      commit((current) => {
        const p = current.products.find((p) => p.id === id);
        if (!p || p.status !== "active")
          throw new Error("Sản phẩm không còn bán.");
        const cart = [...current.cart],
          old = cart.find((l) => l.id === id);
        if ((old?.quantity || 0) + quantity > p.stock)
          throw new Error("Không đủ tồn kho.");
        if (old)
          cart[cart.indexOf(old)] = {
            ...old,
            quantity: old.quantity + quantity,
          };
        else cart.push({ id, quantity });
        return { ...current, cart };
      });
      notify("Đã thêm vào giỏ hàng.");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function updateQuantity(id, quantity) {
    commit((current) => ({
      ...current,
      cart: current.cart.map((line) =>
        line.id === id ? { ...line, quantity } : line,
      ),
    }));
  }
  function removeFromCart(id) {
    commit((current) => ({
      ...current,
      cart: current.cart.filter((line) => line.id !== id),
    }));
  }
  return {
    data,
    totalCount,
    totalAmount,
    hasRam,
    addToCart,
    updateQuantity,
    removeFromCart,
  };
}
