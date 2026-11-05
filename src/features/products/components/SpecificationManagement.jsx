import { useState, useEffect, useMemo, Fragment } from "react";
import { Button, Heading, Notice, Panel, Badge, Empty, Skeleton, Modal } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { useSpecificationManagement } from "../hooks/useSpecificationManagement";

// Helper to count total categories recursively
function countTotalCategories(cats) {
  if (!Array.isArray(cats)) return 0;
  let count = 0;
  for (const c of cats) {
    count += 1;
    if (c.children && c.children.length > 0) {
      count += countTotalCategories(c.children);
    }
  }
  return count;
}

// Helper to retrieve category breadcrumb path [Root, Sub, Sub-Sub...]
function getCategoryPath(cats, targetId, currentPath = []) {
  if (!Array.isArray(cats) || !targetId) return null;
  for (const cat of cats) {
    const nextPath = [...currentPath, cat];
    if (cat.id === targetId) return nextPath;
    if (cat.children && cat.children.length > 0) {
      const found = getCategoryPath(cat.children, targetId, nextPath);
      if (found) return found;
    }
  }
  return null;
}

// Helper to filter category tree while preserving hierarchy & auto-expanding parents
function filterCategoryTree(cats, query) {
  if (!query || !query.trim()) return { filtered: cats || [], matchedIds: new Set(), parentIdsToExpand: new Set() };
  const lowerQuery = query.toLowerCase().trim();
  const matchedIds = new Set();
  const parentIdsToExpand = new Set();

  function checkMatch(cat) {
    const nameMatch = (cat.name || "").toLowerCase().includes(lowerQuery);
    const slugMatch = (cat.slug || "").toLowerCase().includes(lowerQuery);
    const descMatch = (cat.description || "").toLowerCase().includes(lowerQuery);
    return nameMatch || slugMatch || descMatch;
  }

  function filterNodes(nodes) {
    const result = [];
    for (const node of nodes) {
      const isSelfMatch = checkMatch(node);
      const childMatches = node.children && node.children.length > 0
        ? filterNodes(node.children)
        : [];

      if (isSelfMatch || childMatches.length > 0) {
        if (isSelfMatch) matchedIds.add(node.id);
        if (childMatches.length > 0) {
          parentIdsToExpand.add(node.id);
        }
        result.push({
          ...node,
          children: childMatches,
        });
      }
    }
    return result;
  }

  const filtered = filterNodes(cats);
  return { filtered, matchedIds, parentIdsToExpand };
}

