import { useEffect, useRef, useState } from "react";
import { readState, writeState } from "../services/demoStore";
import { StoreContext } from "./context";
export default function StoreProvider({ children }) {
  const [data, setData] = useState(readState),
    [user, setUser] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("techzone-session"));
      } catch {
        return null;
      }
    }),
    [toast, setToast] = useState(null);
  const current = useRef(data),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function notify(message, tone = "success") {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  }
  function commit(update) {
    const next =
      typeof update === "function" ? update(current.current) : update;
    try {
      writeState(next);
    } catch {
      throw new Error(
        "Không thể lưu dữ liệu trên trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ.",
      );
    }
    current.current = next;
    setData(next);
    return next;
  }
  function signIn(profile) {
    const { password, demoPasswordHash, ...safe } = profile;
    void password;
    void demoPasswordHash;
    sessionStorage.setItem("techzone-session", JSON.stringify(safe));
    setUser(safe);
  }
  function signOut() {
    sessionStorage.removeItem("techzone-session");
    setUser(null);
  }
  function addCart(id, quantity = 1) {
    const p = current.current.products.find((p) => p.id === id);
    if (!p || p.status !== "active")
      return notify("Sản phẩm không còn bán.", "danger");
    const cart = [...current.current.cart],
      old = cart.find((l) => l.id === id);
    if ((old?.quantity || 0) + quantity > p.stock)
      return notify("Không đủ tồn kho.", "danger");
    if (old)
      cart[cart.indexOf(old)] = { ...old, quantity: old.quantity + quantity };
    else cart.push({ id, quantity });
    commit({ ...current.current, cart });
    notify("Đã thêm vào giỏ hàng.");
  }
  return (
    <StoreContext.Provider
      value={{ data, user, commit, notify, signIn, signOut, addCart }}
    >
      {children}
      {toast && (
        <div
          className={"toast " + toast.tone}
          role={toast.tone === "danger" ? "alert" : "status"}
        >
          <span>{toast.tone === "danger" ? "!" : "✓"}</span>
          {toast.message}
          <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}
