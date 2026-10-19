import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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

  const fetchCatalog = useCallback(
    (signal) => {
      if (demoMode) return;
      const request = ++catalogRequest.current;
      return catalogApi
        .list(signal)
        .then((products) => {
          if (request === catalogRequest.current && !signal?.aborted) {
            commit((state) => ({ ...state, products }));
            setCatalogError("");
          }
        })
        .catch((error) => {
          if (request === catalogRequest.current && !signal?.aborted)
            setCatalogError(error.message);
        })
        .finally(() => {
          if (request === catalogRequest.current && !signal?.aborted)
            setCatalogLoading(false);
        });
    },
    [catalogApi, commit],
  );

  const fetchCart = useCallback(
    (signal) => {
      if (demoMode || !activeUser.current) return;
      const owner = activeUser.current.id;
      const request = ++cartRequest.current;
      return cartApi
        .get(signal)
        .then((cart) => {
          if (
            request !== cartRequest.current ||
            owner !== activeUser.current?.id ||
            signal?.aborted
          )
            return false;
          commit((state) => ({ ...state, cart }));
          setCartError("");
          return true;
        })
        .catch((error) => {
          if (
            request === cartRequest.current &&
            owner === activeUser.current?.id &&
            !signal?.aborted
          )
            setCartError(error.message);
          return false;
        })
        .finally(() => {
          if (
            request === cartRequest.current &&
            owner === activeUser.current?.id &&
            !signal?.aborted
          )
            setCartLoading(false);
        });
    },
    [cartApi, commit],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchCatalog(controller.signal);
    return () => controller.abort();
  }, [fetchCatalog, pathname]);

  useEffect(() => {
    if (demoMode) return;
    let controller;
    const refreshVisibleCatalog = () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      void fetchCatalog(controller.signal);
    };
    window.addEventListener("focus", refreshVisibleCatalog);
    document.addEventListener("visibilitychange", refreshVisibleCatalog);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refreshVisibleCatalog);
      document.removeEventListener("visibilitychange", refreshVisibleCatalog);
    };
  }, [fetchCatalog]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchCart(controller.signal);
    return () => controller.abort();
  }, [user, fetchCart]);

  function reloadCatalog() {
    setCatalogLoading(true);
    setCatalogError("");
    return fetchCatalog();
  }

  function reloadCart() {
    setCartLoading(true);
    setCartError("");
    return fetchCart();
  }

  async function mutateCart(operation) {
    if (mutationBusy.current)
      throw new Error("Giỏ hàng đang cập nhật, vui lòng chờ.");
    const owner = activeUser.current?.id;
    if (!owner) throw new Error("Vui lòng đăng nhập để sử dụng giỏ hàng.");
    mutationBusy.current = true;
    setCartBusy(true);
    try {
      await operation();
      if (owner !== activeUser.current?.id) return false;
      if (!(await reloadCart()))
        throw new Error(
          "Đã gửi thay đổi nhưng chưa tải lại được giỏ hàng. Vui lòng tải lại giỏ để kiểm tra.",
        );
      return true;
    } finally {
      mutationBusy.current = false;
      setCartBusy(false);
    }
  }

  function clearLiveCart() {
    if (demoMode) return;
    ++cartRequest.current;
    setCartLoading(false);
    setCartError("");
    commit((state) => ({
      ...state,
      cart: [],
      orders: [],
      warranties: [],
      reviews: [],
    }));
  }
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
