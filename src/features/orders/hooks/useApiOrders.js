import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { ordersApi } from "../api/ordersApi";

export function useApiOrders({
  code,
  operations = false,
  search = "",
  status = "all",
} = {}) {
  const { user, demoMode } = useStore();
  const [resource, setResource] = useState(null),
    [version, setVersion] = useState(0);
  const key = JSON.stringify([user?.id, operations, code, search, status]);
  useEffect(() => {
    if (demoMode || !user) return;
    const abort = new AbortController();
    const request = operations
      ? ordersApi.operations(search, status, abort.signal)
      : code
        ? ordersApi.one(code, abort.signal).then((order) => [order])
        : ordersApi.mine(abort.signal);
    request
      .then((orders) => {
        if (!abort.signal.aborted) setResource({ key, orders, error: "" });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResource({ key, orders: [], error: error.message });
      });
    return () => abort.abort();
  }, [key, version, demoMode, user, code, operations, search, status]);

  useEffect(() => {
    if (demoMode) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible")
        setVersion((value) => value + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [demoMode]);

  function replaceOrder(order) {
    setVersion((value) => value + 1);
    setResource((previous) => ({
      key,
      error: "",
      orders:
        previous?.key === key
          ? previous.orders.some((item) => item.id === order.id)
            ? previous.orders.map((item) =>
                item.id === order.id ? order : item,
              )
            : [order, ...previous.orders]
          : [order],
    }));
  }
  return {
    orders: resource?.key === key ? resource.orders : [],
    loading: !demoMode && resource?.key !== key,
    error: resource?.key === key ? resource.error : "",
    refresh: () => setVersion((value) => value + 1),
    replaceOrder,
  };
}
