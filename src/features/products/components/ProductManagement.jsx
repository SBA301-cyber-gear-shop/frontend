import { useState } from "react";
import { money } from "@/utils";
import { Badge, Button, Heading, Notice, Panel, Empty, Modal } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { ProductEditor } from "./ProductEditor";
import { useProductManagement } from "../hooks/useProductManagement";
import { getCategoryMockImage } from "../constants/mockImages";

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

  // If in Editor View (Create or Edit)
  if (viewMode === "editor") {
    return (
      <ProductEditor
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

  // LIST / OVERVIEW VIEW
  return (
    <div className="stack" style={{ gap: "1.75rem" }}>
      {/* HEADER SECTION */}
      <Heading
        title="Sản phẩm & Phiên bản"
        sub="Quản lý danh mục sản phẩm, biến thể SKU và giá bán từ cơ sở dữ liệu Neon PostgreSQL."
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
          <div className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tổng sản phẩm
          </div>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "var(--ink)", marginTop: "4px" }}>
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
          <div className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Đang kinh doanh
          </div>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "var(--green, #148465)", marginTop: "4px" }}>
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
          <div className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Bản nháp
          </div>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "#d97706", marginTop: "4px" }}>
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
          <div className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tổng biến thể SKU
          </div>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "var(--red, #d91f31)", marginTop: "4px" }}>
            {metrics.totalVariants}
          </div>
          <div className="small muted" style={{ marginTop: "4px" }}>
            {metrics.outOfStockVariants > 0
              ? `${metrics.outOfStockVariants} biến thể đã hết hàng`
              : "Tất cả còn tồn kho"}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          background: "#fff",
          borderRadius: "10px",
          border: "1px solid var(--line, #e2e7ed)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Search Field */}
        <div style={{ flex: "1 1 280px", maxWidth: "420px" }}>
          <input
            type="text"
            className="input full"
            placeholder="🔍 Tìm theo tên sản phẩm, thương hiệu, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Tabs and Category Filter */}
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          {/* Status Tabs */}
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
                    padding: "5px 12px",
                    fontSize: "13px",
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? "var(--ink)" : "var(--muted)",
                    background: isSelected ? "#fff" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    boxShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown */}
          <select
            className="input"
            style={{ minWidth: "160px", padding: "6px 12px", fontSize: "13px" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR NOTICE IF ANY */}
      {error && (
        <Notice tone="danger">
          Không thể kết nối máy chủ Backend. Chi tiết: {error}
        </Notice>
      )}

      {/* PRODUCTS TABLE */}
      <Panel title={`Danh sách sản phẩm (${filteredProducts.length})`}>
        {loading && products.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            Đang tải dữ liệu từ PostgreSQL Cloud...
          </div>
        ) : filteredProducts.length === 0 ? (
          <Empty
            title="Không tìm thấy sản phẩm nào"
            sub={
              searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái để xem thêm kết quả."
                : "Chưa có sản phẩm nào trong hệ thống. Hãy tạo sản phẩm đầu tiên!"
            }
            action={
              <Button onClick={handleOpenCreate}>+ Tạo sản phẩm mới</Button>
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
                  const prices = variants.map((v) => Number(v.price)).filter((pr) => pr > 0);
                  const minPrice = prices.length ? Math.min(...prices) : 0;
                  const maxPrice = prices.length ? Math.max(...prices) : 0;
                  const totalStock = variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0);

                  const isStatusActive = (p.status || "").toUpperCase() === "ACTIVE";
                  const catSlug = categories.find((c) => c.id === p.categoryId)?.slug || (p.categoryName || "").toLowerCase();
                  const firstVariant = variants[0];
                  const thumbnail = p.imageUrl || firstVariant?.imageUrl || getCategoryMockImage(catSlug);

                  return (
                    <tr key={p.id}>
                      <td>
                        <code className="mono" style={{ color: "var(--muted)" }}>
                          #{p.id}
                        </code>
                      </td>
                      <td>
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
                            e.currentTarget.src = getCategoryMockImage(catSlug);
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--ink)",
                              fontSize: "15px",
                              cursor: "pointer",
                            }}
                            onClick={() => handleOpenEdit(p)}
                            title="Bấm để chỉnh sửa"
                          >
                            {p.name}
                          </span>
                          <span className="small muted">
                            Thương hiệu: <strong>{p.brandName || "—"}</strong>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "rgba(0,0,0,0.04)" }}>
                          {p.categoryName || "Chưa phân loại"}
                        </span>
                      </td>
                      <td>
                        <span className="small">{p.warrantyPeriodMonths || 12} tháng</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>
                            {variantCount > 0 ? `${variantCount} biến thể SKU` : "Chưa có biến thể"}
                          </span>
                          <span className="small muted">
                            {prices.length === 0
                              ? "Chưa set giá"
                              : minPrice === maxPrice
                              ? money(minPrice)
                              : `${money(minPrice)} - ${money(maxPrice)}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={totalStock > 0 ? "success" : "danger"}>
                          {totalStock > 0 ? `${totalStock} cái` : "Hết hàng"}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={isStatusActive ? "success" : "warning"}>
                          {isStatusActive ? "Đang bán" : "Bản nháp"}
                        </Badge>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
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
              <strong>'{deleteTarget.name}'</strong> (ID #{deleteTarget.id}) cùng tất cả các biến thể SKU liên quan?
            </p>
            <Notice tone="danger">
              Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống. Nếu sản phẩm đã phát sinh trong đơn hàng của khách hàng, hệ thống sẽ tự động chặn xóa để đảm bảo toàn vẹn dữ liệu kế toán.
            </Notice>
            <div className="row" style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
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
