import { useStore } from "@/store";
import { totalOf } from "@/features/products";
import { useLocation, useNavigate } from "react-router-dom";
import { cartApi } from "../api/cartApi";

export function useCart() {
  const {
    data,
    user,
    commit,
    notify,
    demoMode,
    cartLoading,
    cartError,
    cartBusy,
    reloadCart,
    mutateCart,
  } = useStore();
  const navigate = useNavigate(),
    location = useLocation();

  const totalCount = data.cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalAmount = demoMode
    ? totalOf(data.cart, data.products)
    : data.cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const hasRam = data.cart.some(
    (line) =>
      data.products.find((product) => product.id === line.id)?.category ===
      "ram",
  );

  async function remoteChange(operation) {
    try {
      return await mutateCart(operation);
    } catch (error) {
      notify(error.message, "danger");
      return false;
    }
  }

  async function addToCart(id, quantity = 1) {
    if (!demoMode) {
      if (!user) {
        navigate("/dang-nhap", {
          state: { from: location.pathname + location.search },
        });
        return false;
      }
      const success = await remoteChange(() => cartApi.add(id, quantity));
      if (success) notify("Đã thêm vào giỏ hàng.");
      return success;
    }
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
      return true;
    } catch (error) {
      notify(error.message, "danger");
      return false;
    }
  }

  function updateQuantity(id, quantity) {
    if (!demoMode) {
      const line = data.cart.find((item) => String(item.id) === String(id));
      if (!line) return;
      return remoteChange(() => cartApi.update(line.cartItemId, quantity));
    }
    commit((current) => ({
      ...current,
      cart: current.cart.map((line) =>
        String(line.id) === String(id) ? { ...line, quantity } : line,
      ),
    }));
  }

  function removeFromCart(id) {
    if (!demoMode) {
      const line = data.cart.find((item) => String(item.id) === String(id));
      if (!line) return;
      return remoteChange(() => cartApi.remove(line.cartItemId));
    }
    commit((current) => ({
      ...current,
      cart: current.cart.filter((line) => String(line.id) !== String(id)),
    }));
  }

  async function removeMultiple(ids) {
    if (!ids || !ids.length) return;
    const idStrings = ids.map(String);
    if (!demoMode) {
      const targetItems = idStrings
        .map((id) => data.cart.find((item) => String(item.id) === id))
        .filter(Boolean);
      if (!targetItems.length) return;
      return remoteChange(async () => {
        for (const item of targetItems) {
          if (item.cartItemId) {
            await cartApi.remove(item.cartItemId);
          }
        }
      });
    }
    const idSet = new Set(idStrings);
    commit((current) => ({
      ...current,
      cart: current.cart.filter((line) => !idSet.has(String(line.id))),
    }));
  }

  return {
    data,
    user,
    demoMode,
    cartLoading,
    cartError,
    cartBusy,
    reloadCart,
    totalCount,
    totalAmount,
    hasRam,
    addToCart,
    updateQuantity,
    removeFromCart,
    removeMultiple,
  };
}
