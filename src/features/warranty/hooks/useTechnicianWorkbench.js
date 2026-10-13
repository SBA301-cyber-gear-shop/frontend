import { useState } from "react";
import { useStore } from "@/store";

export function useTechnicianWorkbench() {
  const { data, commit, notify } = useStore(),
    [selectedId, setSelectedId] = useState(data.tickets[0]?.id || ""),
    [filter, setFilter] = useState("all");
  const ticket = data.tickets.find((t) => t.id === selectedId);
  return {
    data,
    commit,
    notify,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    ticket,
  };
}
