import { useState } from "react";
import { money } from "@/utils";
import { Art, Badge, Button, Notice, Panel, Empty, Modal } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { useProductEditor } from "../hooks/useProductEditor";
import { VariantModal } from "./VariantModal";
import { getCategoryMockImage } from "../constants/mockImages";

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
    previewVariantId,
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
  } = useProductEditor({ product, brands, categories, onBack, onSaved, onRefreshList });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Verification Checklist
  const hasNameAndBrand = Boolean(productForm.name.trim() && productForm.brandId);
  const hasCategory = Boolean(productForm.categoryId);
  const hasVariants = variants.length > 0;
  const canPublish = hasNameAndBrand && hasCategory && hasVariants;

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
            <div className="eyebrow" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
              QUẢN TRỊ / SẢN PHẨM / {isEditing ? `ID: #${product.id}` : "TẠO MỚI"}
            </div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
              {productForm.name || (isEditing ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới")}
            </h2>
          </div>
          <Badge tone={productForm.status === "ACTIVE" ? "success" : "warning"}>
            {productForm.status === "ACTIVE" ? "ĐANG BÁN (ACTIVE)" : "BẢN NHÁP (DRAFT)"}
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
        <div className="stack" style={{ flex: 1, gap: "1.5rem" }}>
          {/* PANEL 1: MASTER PRODUCT DETAILS */}
          <Panel title="Thông tin chung sản phẩm">
            <div className="two-col" style={{ gap: "1rem" }}>
              <Field
                label="Tên sản phẩm *"
                placeholder="VD: Kingston FURY Beast DDR5 16GB"
                value={productForm.name}
                onChange={(e) => updateProduct("name", e.target.value)}
              />
              <Select
                label="Thương hiệu *"
                value={productForm.brandId}
                onChange={(e) => updateProduct("brandId", Number(e.target.value))}
                options={brands.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
              <Select
                label="Danh mục sản phẩm *"
                value={productForm.categoryId}
                onChange={(e) => updateProduct("categoryId", Number(e.target.value))}
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
                    onChange={(e) => updateProduct("description", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>

          {/* PANEL 2: VARIANTS (SKU) MANAGEMENT */}
          <Panel
            title={`Danh sách biến thể (SKU) · ${variants.length} phiên bản`}
            action={
              <Button size="small" onClick={openAddVariantModal}>
                + Thêm biến thể
              </Button>
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
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã SKU</th>
                      <th>Tên phiên bản</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Thông số</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const isSelected = activePreviewVariant?.id === v.id;
                      const specSummary = v.specs
                        ? Object.entries(v.specs)
                            .map(([k, val]) => `${k}: ${val}`)
                            .slice(0, 2)
                            .join(", ")
                        : "";

                      return (
                        <tr
                          key={v.id}
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(217, 31, 49, 0.05)"
                              : undefined,
                          }}
                        >
                          <td>
                            <code className="mono" style={{ fontWeight: 600 }}>
                              {v.serialCode || v.sku}
                            </code>
                          </td>
                          <td>
                            <strong>{v.variantName || v.variant || "Mặc định"}</strong>
                          </td>
                          <td>
                            <strong>{money(Number(v.price))}</strong>
                            {v.originalPrice > v.price && (
                              <div
                                className="small muted"
                                style={{ textDecoration: "line-through", fontSize: "11px" }}
                              >
                                {money(Number(v.originalPrice))}
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge tone={Number(v.stockQuantity ?? v.stock) > 0 ? "success" : "danger"}>
                              {v.stockQuantity ?? v.stock ?? 0} cái
                            </Badge>
                          </td>
                          <td className="small muted">
                            {specSummary || "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="row" style={{ justifyContent: "flex-end", gap: "0.4rem" }}>
                              <Button
                                size="small"
                                tone={isSelected ? "primary" : "secondary"}
                                onClick={() => setPreviewVariantId(v.id)}
                              >
                                {isSelected ? "Đang xem" : "Xem"}
                              </Button>
                              <Button
                                size="small"
                                tone="secondary"
                                onClick={() => openEditVariantModal(v)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                tone="danger"
                                onClick={() => handleDeleteVariant(v.id)}
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

        {/* RIGHT COLUMN: PREVIEW & PUBLISHING STATUS */}
        <aside className="stack" style={{ width: "340px", flexShrink: 0, gap: "1.5rem" }}>
          {/* CARD 1: STOREFRONT PREVIEW */}
          <Panel title="Xem trước trên cửa hàng">
            {(() => {
              const catSlug = categories.find((c) => c.id === productForm.categoryId)?.slug || "ram";
              const previewImg = activePreviewVariant?.imageUrl || activePreviewVariant?.image || getCategoryMockImage(catSlug);
              return (
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <Art
                    type={catSlug}
                    image={previewImg}
                    name={productForm.name}
                  />
                </div>
              );
            })()}
            <div className="eyebrow section" style={{ fontSize: "11px", letterSpacing: "1px" }}>
              {brands.find((b) => b.id === productForm.brandId)?.name || "THƯƠNG HIỆU"}
            </div>
            <h3 style={{ fontSize: "16px", marginTop: "4px" }}>
              {productForm.name || "Tên sản phẩm"}
            </h3>
            <p className="muted small" style={{ marginTop: "4px" }}>
              {activePreviewVariant
                ? activePreviewVariant.variantName || activePreviewVariant.variant
                : "Chưa chọn phiên bản"}
            </p>
            <div className="price section" style={{ fontSize: "20px", fontWeight: 700, margin: "0.75rem 0" }}>
              {money(Number(activePreviewVariant?.price || 0))}
            </div>
            <div className="row" style={{ gap: "0.5rem" }}>
              <Badge tone={productForm.status === "ACTIVE" ? "success" : "warning"}>
                {productForm.status === "ACTIVE" ? "Đang bán" : "Bản nháp"}
              </Badge>
              {activePreviewVariant && (
                <Badge
                  tone={
                    Number(activePreviewVariant.stockQuantity ?? activePreviewVariant.stock) > 0
                      ? "success"
                      : "danger"
                  }
                >
                  Tồn kho: {activePreviewVariant.stockQuantity ?? activePreviewVariant.stock ?? 0}
                </Badge>
              )}
            </div>
          </Panel>

          {/* CARD 2: PUBLISHING CHECKLIST */}
          <Panel title="Điều kiện xuất bản">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", lineHeight: "1.8" }}>
              <li style={{ color: hasNameAndBrand ? "var(--green, #148465)" : "var(--muted)" }}>
                {hasNameAndBrand ? "✓" : "○"} Tên sản phẩm & thương hiệu
              </li>
              <li style={{ color: hasCategory ? "var(--green, #148465)" : "var(--muted)" }}>
                {hasCategory ? "✓" : "○"} Đã chọn danh mục hợp lệ
              </li>
              <li style={{ color: hasVariants ? "var(--green, #148465)" : "var(--muted)" }}>
                {hasVariants ? "✓" : "○"} Ít nhất 1 biến thể SKU có giá
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
          variant={editingVariant}
          onSave={handleSaveVariant}
          onClose={closeVariantModal}
        />
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
              <strong>'{productForm.name}'</strong> (kèm tất cả các biến thể SKU)?
            </p>
            <Notice tone="danger">
              Hành động này không thể hoàn tác. Nếu sản phẩm đã phát sinh trong đơn hàng của khách hàng, hệ thống sẽ chặn xóa để bảo toàn lịch sử giao dịch.
            </Notice>
            <div className="row" style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="secondary" onClick={() => setConfirmDeleteOpen(false)}>
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
