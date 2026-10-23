import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";
import { getCategoryMockImage } from "../constants/mockImages";

async function fetchManagementData(forceRefresh = false) {
  const [products, brands, categories] = await Promise.all([
    productApi.listAdminProducts(undefined, { forceRefresh }),
    productApi.getBrands({ forceRefresh }),
    productApi.getCategories({ forceRefresh }),
  ]);
  return {
    products: (products || [])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((product) => {
        const slug =
          categories?.find((category) => category.id === product.categoryId)
            ?.slug || (product.categoryName || "").toLowerCase();
        const fallback = getCategoryMockImage(slug);
        return {
          ...product,
          imageUrl: product.imageUrl || fallback,
          variants: (product.variants || []).map((variant) => ({
            ...variant,
            imageUrl: variant.imageUrl || fallback,
          })),
        };
      }),
    brands: brands || [],
    categories: categories || [],
  };
}

export function useProductManagement() {
  const { notify } = useStore();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state: 'list' (overview table) or 'editor' (form)
  const [viewMode, setViewMode] = useState("list");
  // selectedProductId: number (existing product) | "new" (creating) | null
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, DRAFT
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK, ALL_EMPTY
  const [priceRangeFilter, setPriceRangeFilter] = useState("ALL"); // ALL, UNDER_2M, 2M_5M, 5M_10M, OVER_10M
  const [variantCountFilter, setVariantCountFilter] = useState("ALL"); // ALL, MULTI, SINGLE, EMPTY
  const [sortBy, setSortBy] = useState("DEFAULT"); // DEFAULT, NAME_ASC, NAME_DESC, PRICE_ASC, PRICE_DESC, STOCK_DESC, STOCK_ASC, VARIANTS_DESC

  const applyData = useCallback((snapshot) => {
    setProducts(snapshot.products);
    setBrands(snapshot.brands);
    setCategories(snapshot.categories);
  }, []);

  const reportError = useCallback(
    (failure) => {
      setError(failure?.message || "Không thể kết nối đến máy chủ Backend.");
      notify("Không thể tải dữ liệu quản trị sản phẩm.", "danger");
    },
    [notify],
  );

  // Event-driven refresh keeps the editor open and preserves unsaved fields.
  const loadData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await fetchManagementData(forceRefresh);
        applyData(snapshot);
        return snapshot.products;
      } catch (err) {
        reportError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [applyData, reportError],
  );

  useEffect(() => {
    let active = true;
    fetchManagementData()
      .then((snapshot) => {
        if (active) applyData(snapshot);
      })
      .catch((failure) => {
        if (active) reportError(failure);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyData, reportError]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || selectedProductId === "new") return null;
    return products.find((p) => p.id === Number(selectedProductId)) || null;
  }, [products, selectedProductId]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeCount = products.filter(
      (p) => (p.status || "").toUpperCase() === "ACTIVE",
    ).length;
    const draftCount = products.filter(
      (p) => (p.status || "").toUpperCase() === "DRAFT",
    ).length;
    const totalVariants = products.reduce(
      (acc, p) => acc + (p.variants?.length || 0),
      0,
    );
    const outOfStockVariants = products.reduce((acc, p) => {
      return (
        acc +
        (p.variants?.filter((v) => Number(v.stockQuantity) <= 0).length || 0)
      );
    }, 0);

    return {
      totalProducts,
      activeCount,
      draftCount,
      totalVariants,
      outOfStockVariants,
    };
  }, [products]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts = { ALL: products.length };
    categories.forEach((c) => {
      counts[c.id] = products.filter(
        (p) => String(p.categoryId) === String(c.id),
      ).length;
    });
    return counts;
  }, [products, categories]);

  // Counts per brand
  const brandCounts = useMemo(() => {
    const counts = { ALL: products.length };
    brands.forEach((b) => {
      counts[b.id] = products.filter(
        (p) => String(p.brandId) === String(b.id),
      ).length;
    });
    return counts;
  }, [products, brands]);

  // Stock status counts
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      const vars = p.variants || [];
      const hasOutOfStock = vars.some((v) => Number(v.stockQuantity || 0) <= 0);
      const hasLowStock = vars.some((v) => {
        const sq = Number(v.stockQuantity || 0);
        return sq > 0 && sq <= 5;
      });
      const allInStock =
        vars.length > 0 &&
        vars.every((v) => Number(v.stockQuantity || 0) > 0);
      if (allInStock) inStock += 1;
      if (hasLowStock) lowStock += 1;
      if (hasOutOfStock) outOfStock += 1;
    });
    return {
      ALL: products.length,
      IN_STOCK: inStock,
      LOW_STOCK: lowStock,
      OUT_OF_STOCK: outOfStock,
    };
  }, [products]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setBrandFilter("ALL");
    setStockFilter("ALL");
    setPriceRangeFilter("ALL");
    setVariantCountFilter("ALL");
    setSortBy("DEFAULT");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
        statusFilter !== "ALL" ||
        categoryFilter !== "ALL" ||
        brandFilter !== "ALL" ||
        stockFilter !== "ALL" ||
        priceRangeFilter !== "ALL" ||
        variantCountFilter !== "ALL" ||
        sortBy !== "DEFAULT",
    );
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    brandFilter,
    stockFilter,
    priceRangeFilter,
    variantCountFilter,
    sortBy,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (statusFilter !== "ALL") count += 1;
    if (categoryFilter !== "ALL") count += 1;
    if (brandFilter !== "ALL") count += 1;
    if (stockFilter !== "ALL") count += 1;
    if (priceRangeFilter !== "ALL") count += 1;
    if (variantCountFilter !== "ALL") count += 1;
    if (sortBy !== "DEFAULT") count += 1;
    return count;
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    brandFilter,
    stockFilter,
    priceRangeFilter,
    variantCountFilter,
    sortBy,
  ]);

  // Filtered and sorted products list
  const filteredProducts = useMemo(() => {
    const result = products.filter((p) => {
      // Search query: match name, brand, category, SKU, variantName
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchBrand = (p.brandName || "").toLowerCase().includes(q);
        const matchCategory = (p.categoryName || "").toLowerCase().includes(q);
        const matchSku = p.variants?.some(
          (v) =>
            (v.serialCode || "").toLowerCase().includes(q) ||
            (v.sku || "").toLowerCase().includes(q) ||
            (v.variantName || "").toLowerCase().includes(q) ||
            (v.variant || "").toLowerCase().includes(q),
        );
        if (!matchName && !matchBrand && !matchCategory && !matchSku) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if ((p.status || "").toUpperCase() !== statusFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "ALL") {
        if (String(p.categoryId) !== String(categoryFilter)) {
          return false;
        }
      }

      // Brand filter
      if (brandFilter !== "ALL") {
        if (String(p.brandId) !== String(brandFilter)) {
          return false;
        }
      }

      const vars = p.variants || [];

      // Variant stock filter
      if (stockFilter === "IN_STOCK") {
        const allInStock =
          vars.length > 0 &&
          vars.every((v) => Number(v.stockQuantity ?? v.stock ?? 0) > 0);
        if (!allInStock) return false;
      } else if (stockFilter === "LOW_STOCK") {
        const hasLowStock = vars.some((v) => {
          const sq = Number(v.stockQuantity ?? v.stock ?? 0);
          return sq > 0 && sq <= 5;
        });
        if (!hasLowStock) return false;
      } else if (stockFilter === "OUT_OF_STOCK") {
        const hasOut = vars.some(
          (v) => Number(v.stockQuantity ?? v.stock ?? 0) <= 0,
        );
        if (!hasOut) return false;
      } else if (stockFilter === "ALL_EMPTY") {
        const total = vars.reduce(
          (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
          0,
        );
        if (total > 0 || vars.length === 0) return false;
      }

      // Price range filter (based on variant prices)
      if (priceRangeFilter !== "ALL") {
        const prices = vars
          .map((v) => Number(v.price || 0))
          .filter((pr) => pr > 0);
        if (prices.length === 0) return false;
        if (priceRangeFilter === "UNDER_2M") {
          if (!prices.some((pr) => pr < 2000000)) return false;
        } else if (priceRangeFilter === "2M_5M") {
          if (!prices.some((pr) => pr >= 2000000 && pr <= 5000000)) return false;
        } else if (priceRangeFilter === "5M_10M") {
          if (!prices.some((pr) => pr >= 5000000 && pr <= 10000000)) return false;
        } else if (priceRangeFilter === "OVER_10M") {
          if (!prices.some((pr) => pr > 10000000)) return false;
        }
      }

      // Variant count filter
      if (variantCountFilter !== "ALL") {
        const count = vars.length;
        if (variantCountFilter === "MULTI" && count < 2) return false;
        if (variantCountFilter === "SINGLE" && count !== 1) return false;
        if (variantCountFilter === "EMPTY" && count !== 0) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "NAME_ASC") {
        return (a.name || "").localeCompare(b.name || "", "vi");
      }
      if (sortBy === "NAME_DESC") {
        return (b.name || "").localeCompare(a.name || "", "vi");
      }
      if (sortBy === "PRICE_ASC") {
        const minA = Math.min(
          ...(a.variants || [])
            .map((v) => Number(v.price || 0))
            .filter((p) => p > 0),
          Infinity,
        );
        const minB = Math.min(
          ...(b.variants || [])
            .map((v) => Number(v.price || 0))
            .filter((p) => p > 0),
          Infinity,
        );
        return (minA === Infinity ? 0 : minA) - (minB === Infinity ? 0 : minB);
      }
      if (sortBy === "PRICE_DESC") {
        const maxA = Math.max(
          0,
          ...(a.variants || []).map((v) => Number(v.price || 0)),
        );
        const maxB = Math.max(
          0,
          ...(b.variants || []).map((v) => Number(v.price || 0)),
        );
        return maxB - maxA;
      }
      if (sortBy === "STOCK_DESC") {
        const stockA = (a.variants || []).reduce(
          (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
          0,
        );
        const stockB = (b.variants || []).reduce(
          (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
          0,
        );
        return stockB - stockA;
      }
      if (sortBy === "STOCK_ASC") {
        const stockA = (a.variants || []).reduce(
          (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
          0,
        );
        const stockB = (b.variants || []).reduce(
          (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
          0,
        );
        return stockA - stockB;
      }
      if (sortBy === "VARIANTS_DESC") {
        return (b.variants?.length || 0) - (a.variants?.length || 0);
      }
      return 0; // DEFAULT preserve original
    });
  }, [
    products,
    searchQuery,
    statusFilter,
    categoryFilter,
    brandFilter,
    stockFilter,
    priceRangeFilter,
    variantCountFilter,
    sortBy,
  ]);

  // Actions
  const handleOpenCreate = () => {
    setSelectedProductId("new");
    setViewMode("editor");
  };

  const handleOpenEdit = (productOrId) => {
    const id = typeof productOrId === "object" ? productOrId.id : productOrId;
    setSelectedProductId(id);
    setViewMode("editor");
  };

  const handleBackToList = () => {
    setSelectedProductId(null);
    setViewMode("list");
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productApi.deleteProduct(productId);
      notify("Đã xóa sản phẩm thành công khỏi cơ sở dữ liệu.");
      if (selectedProductId === productId) {
        handleBackToList();
      }
      await loadData();
    } catch (err) {
      notify(err.message || "Không thể xóa sản phẩm.", "danger");
      throw err;
    }
  };

  return {
    products,
    brands,
    categories,
    loading,
    error,
    viewMode,
    setViewMode,
    selectedProductId,
    setSelectedProductId,
    selectedProduct,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    stockFilter,
    setStockFilter,
    priceRangeFilter,
    setPriceRangeFilter,
    variantCountFilter,
    setVariantCountFilter,
    sortBy,
    setSortBy,
    categoryCounts,
    brandCounts,
    stockCounts,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    filteredProducts,
    metrics,
    loadData,
    handleOpenCreate,
    handleOpenEdit,
    handleBackToList,
    handleDeleteProduct,
  };
}
