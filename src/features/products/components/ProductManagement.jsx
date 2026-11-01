import { useState, useMemo, Fragment } from "react";
import { money } from "@/utils";
import {
  Badge,
  Button,
  Heading,
  Notice,
  Panel,
  Empty,
  Modal,
} from "@/components/ui";
import { ProductEditor } from "./ProductEditor";
import { useProductManagement } from "../hooks/useProductManagement";
import { getCategoryMockImage } from "../constants/mockImages";

// Crisp SVG Icons for each computer hardware category
function CategoryIcon({ slug, size = 16, style = {} }) {
  const s = String(slug || "").toLowerCase();
  if (s.includes("cpu") || s.includes("vi xử lý") || s.includes("vi-xu-ly")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3M19 9h3m-3 6h3" />
      </svg>
    );
  }
  if (
    s.includes("mainboard") ||
    s.includes("bo mạch") ||
    s.includes("bo-mach")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="5" height="5" rx="1" />
        <path d="M7 16h3m4-9h3m-3 4h3m-7 5v2m4-2v2m-8-7h1" />
      </svg>
    );
  }
  if (s.includes("ram") || s.includes("bộ nhớ")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="2" y="8" width="20" height="9" rx="1.5" />
        <path d="M6 17v2m4-2v2m4-2v2m4-2v2M6 8V6m4 2V6m4 2V6m4 2V6M6 11h2m4 0h2m4 0h2" />
      </svg>
    );
  }
  if (
    s.includes("gpu") ||
    s.includes("đồ họa") ||
    s.includes("do-hoa") ||
    s.includes("card")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="2" y="5" width="20" height="13" rx="2" />
        <circle cx="8" cy="11.5" r="3" />
        <circle cx="16" cy="11.5" r="3" />
        <path d="M6 18v2m12-2v2M2 9h2m-2 5h2" />
      </svg>
    );
  }
  if (s.includes("ssd") || s.includes("ổ cứng") || s.includes("o-cung")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="7" cy="8" r="1.5" />
        <circle cx="17" cy="8" r="1.5" />
        <path d="M7 16h10m-10-3h6" />
      </svg>
    );
  }
  if (s.includes("psu") || s.includes("nguồn") || s.includes("nguon")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="12" r="4" />
        <path d="m11 9 3 3-2 1 2 2M3 8h1m16 0h1m-1 8h1" />
      </svg>
    );
  }
  if (s.includes("case") || s.includes("vỏ") || s.includes("vo")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="6.5" r="1" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <rect x="8" y="13" width="8" height="5" rx="1" />
      </svg>
    );
  }
  if (
    s.includes("cooler") ||
    s.includes("tản nhiệt") ||
    s.includes("tan-nhiet")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 3a9 9 0 0 1 3 6l-3 3m-9 0a9 9 0 0 1 6-3l3 3m0 9a9 9 0 0 1-3-6l3-3m9 0a9 9 0 0 1-6 3l-3-3" />
      </svg>
    );
  }
  if (
    s.includes("monitor") ||
    s.includes("màn hình") ||
    s.includes("man-hinh")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </svg>
    );
  }
  if (s.includes("laptop")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        <rect x="4" y="4" width="16" height="12" rx="2" />
        <path d="M2 19h20a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2z" />
      </svg>
    );
  }
  // Default All / Grid Icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function ProductManagement() {
  const {
    products,
    brands,
    categories,
    loading,
    error,
    viewMode,
    selectedProduct,
    setSelectedProductId,
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
  } = useProductManagement();

  // State for row-level delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for expanded rows showing variant details inline
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());
  const [copiedSku, setCopiedSku] = useState(null);

  const toggleExpandRow = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleCopySku = (sku, e) => {
    e.stopPropagation();
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Compute total variants in currently filtered products
  const totalVariantsFiltered = useMemo(() => {
    return filteredProducts.reduce(
      (sum, p) => sum + (p.variants?.length || 0),
      0,
    );
  }, [filteredProducts]);

  // If in Editor View (Create or Edit)
  if (viewMode === "editor") {
    return (
      <ProductEditor
        key={selectedProduct?.id || "new"}
        product={selectedProduct}
        brands={brands}
        categories={categories}
        onBack={handleBackToList}
        onRefreshList={() => loadData(true)}
        onSaved={async (savedProd) => {
          await loadData(true);
          if (savedProd?.id) {
            setSelectedProductId(savedProd.id);
          }
        }}
      />
    );
  }

  // Active Category Name
  const selectedCategoryObj = categories.find(
    (c) => String(c.id) === String(categoryFilter),
  );
  const selectedBrandObj = brands.find(
    (b) => String(b.id) === String(brandFilter),
  );

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      {/* HEADER SECTION */}
      <Heading
        title="Sản phẩm & Phiên bản"
        sub="Quản lý danh mục sản phẩm, biến thể SKU và giá bán từ cơ sở dữ liệu PostgreSQL."
        eyebrow="QUẢN TRỊ / SẢN PHẨM"
        action={
          <div className="row" style={{ gap: "0.75rem" }}>
            <Button
              tone="secondary"
              onClick={() => loadData(true)}
              disabled={loading}
              title="Đồng bộ dữ liệu mới nhất từ PostgreSQL"
            >
              {loading ? "Đang tải..." : "↻ Làm mới dữ liệu"}
            </Button>
            <Button tone="primary" onClick={handleOpenCreate}>
              + Thêm sản phẩm mới
            </Button>
          </div>
        }
      />

      {/* KPI METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid var(--line, #e2e7ed)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="muted small"
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Tổng sản phẩm
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 750,
              color: "var(--ink)",
              marginTop: "4px",
            }}
          >
            {metrics.totalProducts}
          </div>
          <div className="small muted" style={{ marginTop: "4px" }}>
            Trong cơ sở dữ liệu cloud
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid var(--line, #e2e7ed)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="muted small"
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Đang kinh doanh
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 750,
              color: "var(--green, #148465)",
              marginTop: "4px",
            }}
          >
            {metrics.activeCount}
          </div>
          <div className="small muted" style={{ marginTop: "4px" }}>
            Trạng thái ACTIVE trên cửa hàng
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid var(--line, #e2e7ed)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="muted small"
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Bản nháp
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 750,
              color: "#d97706",
              marginTop: "4px",
            }}
          >
            {metrics.draftCount}
          </div>
          <div className="small muted" style={{ marginTop: "4px" }}>
            Đang biên tập hoặc chưa mở bán
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid var(--line, #e2e7ed)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="muted small"
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Tổng biến thể SKU
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 750,
              color: "var(--red, #d91f31)",
              marginTop: "4px",
            }}
          >
            {metrics.totalVariants}
          </div>
          <div className="small muted" style={{ marginTop: "4px" }}>
            {metrics.outOfStockVariants > 0
              ? `${metrics.outOfStockVariants} biến thể đã hết hàng`
              : "Tất cả còn tồn kho"}
          </div>
        </div>
      </div>

      {/* VISUAL CATEGORY PILLS BAR */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
            padding: "0 2px",
          }}
        >
          <span
            className="small"
            style={{
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontSize: "11.5px",
            }}
          >
            Lọc nhanh theo danh mục linh kiện
          </span>
          <span className="small muted">
            {categories.length} danh mục khả dụng
          </span>
        </div>
        <div className="category-pills-bar">
          {/* ALL CATEGORIES CHIP */}
          <button
            type="button"
            className={`category-pill-btn ${categoryFilter === "ALL" ? "active" : ""}`}
            onClick={() => setCategoryFilter("ALL")}
          >
            <CategoryIcon slug="all" size={15} />
            <span>Tất cả</span>
            <span className="pill-badge">{categoryCounts.ALL || 0}</span>
          </button>

          {/* INDIVIDUAL CATEGORY CHIPS */}
          {categories.map((c) => {
            const isSelected = String(categoryFilter) === String(c.id);
            const count = categoryCounts[c.id] || 0;
            return (
              <button
                key={c.id}
                type="button"
                className={`category-pill-btn ${isSelected ? "active" : ""}`}
                onClick={() => setCategoryFilter(c.id)}
              >
                <CategoryIcon slug={c.slug || c.id || c.name} size={15} />
                <span>{c.name}</span>
                <span className="pill-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MULTI-DIMENSIONAL FILTER & SEARCH TOOLBAR */}
      <div className="product-filter-panel">
        {/* ROW 1: SEARCH & STATUS TABS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          {/* SEARCH FIELD WITH SVG ICON & CLEAR BUTTON */}
          <div style={{ flex: "1 1 300px", maxWidth: "460px" }}>
            <div className="search-input-box">
              <span className="search-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, thương hiệu, mã SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-btn"
                  title="Xóa tìm kiếm"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* STATUS TABS */}
          <div
            className="row"
            style={{
              background: "var(--bg, #f5f7fa)",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid var(--line, #e2e7ed)",
            }}
          >
            {[
              { id: "ALL", label: `Tất cả (${products.length})` },
              { id: "ACTIVE", label: `Đang bán (${metrics.activeCount})` },
              { id: "DRAFT", label: `Bản nháp (${metrics.draftCount})` },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: isSelected ? 650 : 500,
                    color: isSelected ? "var(--ink)" : "var(--muted)",
                    background: isSelected ? "#fff" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    boxShadow: isSelected
                      ? "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 2: VARIANT & ATTRIBUTE FILTERS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          {/* 1. VARIANT STOCK FILTER */}
          <select
            className={`filter-dropdown-select ${stockFilter !== "ALL" ? "has-value" : ""}`}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            title="Lọc theo tình trạng tồn kho biến thể SKU"
          >
            <option value="ALL">📦 Tồn kho SKU: Tất cả ({stockCounts.ALL || 0})</option>
            <option value="IN_STOCK">
              ✅ Còn hàng ({stockCounts.IN_STOCK || 0})
            </option>
            <option value="LOW_STOCK">
              ⚠️ Sắp hết hàng (≤5) ({stockCounts.LOW_STOCK || 0})
            </option>
            <option value="OUT_OF_STOCK">
              ❌ Có biến thể hết hàng ({stockCounts.OUT_OF_STOCK || 0})
            </option>
            <option value="ALL_EMPTY">🚫 Hết hàng toàn bộ</option>
          </select>

          {/* 2. VARIANT PRICE RANGE FILTER */}
          <select
            className={`filter-dropdown-select ${priceRangeFilter !== "ALL" ? "has-value" : ""}`}
            value={priceRangeFilter}
            onChange={(e) => setPriceRangeFilter(e.target.value)}
            title="Lọc theo khoảng giá của biến thể"
          >
            <option value="ALL">💰 Mức giá SKU: Tất cả</option>
            <option value="UNDER_2M">Dưới 2.000.000 đ</option>
            <option value="2M_5M">2.000.000 đ - 5.000.000 đ</option>
            <option value="5M_10M">5.000.000 đ - 10.000.000 đ</option>
            <option value="OVER_10M">Trên 10.000.000 đ</option>
          </select>

          {/* 3. BRAND FILTER */}
          <select
            className={`filter-dropdown-select ${brandFilter !== "ALL" ? "has-value" : ""}`}
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            title="Lọc theo thương hiệu sản xuất"
          >
            <option value="ALL">🏷️ Thương hiệu: Tất cả</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({brandCounts[b.id] || 0})
              </option>
            ))}
          </select>

          {/* 4. VARIANT COUNT FILTER */}
          <select
            className={`filter-dropdown-select ${variantCountFilter !== "ALL" ? "has-value" : ""}`}
            value={variantCountFilter}
            onChange={(e) => setVariantCountFilter(e.target.value)}
            title="Lọc theo số lượng biến thể SKU"
          >
            <option value="ALL">🔢 Số SKU: Tất cả</option>
            <option value="MULTI">Đa biến thể (≥2 SKU)</option>
            <option value="SINGLE">Đơn biến thể (1 SKU)</option>
            <option value="EMPTY">Chưa có biến thể (0 SKU)</option>
          </select>

          {/* 5. SORT ORDER */}
          <select
            className={`filter-dropdown-select ${sortBy !== "DEFAULT" ? "has-value" : ""}`}
            style={{ marginLeft: "auto" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sắp xếp kết quả hiển thị"
          >
            <option value="DEFAULT">↕️ Sắp xếp: Mới nhất</option>
            <option value="NAME_ASC">Tên sản phẩm: A → Z</option>
            <option value="NAME_DESC">Tên sản phẩm: Z → A</option>
            <option value="PRICE_ASC">Giá biến thể: Thấp → Cao</option>
            <option value="PRICE_DESC">Giá biến thể: Cao → Thấp</option>
            <option value="STOCK_DESC">Tổng tồn kho: Nhiều nhất</option>
            <option value="STOCK_ASC">Tổng tồn kho: Ít nhất</option>
            <option value="VARIANTS_DESC">Số biến thể: Nhiều nhất</option>
          </select>

          {/* QUICK RESET BUTTON */}
          {hasActiveFilters && (
            <Button
              size="small"
              tone="secondary"
              onClick={resetFilters}
              title="Đặt lại toàn bộ các bộ lọc về mặc định"
            >
              ↺ Đặt lại
            </Button>
          )}
        </div>

        {/* ROW 3: ACTIVE FILTER TAGS & RESULT SUMMARY */}
        {hasActiveFilters && (
          <div className="active-filters-row">
            <span
              className="small muted"
              style={{ fontWeight: 600, marginRight: "4px" }}
            >
              Đang lọc theo ({activeFilterCount}):
            </span>

            {searchQuery.trim() && (
              <span className="filter-chip-badge">
                <span>Từ khóa: "{searchQuery.trim()}"</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              </span>
            )}

            {categoryFilter !== "ALL" && selectedCategoryObj && (
              <span className="filter-chip-badge">
                <CategoryIcon slug={selectedCategoryObj.slug || selectedCategoryObj.name} size={13} />
                <span>Danh mục: {selectedCategoryObj.name}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setCategoryFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {statusFilter !== "ALL" && (
              <span className="filter-chip-badge">
                <span>Trạng thái: {statusFilter === "ACTIVE" ? "Đang bán" : "Bản nháp"}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setStatusFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {stockFilter !== "ALL" && (
              <span className="filter-chip-badge">
                <span>
                  Tồn kho:{" "}
                  {stockFilter === "IN_STOCK"
                    ? "Còn hàng"
                    : stockFilter === "LOW_STOCK"
                      ? "Sắp hết hàng (≤5)"
                      : stockFilter === "OUT_OF_STOCK"
                        ? "Có SKU hết hàng"
                        : "Hết hàng toàn bộ"}
                </span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setStockFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {priceRangeFilter !== "ALL" && (
              <span className="filter-chip-badge">
                <span>
                  Giá:{" "}
                  {priceRangeFilter === "UNDER_2M"
                    ? "< 2 triệu"
                    : priceRangeFilter === "2M_5M"
                      ? "2 - 5 triệu"
                      : priceRangeFilter === "5M_10M"
                        ? "5 - 10 triệu"
                        : "> 10 triệu"}
                </span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setPriceRangeFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {brandFilter !== "ALL" && selectedBrandObj && (
              <span className="filter-chip-badge">
                <span>Thương hiệu: {selectedBrandObj.name}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setBrandFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {variantCountFilter !== "ALL" && (
              <span className="filter-chip-badge">
                <span>
                  SKU:{" "}
                  {variantCountFilter === "MULTI"
                    ? "Đa biến thể (≥2)"
                    : variantCountFilter === "SINGLE"
                      ? "Đơn biến thể (1)"
                      : "Chưa có SKU (0)"}
                </span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setVariantCountFilter("ALL")}
                >
                  ✕
                </button>
              </span>
            )}

            {sortBy !== "DEFAULT" && (
              <span className="filter-chip-badge">
                <span>Sắp xếp tùy chỉnh</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setSortBy("DEFAULT")}
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              className="text-button"
              style={{
                marginLeft: "auto",
                fontSize: "12px",
                color: "var(--red, #d91f31)",
                fontWeight: 600,
              }}
              onClick={resetFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ERROR NOTICE IF ANY */}
      {error && (
        <Notice tone="danger">
          Không thể kết nối máy chủ Backend. Chi tiết: {error}
        </Notice>
      )}

      {/* PRODUCTS TABLE */}
      <Panel
        title={`Danh sách sản phẩm (${filteredProducts.length})`}
        action={
          <div className="small muted" style={{ fontWeight: 500 }}>
            Hiển thị <strong>{filteredProducts.length}</strong> /{" "}
            {products.length} sản phẩm ·{" "}
            <strong>{totalVariantsFiltered}</strong> biến thể SKU
          </div>
        }
      >
        {loading && products.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Đang tải dữ liệu từ PostgreSQL Cloud...
          </div>
        ) : filteredProducts.length === 0 ? (
          <Empty
            title="Không tìm thấy sản phẩm nào"
            sub={
              hasActiveFilters
                ? "Không có sản phẩm nào khớp với các tiêu chí tìm kiếm và bộ lọc đã chọn. Hãy thử nới lỏng bộ lọc."
                : "Chưa có sản phẩm nào trong hệ thống. Hãy tạo sản phẩm đầu tiên!"
            }
            action={
              hasActiveFilters ? (
                <Button onClick={resetFilters}>↺ Đặt lại bộ lọc</Button>
              ) : (
                <Button onClick={handleOpenCreate}>+ Tạo sản phẩm mới</Button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>ID</th>
                  <th style={{ width: "60px" }}>Ảnh</th>
                  <th>Sản phẩm & Thương hiệu</th>
                  <th>Danh mục</th>
                  <th>Bảo hành</th>
                  <th>Biến thể & Khoảng giá</th>
                  <th>Tổng tồn kho</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const variants = p.variants || [];
                  const variantCount = variants.length;
                  const prices = variants
                    .map((v) => Number(v.price))
                    .filter((pr) => pr > 0);
                  const minPrice = prices.length ? Math.min(...prices) : 0;
                  const maxPrice = prices.length ? Math.max(...prices) : 0;
                  const totalStock = variants.reduce(
                    (sum, v) => sum + Number(v.stockQuantity || 0),
                    0,
                  );

                  const isStatusActive =
                    (p.status || "").toUpperCase() === "ACTIVE";
                  const catSlug =
                    categories.find((c) => c.id === p.categoryId)?.slug ||
                    (p.categoryName || "").toLowerCase();
                  const firstVariant = variants[0];
                  const thumbnail =
                    p.imageUrl ||
                    firstVariant?.imageUrl ||
                    getCategoryMockImage(catSlug);

                  const isExpanded = expandedProductIds.has(p.id);

                  return (
                    <Fragment key={p.id}>
                      <tr style={{ verticalAlign: "middle" }}>
                        <td style={{ width: "50px" }}>
                          <code
                            className="mono"
                            style={{ color: "var(--muted)" }}
                          >
                            #{p.id}
                          </code>
                        </td>
                        <td style={{ width: "60px" }}>
                          <img
                            src={thumbnail}
                            alt={p.name}
                            style={{
                              width: "44px",
                              height: "44px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid var(--line, #e2e7ed)",
                              backgroundColor: "#f8fafc",
                              display: "block",
                            }}
                            onError={(e) => {
                              e.currentTarget.src =
                                getCategoryMockImage(catSlug);
                            }}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--ink)",
                                fontSize: "15px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleOpenEdit(p)}
                              title="Bấm để chỉnh sửa chi tiết"
                            >
                              {p.name}
                            </span>
                            <span className="small muted">
                              Thương hiệu:{" "}
                              <strong>{p.brandName || "—"}</strong>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: "rgba(0,0,0,0.04)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CategoryIcon slug={catSlug} size={12} />
                            <span>{p.categoryName || "Chưa phân loại"}</span>
                          </span>
                        </td>
                        <td>
                          <span className="small">
                            {p.warrantyPeriodMonths ?? 12} tháng
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "4px",
                            }}
                          >
                            {/* INTERACTIVE EXPANDABLE VARIANT PILL */}
                            <button
                              type="button"
                              className={`variant-expand-btn ${isExpanded ? "is-expanded" : ""}`}
                              onClick={() => toggleExpandRow(p.id)}
                              title={
                                isExpanded
                                  ? "Thu gọn danh sách SKU"
                                  : "Xem nhanh chi tiết các biến thể SKU"
                              }
                            >
                              <span>
                                {variantCount > 0
                                  ? `${variantCount} biến thể SKU`
                                  : "Chưa có biến thể"}
                              </span>
                              <span style={{ fontSize: "9px" }}>
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            </button>

                            <span
                              className="small muted"
                              style={{ fontSize: "12px" }}
                            >
                              {prices.length === 0
                                ? "Chưa set giá"
                                : minPrice === maxPrice
                                  ? money(minPrice)
                                  : `${money(minPrice)} - ${money(maxPrice)}`}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge
                            tone={totalStock > 0 ? "success" : "danger"}
                          >
                            {totalStock > 0
                              ? `${totalStock} cái`
                              : "Hết hàng"}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            tone={isStatusActive ? "success" : "warning"}
                          >
                            {isStatusActive ? "Đang bán" : "Bản nháp"}
                          </Badge>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            className="row"
                            style={{
                              justifyContent: "flex-end",
                              gap: "0.5rem",
                            }}
                          >
                            <Button
                              size="small"
                              tone="secondary"
                              onClick={() => handleOpenEdit(p)}
                            >
                              Chỉnh sửa
                            </Button>
                            <Button
                              size="small"
                              tone="danger"
                              onClick={() => setDeleteTarget(p)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* INLINE EXPANDED VARIANT DRAWER */}
                      {isExpanded && (
                        <tr key={`${p.id}-variants`}>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <div className="variant-drawer-panel">
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.6rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12.5px",
                                    fontWeight: 700,
                                    color: "var(--ink)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <span>🔍 Danh sách biến thể SKU ({variants.length}) của:</span>
                                  <span style={{ color: "var(--red, #d91f31)" }}>
                                    {p.name}
                                  </span>
                                </div>
                                <div className="row" style={{ gap: "0.5rem" }}>
                                  <button
                                    type="button"
                                    className="text-button"
                                    style={{ fontSize: "12px", color: "var(--focus)" }}
                                    onClick={() => handleOpenEdit(p)}
                                  >
                                    + Thêm/Sửa SKU trong Editor →
                                  </button>
                                </div>
                              </div>

                              {variants.length === 0 ? (
                                <div
                                  style={{
                                    background: "#fff",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    textAlign: "center",
                                    color: "var(--muted)",
                                    fontSize: "13px",
                                  }}
                                >
                                  Sản phẩm chưa có biến thể SKU nào. Hãy bấm "Chỉnh sửa" để thêm phiên bản.
                                </div>
                              ) : (
                                <div className="variant-drawer-inner">
                                  <table
                                    style={{
                                      width: "100%",
                                      fontSize: "12.5px",
                                      borderCollapse: "collapse",
                                    }}
                                  >
                                    <thead>
                                      <tr
                                        style={{
                                          background: "#f1f5f9",
                                          borderBottom: "1px solid #e2e8f0",
                                          textAlign: "left",
                                        }}
                                      >
                                        <th style={{ padding: "7px 12px" }}>Mã SKU / Serial</th>
                                        <th style={{ padding: "7px 12px" }}>Tên phiên bản</th>
                                        <th style={{ padding: "7px 12px" }}>Giá niêm yết</th>
                                        <th style={{ padding: "7px 12px" }}>Tồn kho</th>
                                        <th style={{ padding: "7px 12px" }}>Thông số kỹ thuật</th>
                                        <th style={{ padding: "7px 12px", textAlign: "right" }}>Thao tác</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {variants.map((v) => {
                                        const stockNum = Number(v.stockQuantity ?? v.stock ?? 0);
                                        const skuCode = v.serialCode || v.sku || `SKU-${v.id}`;
                                        const specText = v.specs
                                          ? Object.entries(v.specs)
                                              .map(([k, val]) => `${k}: ${val}`)
                                              .slice(0, 3)
                                              .join(" · ")
                                          : "—";

                                        return (
                                          <tr
                                            key={v.id}
                                            style={{
                                              borderBottom: "1px solid #f1f5f9",
                                            }}
                                          >
                                            <td style={{ padding: "8px 12px" }}>
                                              <div
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: "5px",
                                                }}
                                              >
                                                <code
                                                  className="mono"
                                                  style={{
                                                    fontWeight: 600,
                                                    background: "#f1f5f9",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                  }}
                                                >
                                                  {skuCode}
                                                </code>
                                                <button
                                                  type="button"
                                                  className="text-button"
                                                  title="Sao chép mã SKU"
                                                  style={{
                                                    fontSize: "11px",
                                                    color: copiedSku === skuCode ? "var(--green)" : "var(--muted)",
                                                    cursor: "pointer",
                                                  }}
                                                  onClick={(e) => handleCopySku(skuCode, e)}
                                                >
                                                  {copiedSku === skuCode ? "✓ Đã chép" : "Copy"}
                                                </button>
                                              </div>
                                            </td>
                                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                                              {v.variantName || v.variant || "Phiên bản tiêu chuẩn"}
                                            </td>
                                            <td style={{ padding: "8px 12px" }}>
                                              <span style={{ fontWeight: 650, color: "var(--ink)" }}>
                                                {money(Number(v.price || 0))}
                                              </span>
                                              {Number(v.originalPrice) > Number(v.price) && (
                                                <div
                                                  className="small muted"
                                                  style={{
                                                    textDecoration: "line-through",
                                                    fontSize: "11px",
                                                  }}
                                                >
                                                  {money(Number(v.originalPrice))}
                                                </div>
                                              )}
                                            </td>
                                            <td style={{ padding: "8px 12px" }}>
                                              <Badge
                                                tone={
                                                  stockNum > 5
                                                    ? "success"
                                                    : stockNum > 0
                                                      ? "warning"
                                                      : "danger"
                                                }
                                              >
                                                {stockNum > 5
                                                  ? `${stockNum} cái (Còn)`
                                                  : stockNum > 0
                                                    ? `${stockNum} cái (Sắp hết)`
                                                    : "Hết hàng"}
                                              </Badge>
                                            </td>
                                            <td
                                              style={{
                                                padding: "8px 12px",
                                                color: "var(--muted)",
                                                fontSize: "12px",
                                                maxWidth: "260px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                              title={specText}
                                            >
                                              {specText}
                                            </td>
                                            <td
                                              style={{
                                                padding: "8px 12px",
                                                textAlign: "right",
                                              }}
                                            >
                                              <Button
                                                size="small"
                                                tone="secondary"
                                                onClick={() => handleOpenEdit(p)}
                                              >
                                                Sửa SKU
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {deleteTarget && (
        <Modal
          title="Xác nhận xóa sản phẩm"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="stack" style={{ gap: "1rem" }}>
            <p>
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <strong>'{deleteTarget.name}'</strong> (ID #{deleteTarget.id})
              cùng tất cả các biến thể SKU liên quan?
            </p>
            <Notice tone="danger">
              Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống. Nếu sản
              phẩm đã phát sinh trong đơn hàng của khách hàng, hệ thống sẽ tự
              động chặn xóa để đảm bảo toàn vẹn dữ liệu kế toán.
            </Notice>
            <div
              className="row"
              style={{ justifyContent: "flex-end", gap: "0.75rem" }}
            >
              <Button tone="secondary" onClick={() => setDeleteTarget(null)}>
                Hủy bỏ
              </Button>
              <Button
                tone="danger"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await handleDeleteProduct(deleteTarget.id);
                    setDeleteTarget(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
