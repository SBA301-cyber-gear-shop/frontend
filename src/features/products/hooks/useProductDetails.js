import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";

export function useProductDetails() {
  const { id } = useParams(),
    { data } = useStore(),
    navigate = useNavigate(),
    [quantity, setQuantity] = useState(1),
    [tab, setTab] = useState("description");
  const p = data.products.find((p) => p.id === id);
  const variants = data.products.filter(
    (v) => v.productId === p?.productId && v.status === "active",
  );
  const reviews = data.reviews.filter((r) => r.productId === p?.id);
  const primary = data.specSettings[p?.category]
    ?.filter((s) => s.primary)
    .map((s) => s.name);
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
  };
}
