import { useState, useMemo } from "react";
import { money } from "@/utils";
import {
  Art,
  Badge,
  Button,
  Notice,
  Panel,
  Empty,
  Modal,
} from "@/components/ui";
import { Field, Select } from "@/components/form";
import { useProductEditor } from "../hooks/useProductEditor";
import { VariantModal } from "./VariantModal";
import { getCategoryMockImage } from "../constants/mockImages";

// Helper to format specification key into human-friendly Vietnamese label
function formatSpecKey(key) {
  if (!key) return "";
  const map = {
    Form_Factor: "Kích thước / Form Factor",
    Capacity_GB: "Dung lượng",
    Memory_Speed: "Tốc độ bộ nhớ",
    Socket_Type: "Chuẩn Socket",
    Bus_Speed: "Tốc độ Bus",
    Interface: "Chuẩn giao tiếp",
    Read_Speed: "Tốc độ đọc",
    Write_Speed: "Tốc độ ghi",
    Color: "Màu sắc",
    TDP: "Công suất TDP",
    Wattage: "Công suất",
    Warranty: "Bảo hành",
  };
  if (map[key]) return map[key];
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to format specification values cleanly (e.g. 1000 -> 1TB)
function formatSpecValue(key, val) {
  if (val === null || val === undefined) return "—";
  const s = String(val).trim();
  if (key === "Capacity_GB" && !isNaN(val)) {
    const num = Number(val);
    if (num >= 1000) return `${num / 1000} TB (${num} GB)`;
    return `${num} GB`;
  }
  return s;
}

export function ProductEditor({
  product,
  brands = [],
  categories = [],
  onBack,
  onSaved,
  onRefreshList,
}) {
  const {
    isEditing,
    productForm,
    updateProduct,
    variants,
    activePreviewVariant,
    setPreviewVariantId,
    modalOpen,
    editingVariant,
    openAddVariantModal,
    openEditVariantModal,
    closeVariantModal,
    handleSaveVariant,
    handleDeleteVariant,
    handleSaveProduct,
    handleDeleteProduct,
    submitting,
  } = useProductEditor({
    product,
    brands,
    categories,
    onBack,
    onSaved,
    onRefreshList,
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  const handleCopySku = (sku, e) => {
    if (e) e.stopPropagation();
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Verification Checklist
  const hasNameAndBrand = Boolean(
    productForm.name.trim() && productForm.brandId,
  );
  const hasCategory = Boolean(productForm.categoryId);
  const hasVariants = variants.length > 0;
  const canPublish = hasNameAndBrand && hasCategory && hasVariants;

  // Variant Statistics Summary
  const variantStats = useMemo(() => {
    const total = variants.length;
    const totalStock = variants.reduce(
      (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
      0,
    );
    const prices = variants
      .map((v) => Number(v.price))
      .filter((pr) => pr > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return { total, totalStock, minPrice, maxPrice };
  }, [variants]);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      {/* TOP HEADER & BREADCRUMB */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--line, #e2e7ed)",
        }}
      >
        <div className="row" style={{ alignItems: "center", gap: "1rem" }}>
          <Button tone="secondary" size="small" onClick={onBack}>
            ← Quay lại danh sách
          </Button>
          <div>
            <div
              className="eyebrow"
              style={{ fontSize: "11px", letterSpacing: "0.5px" }}
            >
              QUẢN TRỊ / SẢN PHẨM /{" "}
              {isEditing ? `ID: #${product.id}` : "TẠO MỚI"}
            </div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
              {productForm.name ||
                (isEditing ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới")}
            </h2>
          </div>
          <Badge tone={productForm.status === "ACTIVE" ? "success" : "warning"}>
            {productForm.status === "ACTIVE"
              ? "ĐANG BÁN (ACTIVE)"
              : "BẢN NHÁP (DRAFT)"}
          </Badge>
        </div>

        <div className="row" style={{ gap: "0.75rem" }}>
          {isEditing && (
            <Button
              tone="danger"
              size="small"
              disabled={submitting}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Xóa sản phẩm
            </Button>
          )}
          <Button
            tone="secondary"
            disabled={submitting}
            onClick={() => handleSaveProduct("DRAFT")}
          >
            {submitting ? "Đang lưu..." : "Lưu nháp"}
          </Button>
          <Button
            tone="primary"
            disabled={submitting || (!canPublish && !isEditing)}
            onClick={() => handleSaveProduct("ACTIVE")}
          >
            {submitting ? "Đang xử lý..." : "Đăng bán sản phẩm (Publish)"}
          </Button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT */}
      <div className="split" style={{ alignItems: "flex-start" }}>
        {/* LEFT COLUMN: MASTER INFO & VARIANTS TABLE */}
        <div className="stack" style={{ flex: 1, minWidth: 0, gap: "1.5rem" }}>
          {/* PANEL 1: MASTER PRODUCT DETAILS */}
          <Panel title="Thông tin chung sản phẩm">
            <div className="two-col" style={{ gap: "1rem" }}>
              <Field
                label="Tên sản phẩm *"
                placeholder="VD: Kingston NV2 PCIe 4.0 NVMe SSD"
                value={productForm.name}
                onChange={(e) => updateProduct("name", e.target.value)}
              />
              <Select
                label="Thương hiệu *"
                value={productForm.brandId}
                onChange={(e) =>
                  updateProduct("brandId", Number(e.target.value))
                }
                options={brands.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
              <Select
                label="Danh mục sản phẩm *"
                value={productForm.categoryId}
                onChange={(e) =>
                  updateProduct("categoryId", Number(e.target.value))
                }
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <Field
                label="Thời hạn bảo hành (tháng) *"
                type="number"
                min="0"
                value={productForm.warranty}
                onChange={(e) => updateProduct("warranty", e.target.value)}
              />
            </div>
            <div className="section" style={{ marginTop: "1rem" }}>
              <Field label="Mô tả sản phẩm">
                {(id) => (
                  <textarea
                    id={id}
                    className="input full"
                    rows="3"
                    placeholder="Mô tả chi tiết về sản phẩm, tính năng nổi bật..."
                    value={productForm.description || ""}
                    onChange={(e) =>
                      updateProduct("description", e.target.value)
                    }
                  />
                )}
              </Field>
            </div>
          </Panel>

          {/* PANEL 2: REFINED VARIANTS (SKU) MANAGEMENT TABLE */}
          <Panel
            title={`Danh sách biến thể (SKU) · ${variants.length} phiên bản`}
            action={
              <div
                className="row"
                style={{ alignItems: "center", gap: "0.75rem" }}
              >
                {variants.length > 0 && (
                  <span
                    className="small muted"
                    style={{ fontSize: "12px", fontWeight: 500 }}
                  >
                    Tổng tồn kho:{" "}
                    <strong style={{ color: "var(--ink)" }}>
                      {variantStats.totalStock} cái
                    </strong>
                  </span>
                )}
                <Button
                  size="small"
                  tone="primary"
                  onClick={openAddVariantModal}
                >
                  + Thêm biến thể
                </Button>
              </div>
            }
          >
            {variants.length === 0 ? (
              <Empty
                title="Chưa có phiên bản nào"
                sub="Sản phẩm cần có ít nhất một phiên bản (SKU) với giá bán và tồn kho để đăng bán lên cửa hàng."
                action={
                  <Button size="small" onClick={openAddVariantModal}>
                    + Tạo phiên bản đầu tiên
                  </Button>
                }
              />
            ) : (
              <div className="variant-table-container">
                <table className="variant-editor-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35px", textAlign: "center" }}>#</th>
                      <th style={{ width: "140px" }}>Mã SKU</th>
                      <th>Tên phiên bản</th>
                      <th style={{ width: "125px" }}>Giá bán</th>
                      <th style={{ width: "105px" }}>Tồn kho</th>
                      <th>Thông số chính</th>
                      <th style={{ width: "115px", textAlign: "right" }}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, index) => {
                      const isSelected = activePreviewVariant?.id === v.id;
                      const stockNum = Number(
                        v.stockQuantity ?? v.stock ?? 0,
                      );
                      const skuCode =
                        v.serialCode || v.sku || `SKU-${v.id}`;
                      const specsEntries = Object.entries(v.specs || {});

                      return (
                        <tr
                          key={v.id}
                          className={isSelected ? "is-selected" : ""}
                          onClick={() => setPreviewVariantId(v.id)}
                          title="Bấm vào hàng để xem chi tiết biến thể ở bảng bên phải"
                        >
                          {/* 1. SELECTION INDICATOR */}
                          <td
                            style={{
                              textAlign: "center",
                              color: "var(--muted)",
                            }}
                          >
                            {isSelected ? (
                              <span
                                style={{
                                  color: "var(--red, #d91f31)",
                                  fontSize: "14px",
                                }}
                                title="Đang xem phiên bản này"
                              >
                                ●
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px" }}>
                                {index + 1}
                              </span>
                            )}
                          </td>

                          {/* 2. SKU CODE WITH ONE-CLICK COPY */}
                          <td>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <code
                                className="mono"
                                style={{
                                  fontWeight: 650,
                                  background: isSelected
                                    ? "rgba(217, 31, 49, 0.08)"
                                    : "#f1f5f9",
                                  color: isSelected
                                    ? "var(--red, #d91f31)"
                                    : "inherit",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {skuCode}
                              </code>
                              <button
                                type="button"
                                className="text-button"
                                title="Sao chép mã SKU"
                                style={{
                                  fontSize: "10px",
                                  color:
                                    copiedSku === skuCode
                                      ? "var(--green, #148465)"
                                      : "var(--muted)",
                                  padding: "2px",
                                }}
                                onClick={(e) => handleCopySku(skuCode, e)}
                              >
                                {copiedSku === skuCode ? "✓" : "Copy"}
                              </button>
                            </div>
                          </td>

                          {/* 3. VARIANT NAME */}
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <strong
                                style={{
                                  color: isSelected
                                    ? "var(--red, #d91f31)"
                                    : "var(--ink)",
                                  fontSize: "13.5px",
                                  lineHeight: "1.35",
                                }}
                              >
                                {v.variantName ||
                                  v.variant ||
                                  "Phiên bản tiêu chuẩn"}
                              </strong>
                              {isSelected && (
                                <span
                                  className="small"
                                  style={{
                                    color: "var(--red, #d91f31)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Đang hiển thị chi tiết bên phải →
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. PRICE */}
                          <td>
                            <strong
                              style={{
                                fontSize: "13.5px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {money(Number(v.price))}
                            </strong>
                            {v.originalPrice > v.price && (
                              <div
                                className="small muted"
                                style={{
                                  textDecoration: "line-through",
                                  fontSize: "11px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {money(Number(v.originalPrice))}
                              </div>
                            )}
                          </td>

                          {/* 5. INVENTORY STOCK */}
                          <td>
                            <Badge
                              tone={
                                stockNum > 10
                                  ? "success"
                                  : stockNum > 0
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {stockNum > 10
                                ? `${stockNum} cái`
                                : stockNum > 0
                                  ? `${stockNum} (sắp hết)`
                                  : "Hết hàng"}
                            </Badge>
                          </td>

                          {/* 6. CLEAN FORMATTED SPEC CHIPS */}
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              {specsEntries.slice(0, 2).map(([k, val]) => (
                                <span key={k} className="spec-pill-tag">
                                  {formatSpecValue(k, val)}
                                </span>
                              ))}
                              {specsEntries.length > 2 && (
                                <span
                                  className="small muted"
                                  style={{
                                    fontSize: "11px",
                                    alignSelf: "center",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={specsEntries
                                    .slice(2)
                                    .map(
                                      ([k, val]) =>
                                        `${formatSpecKey(k)}: ${formatSpecValue(k, val)}`,
                                    )
                                    .join(", ")}
                                >
                                  +{specsEntries.length - 2}
                                </span>
                              )}
                              {specsEntries.length === 0 && (
                                <span className="small muted">—</span>
                              )}
                            </div>
                          </td>

                          {/* 7. ROW ACTIONS */}
                          <td
                            style={{ textAlign: "right" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              className="row"
                              style={{
                                justifyContent: "flex-end",
                                gap: "0.35rem",
                              }}
                            >
                              <Button
                                size="small"
                                tone="secondary"
                                onClick={() => openEditVariantModal(v)}
                                title="Chỉnh sửa biến thể này"
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                tone="danger"
                                onClick={() => setVariantToDelete(v)}
                                title="Xóa biến thể này"
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
        </div>

        {/* RIGHT COLUMN: REFINED VARIANT INSPECTOR & PUBLISHING STATUS */}
        <aside
          className="stack"
          style={{ width: "350px", flexShrink: 0, gap: "1.25rem" }}
        >
          {/* CARD 1: LIVE VARIANT INSPECTOR */}
          <div className="variant-inspector-panel">
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--line, #e2e7ed)",
                paddingBottom: "0.75rem",
              }}
            >
              <div>
                <div
                  className="eyebrow"
                  style={{
                    fontSize: "10.5px",
                    letterSpacing: "0.5px",
                    color: "var(--red, #d91f31)",
                  }}
                >
                  CHI TIẾT BIẾN THỂ SKU
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    marginTop: "2px",
                  }}
                >
                  {activePreviewVariant
                    ? `SKU #${activePreviewVariant.id}`
                    : "Chưa chọn phiên bản"}
                </div>
              </div>
              {activePreviewVariant && (
                <Button
                  size="small"
                  tone="secondary"
                  onClick={() => openEditVariantModal(activePreviewVariant)}
                  title="Chỉnh sửa biến thể đang xem"
                >
                  ✎ Sửa SKU
                </Button>
              )}
            </div>

            {/* Quick Switcher Tabs (if more than 1 variant) */}
            {variants.length > 1 && (
              <div>
                <div
                  className="small muted"
                  style={{
                    fontSize: "11px",
                    marginBottom: "5px",
                    fontWeight: 650,
                  }}
                >
                  CHUYỂN NHANH BIẾN THỂ:
                </div>
                <div className="variant-mini-switcher">
                  {variants.map((v) => {
                    const isCur = activePreviewVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`variant-mini-chip ${isCur ? "active" : ""}`}
                        onClick={() => setPreviewVariantId(v.id)}
                        title={`Xem chi tiết ${v.variantName || v.serialCode}`}
                      >
                        {v.variantName || v.variant || v.serialCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visual Image & Brand */}
            {(() => {
              const catSlug =
                categories.find((c) => c.id === productForm.categoryId)?.slug ||
                "ram";
              const previewImg =
                activePreviewVariant?.imageUrl ||
                activePreviewVariant?.image ||
                getCategoryMockImage(catSlug);
              return (
                <div
                  style={{
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "1rem",
                    position: "relative",
                  }}
                >
                  <Art
                    type={catSlug}
                    image={previewImg}
                    name={productForm.name}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {brands.find((b) => b.id === productForm.brandId)?.name ||
                      "HARDWARE"}
                  </div>
                </div>
              );
            })()}

            {/* Variant Identification & SKU */}
            <div>
              <h4
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: "1.35",
                }}
              >
                {activePreviewVariant?.variantName ||
                  activePreviewVariant?.variant ||
                  productForm.name}
              </h4>
              <div
                className="small muted"
                style={{ fontSize: "12px", marginBottom: "8px" }}
              >
                Sản phẩm gốc:{" "}
                <strong>{productForm.name || "Chưa đặt tên"}</strong>
              </div>

              {/* SKU Pill with Copy button */}
              {activePreviewVariant && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <span className="muted" style={{ fontSize: "11px" }}>
                    Mã SKU:
                  </span>
                  <code className="mono" style={{ fontWeight: 700 }}>
                    {activePreviewVariant.serialCode ||
                      activePreviewVariant.sku}
                  </code>
                  <button
                    type="button"
                    className="text-button"
                    style={{
                      fontSize: "11px",
                      color:
                        copiedSku ===
                        (activePreviewVariant.serialCode ||
                          activePreviewVariant.sku)
                          ? "var(--green, #148465)"
                          : "var(--focus)",
                      padding: "0 2px",
                      cursor: "pointer",
                    }}
                    onClick={(e) =>
                      handleCopySku(
                        activePreviewVariant.serialCode ||
                          activePreviewVariant.sku,
                        e,
                      )
                    }
                  >
                    {copiedSku ===
                    (activePreviewVariant.serialCode ||
                      activePreviewVariant.sku)
                      ? "✓ Đã chép"
                      : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Card */}
            {activePreviewVariant && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <span
                      className="small muted"
                      style={{
                        fontSize: "10.5px",
                        letterSpacing: "0.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      GIÁ BÁN HIỆN TẠI
                    </span>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 750,
                        color: "var(--ink)",
                        marginTop: "2px",
                      }}
                    >
                      {money(Number(activePreviewVariant.price || 0))}
                    </div>
                  </div>
                  {activePreviewVariant.originalPrice >
                    activePreviewVariant.price && (
                    <div style={{ textAlign: "right" }}>
                      <span
                        className="small muted"
                        style={{
                          textDecoration: "line-through",
                          fontSize: "11.5px",
                        }}
                      >
                        {money(Number(activePreviewVariant.originalPrice))}
                      </span>
                      <div
                        style={{
                          color: "var(--green, #148465)",
                          fontWeight: 700,
                          fontSize: "11px",
                        }}
                      >
                        Tiết kiệm{" "}
                        {Math.round(
                          ((activePreviewVariant.originalPrice -
                            activePreviewVariant.price) /
                            activePreviewVariant.originalPrice) *
                            100,
                        )}
                        %
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Health */}
            {activePreviewVariant &&
              (() => {
                const stockNum = Number(
                  activePreviewVariant.stockQuantity ??
                    activePreviewVariant.stock ??
                    0,
                );
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="small muted"
                        style={{ fontSize: "11.5px", fontWeight: 700 }}
                      >
                        TỒN KHO THỰC TẾ:
                      </span>
                      <Badge
                        tone={
                          stockNum > 10
                            ? "success"
                            : stockNum > 0
                              ? "warning"
                              : "danger"
                        }
                      >
                        {stockNum > 10
                          ? `Còn ${stockNum} cái (Tốt)`
                          : stockNum > 0
                            ? `Còn ${stockNum} cái (Sắp hết)`
                            : "Hết hàng"}
                      </Badge>
                    </div>
                    {/* Visual Progress Meter */}
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "#e2e8f0",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Math.max(6, (stockNum / 60) * 100))}%`,
                          background:
                            stockNum > 10
                              ? "var(--green, #148465)"
                              : stockNum > 0
                                ? "#f59e0b"
                                : "var(--red, #d91f31)",
                          borderRadius: "999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

            {/* Full Specifications Inspector */}
            {activePreviewVariant && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    className="small"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Thông số kỹ thuật SKU
                  </span>
                  <span className="small muted" style={{ fontSize: "11px" }}>
                    {Object.keys(activePreviewVariant.specs || {}).length} thông
                    số
                  </span>
                </div>

                {Object.keys(activePreviewVariant.specs || {}).length === 0 ? (
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    Chưa nhập thông số chi tiết cho biến thể này.
                  </div>
                ) : (
                  <div className="variant-specs-grid">
                    {Object.entries(activePreviewVariant.specs || {}).map(
                      ([k, val]) => (
                        <div key={k} className="variant-spec-row">
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: "12px",
                            }}
                          >
                            {formatSpecKey(k)}
                          </span>
                          <strong
                            style={{
                              color: "var(--ink)",
                              fontSize: "12px",
                              textAlign: "right",
                            }}
                          >
                            {formatSpecValue(k, val)}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: PUBLISHING CHECKLIST */}
          <Panel title="Điều kiện xuất bản">
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.8",
              }}
            >
              <li
                style={{
                  color: hasNameAndBrand
                    ? "var(--green, #148465)"
                    : "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{hasNameAndBrand ? "✓" : "○"}</span>
                <span>Tên sản phẩm & thương hiệu</span>
              </li>
              <li
                style={{
                  color: hasCategory
                    ? "var(--green, #148465)"
                    : "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{hasCategory ? "✓" : "○"}</span>
                <span>Đã chọn danh mục hợp lệ</span>
              </li>
              <li
                style={{
                  color: hasVariants
                    ? "var(--green, #148465)"
                    : "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{hasVariants ? "✓" : "○"}</span>
                <span>Ít nhất 1 biến thể SKU có giá</span>
              </li>
            </ul>
            <div style={{ marginTop: "1rem" }}>
              <Notice tone={canPublish ? "success" : "neutral"}>
                {canPublish
                  ? "Sản phẩm đủ điều kiện mở bán trên toàn hệ thống."
                  : "Vui lòng hoàn thành các tiêu chí trên trước khi Đăng bán."}
              </Notice>
            </div>
          </Panel>
        </aside>
      </div>

      {/* VARIANT ADD / EDIT MODAL */}
      {modalOpen && (
        <VariantModal
          key={editingVariant?.id || "new"}
          variant={editingVariant}
          requiredSpecs={(
            categories.find((c) => c.id === Number(productForm.categoryId))
              ?.specifications || []
          )
            .filter((s) => s.isPrimary)
            .map((s) => s.specificationName)}
          onSave={handleSaveVariant}
          onClose={closeVariantModal}
        />
      )}

      {/* CONFIRM DELETE VARIANT MODAL */}
      {variantToDelete && (
        <Modal
          title="Xác nhận xóa biến thể SKU"
          onClose={() => setVariantToDelete(null)}
        >
          <div className="stack" style={{ gap: "1rem" }}>
            <p>
              Bạn có chắc chắn muốn xóa biến thể{" "}
              <strong>
                '{variantToDelete.variantName || variantToDelete.serialCode}'
              </strong>{" "}
              (Mã SKU: <code>{variantToDelete.serialCode}</code>)?
            </p>
            <Notice tone="danger">
              Hành động này sẽ xóa phiên bản khỏi cơ sở dữ liệu. Hãy đảm bảo phiên
              bản này chưa phát sinh giao dịch trong đơn hàng.
            </Notice>
            <div
              className="row"
              style={{ justifyContent: "flex-end", gap: "0.75rem" }}
            >
              <Button
                tone="secondary"
                onClick={() => setVariantToDelete(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                tone="danger"
                disabled={isDeletingVariant}
                onClick={async () => {
                  try {
                    setIsDeletingVariant(true);
                    await handleDeleteVariant(variantToDelete.id);
                    setVariantToDelete(null);
                  } finally {
                    setIsDeletingVariant(false);
                  }
                }}
              >
                {isDeletingVariant ? "Đang xóa..." : "Xác nhận xóa biến thể"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {confirmDeleteOpen && (
        <Modal
          title="Xác nhận xóa sản phẩm"
          onClose={() => setConfirmDeleteOpen(false)}
        >
          <div className="stack" style={{ gap: "1rem" }}>
            <p>
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <strong>'{productForm.name}'</strong> (kèm tất cả các biến thể
              SKU)?
            </p>
            <Notice tone="danger">
              Hành động này không thể hoàn tác. Nếu sản phẩm đã phát sinh trong
              đơn hàng của khách hàng, hệ thống sẽ chặn xóa để bảo toàn lịch sử
              giao dịch.
            </Notice>
            <div
              className="row"
              style={{ justifyContent: "flex-end", gap: "0.75rem" }}
            >
              <Button
                tone="secondary"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                tone="danger"
                disabled={submitting}
                onClick={async () => {
                  setConfirmDeleteOpen(false);
                  await handleDeleteProduct();
                }}
              >
                {submitting ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
