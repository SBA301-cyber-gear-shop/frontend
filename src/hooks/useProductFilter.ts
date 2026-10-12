import { useState, useMemo } from "react";
import type { ProductDisplay } from "../types";
import { useDebounce } from "./useDebounce";

export type ProductSortOption = "featured" | "price_asc" | "price_desc" | "name";

export interface FilterOptions {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: ProductSortOption;
}

/**
 * Hook lọc, tìm kiếm và sắp xếp danh sách sản phẩm.
 * Phục vụ cho trang Cửa hàng (StorePages).
 */
export function useProductFilter(products: ProductDisplay[]) {
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<ProductSortOption>("featured");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);

  // Debounce từ khóa tìm kiếm 300ms
  const debouncedSearch = useDebounce(search, 300);

  // Danh sách các danh mục duy nhất có trong sản phẩm
  const availableCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  // Danh sách các thương hiệu duy nhất có trong sản phẩm
  const availableBrands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [products]);

  // Danh sách sản phẩm sau khi lọc và sắp xếp
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Lọc theo Category
        if (category !== "all" && p.category !== category) return false;

        // Lọc theo Brand
        if (brand !== "all" && p.brand !== brand) return false;

        // Lọc theo Khoảng giá
        if (p.price < priceRange[0] || p.price > priceRange[1]) return false;

        // Lọc theo Từ khóa tìm kiếm
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.trim().toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          const matchVariant = p.variant?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchVariant) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // featured: giữ nguyên thứ tự
      });
  }, [products, category, brand, priceRange, debouncedSearch, sortBy]);

  const resetFilters = () => {
    setCategory("all");
    setBrand("all");
    setSearch("");
    setSortBy("featured");
    setPriceRange([0, 100000000]);
  };

  return {
    category,
    brand,
    search,
    sortBy,
    priceRange,
    availableCategories,
    availableBrands,
    filteredProducts,
    totalResults: filteredProducts.length,
    setCategory,
    setBrand,
    setSearch,
    setSortBy,
    setPriceRange,
    resetFilters,
  };
}
