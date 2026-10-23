import { useEffect, useState } from "react";
import { demoMode } from "@/utils";
import { promotionsApi } from "../api/promotionsApi";

export function useVisiblePromotions() {
  const [resource, setResource] = useState({ promotions: [], error: "" });
  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    promotionsApi
      .visible(abort.signal)
      .then((promotions) => {
        if (!abort.signal.aborted) setResource({ promotions, error: "" });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResource({ promotions: [], error: error.message });
      });
    return () => abort.abort();
  }, []);
  return resource;
}
