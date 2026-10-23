import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { warrantyApi } from "../api/warrantyApi";

export function useCustomerWarranty() {
  const { data, user, demoMode } = useStore(),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const [resource, setResource] = useState(null),
    [version, setVersion] = useState(0);
  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    warrantyApi
      .mine(abort.signal)
      .then((cards) => {
        if (!abort.signal.aborted)
          setResource({ userId: user.id, cards, error: "" });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResource({ userId: user.id, cards: [], error: error.message });
      });
    return () => abort.abort();
  }, [demoMode, user.id, version]);
  const cards = (
    demoMode
      ? data.warranties
      : resource?.userId === user.id
        ? resource.cards
        : []
  ).filter(
    (w) =>
      w.userId === user.id &&
      w.serial.toLowerCase().includes(search.toLowerCase()),
  );
  return {
    data,
    user,
    search,
    setSearch,
    selected,
    setSelected,
    cards,
    loading: !demoMode && resource?.userId !== user.id,
    error: resource?.userId === user.id ? resource.error : "",
    refresh: () => setVersion((value) => value + 1),
  };
}
