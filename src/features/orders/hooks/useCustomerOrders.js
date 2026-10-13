import { useState } from "react";
import { useStore } from "@/store";

export function useCustomerOrders() {
  const { data, user } = useStore(),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const orders = data.orders.filter(
    (o) =>
      o.userId === user.id &&
      (filter === "all" || o.status === filter) &&
      o.id.toLowerCase().includes(search.toLowerCase()),
  );
  return { data, filter, setFilter, search, setSearch, orders };
}
