import { useState, useMemo } from "react";
import { useStore } from "@/store";

export function useProductManagement() {
  const { data } = useStore();
  const [selected, setSelected] = useState("ram16");

  // Group variants by productId to list distinct products in admin dropdown
  const distinctProducts = useMemo(() => {
    const map = new Map();
    for (const p of data.products) {
      const pid = p.productId || p.id;
      if (!map.has(pid)) {
        map.set(pid, {
          id: p.id,
          productId: pid,
          name: p.name,
          brand: p.brand,
          category: p.category,
          status: p.status,
          variantCount: 1,
        });
      } else {
        map.get(pid).variantCount += 1;
      }
    }
    return Array.from(map.values());
  }, [data.products]);

  const selectedProduct = useMemo(() => {
    if (selected === "new") return null;
    return (
      data.products.find((p) => p.id === selected || p.productId === selected) ||
      null
    );
  }, [data.products, selected]);

  return { data, distinctProducts, selected, setSelected, selectedProduct };
}
