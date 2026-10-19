import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store";
import { promotionsApi } from "../api/promotionsApi";

function blank() {
  const date = (offset) =>
    new Date(Date.now() + offset)
      .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
      .replace(" ", "T")
      .slice(0, 16);
  return {
    code: "",
    name: "",
    type: "fixed_amount",
    value: 100000,
    limit: 100,
    start: date(0),
    end: date(7 * 86400000),
    active: true,
    used: 0,
    reserved: 0,
    bannerTitle: "",
    bannerImage: "",
    bannerLink: "/san-pham",
    bannerOrder: 0,
    bannerActive: false,
  };
}

export function useLivePromotionManagement() {
  const { notify } = useStore();
  const [p, setP] = useState(blank),
    [resource, setResource] = useState(null);
  const [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    promotionsApi
      .list(abort.signal)
      .then((items) => {
        if (!abort.signal.aborted) {
          setResource({ items, error: "" });
          setP(
            (current) =>
              items.find((item) => item.id === current.id) ||
              items[0] ||
              blank(),
          );
        }
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResource({ items: [], error: error.message });
      });
    return () => abort.abort();
  }, [version]);

  async function save(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const saved = await promotionsApi.save(p);
      setP(saved);
      setResource((previous) => ({
        error: "",
        items: [
          saved,
          ...previous.items.filter((item) => item.id !== saved.id),
        ],
      }));
      notify("Đã lưu chương trình khuyến mãi.");
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return {
    p,
    set: (key, value) => setP((current) => ({ ...current, [key]: value })),
    used: p.used || 0,
    reserved: p.reserved || 0,
    save,
    busy,
    demoMode: false,
    loading: resource === null,
    error: resource?.error || "",
    promotions: resource?.items || [],
    select: (id) => setP(resource.items.find((item) => item.id === id)),
    create: () => setP(blank()),
    refresh: () => {
      setResource(null);
      setVersion((value) => value + 1);
    },
  };
}
