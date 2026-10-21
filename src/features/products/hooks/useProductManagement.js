import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";

export function useProductManagement() {
  const { data, commit, notify } = useStore();

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

  // Fetch real data from Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, brandsData, catsData] = await Promise.all([
        productApi.listAdminProducts(),
        productApi.getBrands().catch(() => []),
        productApi.getCategories().catch(() => []),
      ]);

      setProducts(prodsData || []);
      setBrands(brandsData || []);
      setCategories(catsData || []);

      // Dual-sync to store so legacy demo features (orders, cart, pc-builder) stay updated
      if (Array.isArray(prodsData) && prodsData.length > 0) {
        commit((d) => {
          const syncedItems = [];
          for (const p of prodsData) {
            if (p.variants && p.variants.length > 0) {
              for (const v of p.variants) {
                syncedItems.push({
                  id: v.id,
                  productId: p.id,
                  name: p.name,
                  brand: p.brandName || "TechZone",
                  category: (p.categoryName || "ram").toLowerCase(),
                  price: Number(v.price),
                  originalPrice: Number(v.originalPrice || v.price),
                  variant: v.variantName || v.serialCode,
                  sku: v.serialCode,
                  stock: v.stockQuantity,
                  warranty: p.warrantyPeriodMonths || 12,
                  status: (p.status || "ACTIVE").toLowerCase(),
                  image: v.imageUrl || "",
                  specs: (v.attributes || []).reduce((acc, a) => {
                    acc[a.specificationName] = a.value;
                    return acc;
                  }, {}),
                });
              }
            } else {
              syncedItems.push({
                id: p.id,
                productId: p.id,
                name: p.name,
                brand: p.brandName || "TechZone",
                category: (p.categoryName || "ram").toLowerCase(),
                price: 0,
                originalPrice: 0,
                variant: "Mặc định",
                sku: `SKU-${p.id}`,
                stock: 0,
                warranty: p.warrantyPeriodMonths || 12,
                status: (p.status || "DRAFT").toLowerCase(),
                image: "",
                specs: {},
              });
            }
          }

          // Merge with any demo products that aren't numeric DB IDs
          const nonDbProducts = d.products.filter((p) => typeof p.id === "string");
          return {
            ...d,
            products: [...syncedItems, ...nonDbProducts],
          };
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sản phẩm từ Backend:", err);
      setError(err?.message || "Không thể kết nối đến máy chủ Backend.");
      notify("Không thể kết nối máy chủ backend, đang hiển thị dữ liệu bộ nhớ.", "danger");
    } finally {
      setLoading(false);
    }
  }, [commit, notify]);

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