export function SpecificationManagement() {
  const {
    categories,
    selectedCategory,
    selectedCategoryId,
    allSpecs,
    draft,
    loading,
    saving,
    newName,
    setNewName,
    selectedSpecId,
    setSelectedSpecId,
    choose,
    toggle,
    removeSpec,
    addExistingSpec,
    createNewSpec,
    saveChanges,
    categoryModalOpen,
    setCategoryModalOpen,
    editingCategoryId,
    categoryForm,
    setCategoryForm,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    categoryToDelete,
    categorySubmitting,
    openCreateCategoryModal,
    openEditCategoryModal,
    openDeleteCategoryModal,
    handleSaveCategory,
    handleDeleteCategory,
  } = useSpecificationManagement();

  // View state: "overview" (Category Tree Table) | "detail" (Specification Configuration)
  const [viewMode, setViewMode] = useState("overview");

  // Expanded categories state (holds set of category IDs)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Auto-expand all parent categories that have children on initial load
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      const ids = new Set();
      function collect(items) {
        for (const item of items) {
          if (item.children && item.children.length > 0) {
            ids.add(item.id);
            collect(item.children);
          }
        }
      }
      collect(categories);
      setExpandedCategoryIds(ids);
    }
  }, [categories]);

  // Flattened categories for the Parent dropdown select
  const flatCategories = useMemo(() => {
    const list = [];
    function traverse(items, prefix = "") {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        list.push({ id: item.id, name: prefix + item.name });
        if (item.children && item.children.length > 0) {
          traverse(item.children, prefix + "— ");
        }
      }
    }
    traverse(categories);
    return list;
  }, [categories]);

  // Filtered categories
  const { filtered: filteredCategories, matchedIds, parentIdsToExpand } = useMemo(() => {
    return filterCategoryTree(categories, searchQuery);
  }, [categories, searchQuery]);

  // Auto-expand branches when searching
  useEffect(() => {
    if (searchQuery.trim() && parentIdsToExpand.size > 0) {
      setExpandedCategoryIds((prev) => new Set([...prev, ...parentIdsToExpand]));
    }
  }, [searchQuery, parentIdsToExpand]);

  // Pagination on Root Categories
  const totalRootCategories = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalRootCategories / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRootCategories = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, safeCurrentPage, PAGE_SIZE]);

  const totalCategoriesCount = useMemo(() => countTotalCategories(categories), [categories]);

  // Breadcrumb path of currently selected category
  const categoryPath = useMemo(() => {
    if (!selectedCategoryId) return [];
    return getCategoryPath(categories, selectedCategoryId) || [];
  }, [categories, selectedCategoryId]);

  const availableSpecsToAdd = allSpecs.filter(
    (s) => !draft.some((d) => d.specificationId === s.id)
  );

  // Toggle expand / collapse of a single category
  function toggleExpand(catId, e) {
    if (e) e.stopPropagation();
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }

  // Expand / collapse all
  function expandAll() {
    const allIds = new Set();
    function collect(items) {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id);
          collect(item.children);
        }
      }
    }
    collect(categories);
    setExpandedCategoryIds(allIds);
  }

  function collapseAll() {
    setExpandedCategoryIds(new Set());
  }

  // Navigate to Detail View for a category
  function openDetailView(catId) {
    choose(catId);
    setViewMode("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Return back to Overview View
  function closeDetailView() {
    setViewMode("overview");
  }

  // Recursive renderer for table rows (handles arbitrary nesting levels)
  function renderCategoryRow(c, depth = 0, parentName = null) {
    const hasChildren = Array.isArray(c.children) && c.children.length > 0;
    const isExpanded = expandedCategoryIds.has(c.id);
    const specCount = c.specifications?.length || 0;
    const childCount = c.children?.length || 0;
    const isRoot = depth === 0;
    const isMatched = matchedIds.has(c.id);

    return (
      <Fragment key={c.id}>
        <tr
          className={`cat-tree-row ${selectedCategoryId === c.id ? "active" : ""}`}
          style={{
            background: isRoot
              ? "transparent"
              : "var(--card-subtle, rgba(0, 0, 0, 0.015))",
            borderLeft: depth > 0 ? `${depth * 3}px solid var(--accent, #2563eb)` : "none",
          }}
        >
          {/* Cột 1: Tên danh mục + Icon Dropdown + Cây phân cấp */}
          <td style={{ padding: "12px 14px", paddingLeft: `${14 + depth * 28}px` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {hasChildren ? (
                <button
                  type="button"
                  className="cat-tree-toggle-btn"
                  onClick={(e) => toggleExpand(c.id, e)}
                  title={isExpanded ? "Thu gọn danh mục con" : "Mở rộng danh mục con"}
                  aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    textAlign: "center",
                    opacity: 0.35,
                    fontSize: "0.85rem",
                  }}
                >
                  {depth > 0 ? "↳" : "•"}
                </span>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    onClick={() => openDetailView(c.id)}
                    style={{
                      fontWeight: isRoot ? 600 : 500,
                      fontSize: isRoot ? "0.95rem" : "0.9rem",
                      color: isMatched ? "var(--accent, #2563eb)" : "var(--ink, #152237)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textDecorationColor: "transparent",
                      transition: "text-decoration-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "currentColor")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
                    title="Bấm để cấu hình thông số kỹ thuật"
                  >
                    {c.name}
                  </span>

                  {depth > 0 && parentName && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--muted, #64748b)",
                        background: "rgba(0,0,0,0.04)",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Trực thuộc: <b>{parentName}</b>
                    </span>
                  )}

                  {hasChildren && (
                    <Badge tone="neutral" size="small">
                      {childCount} mục con
                    </Badge>
                  )}
                </div>

                {c.description && (
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--muted, #64748b)",
                      marginTop: 2,
                      maxWidth: 420,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.description}
                  </div>
                )}
              </div>
            </div>
          </td>

          {/* Cột 2: Đường dẫn Slug */}
          <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
            <code
              style={{
                fontSize: "0.8rem",
                padding: "2px 6px",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 4,
                color: "var(--muted, #64748b)",
              }}
            >
              /{c.slug || "—"}
            </code>
          </td>

          {/* Cột 3: Cấp bậc */}
          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center" }}>
            {isRoot ? (
              <Badge tone="primary">Danh mục gốc</Badge>
            ) : (
              <Badge tone="neutral">Cấp {depth + 1}</Badge>
            )}
          </td>

          {/* Cột 4: Thông số đã gán */}
          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center" }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 600,
                background: specCount > 0 ? "rgba(37, 99, 235, 0.1)" : "rgba(0,0,0,0.05)",
                color: specCount > 0 ? "var(--accent, #2563eb)" : "var(--muted, #64748b)",
              }}
            >
              {specCount} thông số
            </span>
          </td>

          {/* Cột 5: Hành động */}
          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "right" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Button
                size="small"
                tone="secondary"
                onClick={() => openDetailView(c.id)}
                title="Cấu hình thông số kỹ thuật & bộ lọc"
                style={{ fontSize: "0.78rem", padding: "4px 8px" }}
              >
                ⚙️ Cấu hình
              </Button>
              <Button
                size="small"
                tone="secondary"
                onClick={() => openCreateCategoryModal(c.id)}
                title={`Thêm danh mục con trực thuộc "${c.name}"`}
                style={{ fontSize: "0.78rem", padding: "4px 8px" }}
              >
                + Con
              </Button>
              <button
                type="button"
                className="icon-button"
                title="Chỉnh sửa thông tin danh mục"
                onClick={(e) => openEditCategoryModal(c, e)}
                style={{
                  background: "none",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "4px 7px",
                  fontSize: "0.85rem",
                  lineHeight: 1,
                  color: "var(--ink, #152237)",
                }}
              >
                ✏️
              </button>
              <button
                type="button"
                className="icon-button"
                title="Xóa danh mục"
                onClick={(e) => openDeleteCategoryModal(c, e)}
                style={{
                  background: "none",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "4px 7px",
                  fontSize: "0.85rem",
                  lineHeight: 1,
                  color: "var(--danger, #ef4444)",
                }}
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>

        {/* Render child categories recursively if expanded */}
        {hasChildren &&
          isExpanded &&
          c.children.map((child) => renderCategoryRow(child, depth + 1, c.name))}
      </Fragment>
    );
  }

  return (
    <>
      <style>{`
        @keyframes catFadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .cat-animated-pane {
          animation: catFadeSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cat-tree-table {
          width: 100%;
          border-collapse: collapse;
        }
        .cat-tree-row {
          border-bottom: 1px solid var(--line, #e2e8f0);
          transition: background-color 0.15s ease;
        }
        .cat-tree-row:hover {
          background-color: var(--card-subtle, rgba(0, 0, 0, 0.025)) !important;
        }
        .cat-tree-row.active {
          background-color: rgba(37, 99, 235, 0.05) !important;
        }
        .cat-tree-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: 1px solid var(--line, #e2e8f0);
          background: var(--panel, #fff);
          cursor: pointer;
          font-size: 9px;
          color: var(--ink, #152237);
          transition: all 0.15s ease;
          padding: 0;
          flex-shrink: 0;
        }
        .cat-tree-toggle-btn:hover {
          background: var(--line, #e2e8f0);
          color: var(--accent, #2563eb);
        }
        .cat-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: var(--panel, #fff);
          border: 1px solid var(--line, #e2e8f0);
          border-radius: var(--radius, 12px);
          margin-bottom: 16px;
        }
        .cat-pagination-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--line, #e2e8f0);
          background: var(--panel, #fff);
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--ink, #152237);
          transition: all 0.15s ease;
        }
        .cat-pagination-btn:hover:not(:disabled) {
          border-color: var(--accent, #2563eb);
          color: var(--accent, #2563eb);
        }
        .cat-pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cat-pagination-btn.active {
          background: var(--accent, #2563eb);
          color: #fff;
          border-color: var(--accent, #2563eb);
          font-weight: 600;
        }
      `}</style>

      {/* ========================================================= */}
      {/* VIEW 1: OVERVIEW - CATEGORY TREE TABLE (DEFAULT VIEW)     */}
      {/* ========================================================= */}
      {viewMode === "overview" && (
        <div className="cat-animated-pane">
          <Heading
            title="Quản lý danh mục sản phẩm"
            sub="Quản lý phân cấp cây danh mục sản phẩm, cấu hình bộ lọc tìm kiếm và quy tắc tương thích linh kiện phần cứng."
            eyebrow="QUẢN TRỊ / DANH MỤC"
            action={
              <Button onClick={() => openCreateCategoryModal()} tone="primary">
                + Thêm danh mục mới
              </Button>
            }
          />

          <Panel>
            {/* Thanh công cụ: Tìm kiếm + Expand/Collapse + Thống kê */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--line, #e2e8f0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  className="input"
                  style={{ maxWidth: 360, width: "100%" }}
                  placeholder="🔍 Tìm kiếm danh mục theo tên, slug, mô tả..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery && (
                  <Button size="small" tone="secondary" onClick={() => setSearchQuery("")}>
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)", marginRight: 4 }}>
                  Tổng cộng: <b>{categories.length}</b> gốc ({totalCategoriesCount} danh mục)
                </span>
                <Button size="small" tone="secondary" onClick={expandAll} title="Mở rộng tất cả danh mục con">
                  ▼ Mở rộng tất cả
                </Button>
                <Button size="small" tone="secondary" onClick={collapseAll} title="Thu gọn danh mục con">
                  ▶ Thu gọn tất cả
                </Button>
              </div>
            </div>

            {/* Bảng danh mục */}
            {loading && categories.length === 0 ? (
              <div className="stack" style={{ gap: 12, padding: "24px 0" }}>
                <Skeleton style={{ height: 44 }} />
                <Skeleton style={{ height: 44 }} />
                <Skeleton style={{ height: 44 }} />
                <Skeleton style={{ height: 44 }} />
                <Skeleton style={{ height: 44 }} />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--line, #e2e8f0)",
                  borderRadius: 12,
                  margin: "16px 0",
                  background: "var(--card-subtle, rgba(0,0,0,0.015))",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📂</div>
                <h4 style={{ margin: "0 0 6px 0", color: "var(--ink, #152237)" }}>
                  {searchQuery ? "Không tìm thấy danh mục phù hợp" : "Chưa có danh mục nào trong hệ thống"}
                </h4>
                <p style={{ margin: 0, color: "var(--muted, #64748b)", fontSize: "0.875rem" }}>
                  {searchQuery
                    ? `Thử tìm kiếm với từ khóa khác hoặc nhấn "Xóa tìm kiếm".`
                    : `Bắt đầu bằng việc nhấn nút "+ Thêm danh mục mới" ở góc trên.`}
                </p>
              </div>
            ) : (
              <div className="table-wrap" style={{ overflowX: "auto" }}>
                <table className="cat-tree-table">
                  <thead>
                    <tr style={{ background: "var(--card-subtle, rgba(0,0,0,0.02))", borderBottom: "2px solid var(--line, #e2e8f0)" }}>
                      <th style={{ textAlign: "left", padding: "12px 14px", minWidth: 280 }}>Tên danh mục</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", width: 180 }}>Đường dẫn (Slug)</th>
                      <th style={{ textAlign: "center", padding: "12px 14px", width: 130 }}>Cấp bậc</th>
                      <th style={{ textAlign: "center", padding: "12px 14px", width: 140 }}>Thông số kỹ thuật</th>
                      <th style={{ textAlign: "right", padding: "12px 14px", width: 260 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRootCategories.map((c) => renderCategoryRow(c, 0))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Phân trang (Pagination 20 danh mục gốc / trang) */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--line, #e2e8f0)",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>
                  Hiển thị {(safeCurrentPage - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(safeCurrentPage * PAGE_SIZE, totalRootCategories)} trên tổng số{" "}
                  <b>{totalRootCategories}</b> danh mục gốc
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    className="cat-pagination-btn"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Trang trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`cat-pagination-btn ${safeCurrentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="cat-pagination-btn"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Trang sau →
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: DETAIL - SPECIFICATION MANAGEMENT (SMOOTH TRANSITION) */}
      {/* ========================================================= */}
      {viewMode === "detail" && selectedCategory && (
        <div className="cat-animated-pane">
          {/* Top Bar chuyển đổi: Nút quay lại + Breadcrumb + Nút đóng X */}
          <div className="cat-detail-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Button
                tone="secondary"
                onClick={closeDetailView}
                title="Quay lại danh sách danh mục (hoặc nhấn nút X)"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                ← Quay lại danh sách
              </Button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.88rem",
                  color: "var(--muted, #64748b)",
                }}
              >
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={closeDetailView}
                >
                  Danh mục
                </span>
                {categoryPath.map((item, idx) => (
                  <Fragment key={item.id}>
                    <span>/</span>
                    <span
                      style={{
                        fontWeight: idx === categoryPath.length - 1 ? 600 : 400,
                        color:
                          idx === categoryPath.length - 1
                            ? "var(--ink, #152237)"
                            : "var(--muted, #64748b)",
                        cursor: idx === categoryPath.length - 1 ? "default" : "pointer",
                      }}
                      onClick={() => {
                        if (idx !== categoryPath.length - 1) {
                          choose(item.id);
                        }
                      }}
                    >
                      {item.name}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                onClick={saveChanges}
                disabled={saving || loading}
                tone="primary"
              >
                {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
              </Button>
              <button
                type="button"
                onClick={closeDetailView}
                title="Đóng xem chi tiết (Quay lại danh sách)"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid var(--line, #e2e8f0)",
                  background: "var(--panel, #fff)",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted, #64748b)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--line, #e2e8f0)";
                  e.currentTarget.style.color = "var(--ink, #152237)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--panel, #fff)";
                  e.currentTarget.style.color = "var(--muted, #64748b)";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Dải thông tin tóm tắt danh mục */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--panel, #fff)",
              border: "1px solid var(--line, #e2e8f0)",
              borderRadius: "var(--radius, 12px)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "1.3rem" }}>{selectedCategory.name}</h2>
                {selectedCategory.slug && (
                  <code
                    style={{
                      fontSize: "0.82rem",
                      padding: "2px 8px",
                      background: "rgba(0,0,0,0.05)",
                      borderRadius: 4,
                      color: "var(--muted, #64748b)",
                    }}
                  >
                    /{selectedCategory.slug}
                  </code>
                )}
                <Badge tone="primary">{draft.length} thông số áp dụng</Badge>
              </div>
              {selectedCategory.description && (
                <p style={{ margin: "4px 0 0 0", color: "var(--muted, #64748b)", fontSize: "0.88rem" }}>
                  {selectedCategory.description}
                </p>
              )}
            </div>

            <Button
              size="small"
              tone="secondary"
              onClick={() => openEditCategoryModal(selectedCategory)}
            >
              ✏️ Sửa thông tin danh mục
            </Button>
          </div>

          {/* Cấu hình thông số kỹ thuật chi tiết */}
          <div className="stack" style={{ gap: 16 }}>
            <Panel title={`Cấu hình thông số kỹ thuật (${draft.length})`}>
              {loading ? (
                <div style={{ padding: "32px 0" }}>
                  <Skeleton style={{ height: 48, marginBottom: 8 }} />
                  <Skeleton style={{ height: 48, marginBottom: 8 }} />
                  <Skeleton style={{ height: 48 }} />
                </div>
              ) : draft.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    border: "1px dashed var(--line, #e2e8f0)",
                    borderRadius: 12,
                    margin: "12px 0 24px",
                    background: "var(--card-subtle, rgba(0,0,0,0.02))",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚙️</div>
                  <h4 style={{ margin: "0 0 6px 0", color: "var(--ink, #152237)" }}>
                    Chưa có thông số nào được gán cho danh mục này
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--muted, #64748b)",
                      fontSize: "0.875rem",
                      maxWidth: 460,
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  >
                    Chọn một thông số đã có trong từ điển hệ thống hoặc nhập thông số mới bên dưới để thiết lập bộ lọc và bảng kỹ thuật.
                  </p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tên thông số</th>
                        <th style={{ textAlign: "center" }}>Bộ lọc</th>
                        <th style={{ textAlign: "center" }}>Nổi bật</th>
                        <th style={{ textAlign: "center" }}>Mega menu</th>
                        <th style={{ textAlign: "center" }}>Tương thích</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {draft.map((s, i) => (
                        <tr key={s.specificationId || s.name}>
                          <td>
                            <b>{s.name}</b>
                          </td>
                          {[
                            { key: "filter", label: "Bộ lọc" },
                            { key: "primary", label: "Nổi bật" },
                            { key: "menu", label: "Mega menu" },
                            { key: "compatibility", label: "Tương thích" },
                          ].map(({ key, label }) => (
                            <td key={key} style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={s[key]}
                                aria-label={`${label} ${s.name}`}
                                className={"toggle " + (s[key] ? "" : "off")}
                                onClick={() => toggle(i, key)}
                              />
                            </td>
                          ))}
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="text-button"
                              style={{ color: "var(--danger, #ef4444)" }}
                              onClick={() => removeSpec(i)}
                            >
                              Gỡ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Thêm thông số vào danh mục */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--line, #e2e8f0)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Option 1: Chọn từ từ điển */}
                <div className="stack" style={{ gap: 8 }}>
                  <span className="eyebrow" style={{ fontSize: "0.75rem" }}>
                    CHỌN THÔNG SỐ TỪ TỪ ĐIỂN
                  </span>
                  <div className="row" style={{ gap: 8 }}>
                    <select
                      className="input flex"
                      value={selectedSpecId}
                      onChange={(e) => setSelectedSpecId(e.target.value)}
                      disabled={loading || availableSpecsToAdd.length === 0}
                    >
                      <option value="">
                        {availableSpecsToAdd.length === 0
                          ? "-- Đã thêm tất cả thông số hiện có --"
                          : "-- Chọn thông số có sẵn --"}
                      </option>
                      {availableSpecsToAdd.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      tone="secondary"
                      disabled={!selectedSpecId || loading}
                      onClick={() => addExistingSpec(selectedSpecId)}
                    >
                      + Thêm
                    </Button>
                  </div>
                </div>

                {/* Option 2: Tạo thông số mới */}
                <div className="stack" style={{ gap: 8 }}>
                  <span className="eyebrow" style={{ fontSize: "0.75rem" }}>
                    HOẶC TẠO THÔNG SỐ MỚI
                  </span>
                  <div className="row" style={{ gap: 8 }}>
                    <input
                      className="input flex"
                      aria-label="Tên thông số mới"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="VD: Chuẩn Wi-Fi, Led RGB..."
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createNewSpec();
                        }
                      }}
                    />
                    <Button
                      tone="secondary"
                      disabled={!newName.trim() || loading}
                      onClick={createNewSpec}
                    >
                      + Tạo mới
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Xem trước cách hiển thị */}
            <Panel title="Xem trước cách hiển thị ngoài Storefront & PC Builder">
              <div className="two-col">
                <div>
                  <div className="eyebrow">BỘ LỌC TÌM KIẾM SẢN PHẨM</div>
                  <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                    {draft.filter((s) => s.filter).length === 0 ? (
                      <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem" }}>
                        Chưa có thông số nào được bật làm bộ lọc
                      </span>
                    ) : (
                      draft
                        .filter((s) => s.filter)
                        .map((s) => (
                          <span className="chip" key={s.name}>
                            {s.name}
                          </span>
                        ))
                    )}
                  </div>

                  <div className="eyebrow" style={{ marginTop: 20 }}>
                    QUY TẮC TƯƠNG THÍCH PC BUILDER
                  </div>
                  <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                    {draft.filter((s) => s.compatibility).length === 0 ? (
                      <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem" }}>
                        Chưa cấu hình kiểm tra tương thích cho danh mục này
                      </span>
                    ) : (
                      draft
                        .filter((s) => s.compatibility)
                        .map((s) => (
                          <span
                            className="chip"
                            key={s.name}
                            style={{ borderColor: "var(--accent, #2563eb)" }}
                          >
                            ⚡ {s.name}
                          </span>
                        ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="eyebrow">THÔNG SỐ NỔI BẬT TRÊN THẺ</div>
                  <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                    {draft.filter((s) => s.primary).length === 0 ? (
                      <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem" }}>
                        Chưa có thông số nổi bật
                      </span>
                    ) : (
                      draft
                        .filter((s) => s.primary)
                        .map((s) => (
                          <span className="chip active" key={s.name}>
                            ★ {s.name}
                          </span>
                        ))
                    )}
                  </div>

                  <div className="eyebrow" style={{ marginTop: 20 }}>
                    MEGA MENU DANH MỤC
                  </div>
                  <div style={{ minHeight: 32, marginTop: 8 }}>
                    {draft.filter((s) => s.menu).length === 0 ? (
                      <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem" }}>
                        Chưa đưa thông số nào vào Mega Menu
                      </span>
                    ) : (
                      <div className="chips">
                        {draft
                          .filter((s) => s.menu)
                          .map((s) => (
                            <span
                              className="chip"
                              key={s.name}
                              style={{ background: "rgba(0,0,0,0.04)" }}
                            >
                              {s.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            <Notice tone="neutral">
              💡 <b>Ghi chú:</b> Cấu hình bộ lọc và thông số nổi bật sẽ tự động áp dụng lên trang Danh mục cửa hàng &amp; Công cụ xây dựng cấu hình PC. Sau khi tùy chỉnh, hãy nhấn nút <b>"💾 Lưu thay đổi"</b> ở thanh trên cùng.
            </Notice>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS: CREATE / EDIT CATEGORY & DELETE CONFIRMATION       */}
      {/* ========================================================= */}
      {categoryModalOpen && (
        <Modal
          title={editingCategoryId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          onClose={() => setCategoryModalOpen(false)}
        >
          <div className="stack" style={{ gap: "1rem", minWidth: 320 }}>
            <Field
              label="Tên danh mục *"
              placeholder="VD: Card đồ họa, Tai nghe Gaming..."
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Field
              label="Slug (Đường dẫn tĩnh)"
              placeholder="VD: card-do-hoa (tự động tạo nếu để trống)"
              value={categoryForm.slug}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
            <Select
              label="Danh mục cha (nếu có)"
              value={categoryForm.parentId}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))
              }
              options={[
                { value: "", label: "-- Không có (Danh mục gốc) --" },
                ...flatCategories
                  .filter((c) => !editingCategoryId || c.id !== editingCategoryId)
                  .map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
              ]}
            />
            <Field
              label="Mô tả danh mục"
              placeholder="Mô tả ngắn gọn về sản phẩm thuộc danh mục..."
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem", marginTop: 8 }}>
              <Button
                tone="secondary"
                onClick={() => setCategoryModalOpen(false)}
                disabled={categorySubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                tone="primary"
                onClick={handleSaveCategory}
                disabled={categorySubmitting}
              >
                {categorySubmitting ? "Đang lưu..." : editingCategoryId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirmOpen && categoryToDelete && (
        <Modal
          title="Xác nhận xóa danh mục"
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <div className="stack" style={{ gap: "1rem", minWidth: 320 }}>
            <p>
              Bạn có chắc chắn muốn xóa danh mục <b>"{categoryToDelete.name}"</b>?
            </p>
            <Notice tone="warning">
              ⚠️ Hệ thống sẽ ngăn chặn việc xóa nếu danh mục này đang chứa các sản phẩm liên kết hoặc danh mục con.
            </Notice>
            <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem", marginTop: 8 }}>
              <Button
                tone="secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={categorySubmitting}
              >
                Hủy
              </Button>
              <Button
                tone="danger"
                onClick={handleDeleteCategory}
                disabled={categorySubmitting}
              >
                {categorySubmitting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
