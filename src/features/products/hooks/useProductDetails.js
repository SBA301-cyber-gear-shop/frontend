import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { useProductReviews } from "@/features/reviews";

export function useProductDetails() {
  const { id } = useParams(),
    { data, catalogLoading, catalogError, demoMode } = useStore(),
    navigate = useNavigate(),
    [quantity, setQuantity] = useState(1),
    [tab, setTab] = useState("description");
  const p = data.products.find((p) => p.id === id);
  const variants = data.products.filter(
    (v) => v.productId === p?.productId && v.status === "active",
  );
  const remoteReviews = useProductReviews(p?.id);
  const reviews = demoMode
    ? data.reviews.filter((r) => r.productId === p?.id)
    : remoteReviews.reviews;
  const primary =
    p?.primarySpecs ??
    data.specSettings[p?.category]?.filter((s) => s.primary).map((s) => s.name);
  return {
    id,
    navigate,
    quantity,
    setQuantity,
    tab,
    setTab,
    p,
    variants,
    reviews,
    primary,
    catalogLoading,
    catalogError,
    reviewError: remoteReviews.error,
  };
}
