import { useEffect, useState } from "react";
import { demoMode } from "@/utils";
import { reviewsApi } from "../api/reviewsApi";

export function useProductReviews(variantId) {
  const [resource, setResource] = useState(null);
  useEffect(() => {
    if (demoMode || !variantId) return;
    const abort = new AbortController();
    reviewsApi
      .list(variantId, abort.signal)
      .then((reviews) => {
        if (!abort.signal.aborted)
          setResource({ id: variantId, reviews, error: "" });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResource({ id: variantId, reviews: [], error: error.message });
      });
    return () => abort.abort();
  }, [variantId]);
  return resource && resource.id === variantId
    ? resource
    : { reviews: [], error: "" };
}
