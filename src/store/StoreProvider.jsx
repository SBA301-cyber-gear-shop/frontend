import { useEffect, useRef, useState, useCallback } from "react";
import { readState, writeState } from "./demo/persistence";
import { createSeed } from "./demo/seed";
import { StoreContext } from "./context";
import { demoMode } from "@/utils";

function liveState() {
  return {
    ...createSeed(),
    products: [],
    cart: [],
    build: [],
    orders: [],
    promotions: [],
    usages: [],
    warranties: [],
    tickets: [],
    reviews: [],
    users: [],
    specSettings: {},
  };
}

function safeProfile(profile) {
  if (!profile) return null;
  const { password, demoPasswordHash, ...safe } = profile;
  void password;
  void demoPasswordHash;
  const role = String(safe.role || "").toLowerCase();
  safe.role = role.charAt(0).toUpperCase() + role.slice(1);
  return safe;
}

export default function StoreProvider({ children, catalogApi, cartApi }) {
  const { pathname } = useLocation();
  const [data, setData] = useState(demoMode ? readState : liveState),
    [user, setUser] = useState(() => {
      try {
        if (!demoMode && !sessionStorage.getItem("techzone-token")) return null;
        return safeProfile(
          JSON.parse(sessionStorage.getItem("techzone-session")),
        );
      } catch {
        return null;
      }
    }),
    [toast, setToast] = useState(null),
    [catalogLoading, setCatalogLoading] = useState(!demoMode),
    [catalogError, setCatalogError] = useState(""),
    [cartLoading, setCartLoading] = useState(!demoMode && Boolean(user)),
    [cartError, setCartError] = useState(""),
    [cartBusy, setCartBusy] = useState(false);
  const current = useRef(data),
    timer = useRef(null),
    activeUser = useRef(user),
    cartRequest = useRef(0),
    catalogRequest = useRef(0),
    mutationBusy = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  const notify = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const commit = useCallback((update) => {
    const next =
      typeof update === "function" ? update(current.current) : update;
    try {
      if (demoMode) writeState(next);
    } catch {
      throw new Error(
        "Không thể lưu dữ liệu trên trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ.",
      );
    }
    current.current = next;
    setData(next);
    return next;
  }, []);
  function signIn(profile) {
    const safe = safeProfile(profile);
    if (!demoMode || activeUser.current?.id !== safe.id) {
      clearLiveCart();
      if (!demoMode) setCartLoading(true);
    }
    activeUser.current = safe;
    sessionStorage.setItem("techzone-session", JSON.stringify(safe));
    setUser(safe);
  }
  function signOut() {
    activeUser.current = null;
    clearLiveCart();
    sessionStorage.removeItem("techzone-session");
    sessionStorage.removeItem("techzone-token");
    setUser(null);
  }
  return (
    <StoreContext.Provider
      value={{
        data,
        user,
        commit,
        notify,
        signIn,
        signOut,
        demoMode,
        catalogLoading,
        catalogError,
        reloadCatalog,
        cartLoading,
        cartError,
        cartBusy,
        reloadCart,
        mutateCart,
      }}
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
