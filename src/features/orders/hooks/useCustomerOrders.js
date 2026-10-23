import { useState } from "react";
import { useStore } from "@/store";
import { useApiOrders } from "./useApiOrders";

export function useCustomerOrders() {
  const { data, user, demoMode } = useStore(),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const remote = useApiOrders();
  const orders = (demoMode ? data.orders : remote.orders).filter(
    (o) =>
      o.userId === user.id &&
      (filter === "all" || o.status === filter) &&
      o.id.toLowerCase().includes(search.toLowerCase()),
  );
  return {
    data,
    filter,
    setFilter,
    search,
    setSearch,
    orders,
    loading: remote.loading,
    error: remote.error,
    refresh: remote.refresh,
  };
}
