import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";
import { getCategoryMockImage } from "../constants/mockImages";

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

  // Fetch real data from Backend with caching
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, brandsData, catsData] = await Promise.all([
        productApi.listAdminProducts(undefined, { forceRefresh }),
        productApi.getBrands({ forceRefresh }).catch(() => []),
        productApi.getCategories({ forceRefresh }).catch(() => []),
      ]);

      const enhancedProducts = (prodsData || []).map((p) => {
        const catSlug = catsData?.find((c) => c.id === p.categoryId)?.slug || (p.categoryName || "").toLowerCase();
        const fallbackImg = getCategoryMockImage(catSlug);
        return {
          ...p,
          imageUrl: p.imageUrl || fallbackImg,
          variants: (p.variants || []).map((v) => ({
            ...v,
            imageUrl: v.imageUrl || fallbackImg,
          })),
        };
      });

      setProducts(enhancedProducts);
      setBrands(brandsData || []);
      setCategories(catsData || []);
      return enhancedProducts;
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sản phẩm từ Backend:", err);
      setError(err?.message || "Không thể kết nối đến máy chủ Backend.");
      notify("Không thể kết nối máy chủ backend.", "danger");
      return [];
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || selectedProductId === "new") return null;
    return products.find((p) => p.id === Number(selectedProductId)) || null;
  }, [products, selectedProductId]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeCount = products.filter((p) => (p.status || "").toUpperCase() === "ACTIVE").length;
    const draftCount = products.filter((p) => (p.status || "").toUpperCase() === "DRAFT").length;
    const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
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

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchBrand = (p.brandName || "").toLowerCase().includes(q);
        const matchCategory = (p.categoryName || "").toLowerCase().includes(q);
        const matchSku = p.variants?.some((v) =>
          (v.serialCode || "").toLowerCase().includes(q) ||
          (v.variantName || "").toLowerCase().includes(q)
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

      return true;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

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
    filteredProducts,
    metrics,
    loadData,
    handleOpenCreate,
    handleOpenEdit,
    handleBackToList,
    handleDeleteProduct,
  };
}
