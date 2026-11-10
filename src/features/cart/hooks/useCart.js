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

  async function addMultipleToCart(items) {
    if (!items || !items.length) return false;
    if (!demoMode) {
      if (!user) {
        notify("Vui lòng đăng nhập để thêm linh kiện vào giỏ hàng.", "warning");
        navigate("/dang-nhap", {
          state: { from: location.pathname + location.search },
        });
        return false;
      }
      const success = await remoteChange(async () => {
        const batchPayload = items
          .map((item) => {
            const vid = item.variantId || item.id;
            return vid ? { productVariantId: Number(vid), quantity: item.quantity || 1 } : null;
          })
          .filter(Boolean);

        if (batchPayload.length === 0) return;

        try {
          await cartApi.addBatch(batchPayload);
        } catch (e) {
          for (const item of batchPayload) {
            await cartApi.add(item.productVariantId, item.quantity);
          }
        }
      });
      if (success) notify(`Đã thêm ${items.length} linh kiện vào giỏ hàng thành công.`);
      return success;
    }
    try {
      commit((current) => {
        const cart = [...current.cart];
        for (const item of items) {
          const id = String(item.variantId || item.id);
          const quantity = item.quantity || 1;
          const old = cart.find((l) => String(l.id) === id);
          if (old) {
            cart[cart.indexOf(old)] = {
              ...old,
              quantity: old.quantity + quantity,
            };
          } else {
            cart.push({ id, quantity });
          }
        }
        return { ...current, cart };
      });
      notify(`Đã thêm ${items.length} linh kiện vào giỏ hàng thành công.`);
      return true;
    } catch (error) {
      notify(error.message, "danger");
      return false;
    }
  }

  function updateQuantity(id, quantity) {
    if (!demoMode) {
      const line = data.cart.find((item) => String(item.cartItemId) === String(id) || String(item.id) === String(id));
      if (!line) return;
      return remoteChange(() => cartApi.update(line.cartItemId, quantity));
    }
    commit((current) => ({
      ...current,
      cart: current.cart.map((line) =>
        String(line.cartItemId ?? line.id) === String(id) || String(line.id) === String(id) ? { ...line, quantity } : line,
      ),
    }));
  }

  function removeFromCart(id) {
    if (!demoMode) {
      const line = data.cart.find((item) => String(item.cartItemId) === String(id) || String(item.id) === String(id));
      if (!line) return;
      return remoteChange(() => cartApi.remove(line.cartItemId));
    }
    commit((current) => ({
      ...current,
      cart: current.cart.filter((line) => String(line.cartItemId ?? line.id) !== String(id) && String(line.id) !== String(id)),
    }));
  }

  async function removeMultiple(ids) {
    if (!ids || !ids.length) return;
    const idStrings = ids.map(String);
    if (!demoMode) {
      const targetItems = idStrings
        .map((id) => data.cart.find((item) => String(item.cartItemId) === id || String(item.id) === id))
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
    addMultipleToCart,
    updateQuantity,
    removeFromCart,
    removeMultiple,
  };
}
