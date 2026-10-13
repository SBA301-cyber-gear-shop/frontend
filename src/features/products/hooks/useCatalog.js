import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { categories } from "../constants";

export function useCatalog() {
  const { data } = useStore(),
    { category } = useParams(),
    [params, setParams] = useSearchParams();
  const selectedCategory = category || params.get("category") || "",
    term = params.get("q") || "",
    brands = params.getAll("brand"),
    sort = params.get("sort") || "name",
    max = Number(params.get("max") || 0),
    spec = params.get("spec") || "";
  const base = data.products.filter(
    (p) =>
      p.status === "active" &&
      (!selectedCategory ||
        (selectedCategory === "parts"
          ? !["monitor", "laptop"].includes(p.category)
          : p.category === selectedCategory)) &&
      (!term ||
        (p.name + " " + p.brand + " " + p.sku + " " + p.variant)
          .toLowerCase()
          .includes(term.toLowerCase())),
  );
  const found = base
    .filter(
      (p) =>
        (!brands.length || brands.includes(p.brand)) &&
        (!max || p.price <= max) &&
        (!spec || Object.values(p.specs).includes(spec)),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
          : a.name.localeCompare(b.name, "vi"),
    );
  const page = Math.max(
    1,
    Math.min(Number(params.get("page")) || 1, Math.ceil(found.length / 9) || 1),
  );
  function update(key, value) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  function toggleBrand(brand) {
    const next = new URLSearchParams(params);
    next.delete("brand");
    (brands.includes(brand)
      ? brands.filter((b) => b !== brand)
      : [...brands, brand]
    ).forEach((b) => next.append("brand", b));
    next.delete("page");
    setParams(next);
  }
  const title =
    categories.find((c) => c.id === selectedCategory)?.name ||
    "Linh kiện & thiết bị";
  const configured = data.specSettings[selectedCategory]
    ?.filter((s) => s.filter)
    .map((s) => s.name);
  const specOptions = [
    ...new Set(
      base.flatMap((p) =>
        Object.entries(p.specs)
          .filter(([k]) => !configured || configured.includes(k))
          .map(([, v]) => v),
      ),
    ),
  ].slice(0, 14);
  return {
    category,
    params,
    setParams,
    selectedCategory,
    term,
    brands,
    sort,
    max,
    spec,
    base,
    found,
    page,
    update,
    toggleBrand,
    title,
    specOptions,
  };
}
