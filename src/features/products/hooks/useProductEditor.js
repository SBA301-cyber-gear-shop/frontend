import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";

export function useProductEditor({ product, brands = [], categories = [], onBack, onSaved }) {
  const { notify } = useStore();

  const isEditing = Boolean(product && product.id);

  // Master product form
  const [productForm, setProductForm] = useState({
    name: "",
    brandId: brands[0]?.id || 1,
    categoryId: categories[0]?.id || 1,
    warranty: 12,
    description: "",
    status: "DRAFT",
  });

  // Variants state
  const [variants, setVariants] = useState([]);
  const [previewVariantId, setPreviewVariantId] = useState(null);

  // Variant Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Loading / Submitting flags
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form when product changes
  useEffect(() => {
    if (product) {
      setProductForm({
        name: product.name || "",
        brandId: product.brandId || brands[0]?.id || 1,
        categoryId: product.categoryId || categories[0]?.id || 1,
        warranty: product.warrantyPeriodMonths || 12,
        description: product.description || "",
        status: (product.status || "DRAFT").toUpperCase(),
      });

      const initialVariants = (product.variants || []).map((v) => ({
        id: v.id,
        serialCode: v.serialCode,
        sku: v.serialCode,
        variantName: v.variantName || v.serialCode,
        variant: v.variantName || v.serialCode,
        slug: v.slug,
        price: Number(v.price),
        originalPrice: Number(v.originalPrice || 0),
        stockQuantity: Number(v.stockQuantity),
        stock: Number(v.stockQuantity),
        imageUrl: v.imageUrl || "",
        image: v.imageUrl || "",
        attributes: v.attributes || [],
        specs: (v.attributes || []).reduce((acc, a) => {
          acc[a.specificationName] = a.value;
          return acc;
        }, {}),
      }));

      setVariants(initialVariants);
      if (initialVariants.length > 0) {
        setPreviewVariantId(initialVariants[0].id);
      } else {
        setPreviewVariantId(null);
      }
    } else {
      // Create new mode
      setProductForm({
        name: "",
        brandId: brands[0]?.id || 1,
        categoryId: categories[0]?.id || 1,
        warranty: 24,
        description: "",
        status: "DRAFT",
      });
      setVariants([]);
      setPreviewVariantId(null);
    }
  }, [product, brands, categories]);

  // Update a single field in the master product form
  const updateProduct = (key, value) => {
    setProductForm((prev) => ({ ...prev, [key]: value }));
  };

  // Currently active variant for the live preview card
  const activePreviewVariant = useMemo(() => {
    if (variants.length === 0) return null;
    if (previewVariantId) {
      const found = variants.find((v) => v.id === previewVariantId);
      if (found) return found;
    }
    return variants[0];
  }, [variants, previewVariantId]);

  // Variant Modal Handlers
  const openAddVariantModal = () => {
    setEditingVariant(null);
    setModalOpen(true);
  };

  const openEditVariantModal = (v) => {
    setEditingVariant(v);
    setModalOpen(true);
  };

  const closeVariantModal = () => {
    setEditingVariant(null);
    setModalOpen(false);
  };

  // Save Variant (supports both Real API on existing product and In-Memory Draft for new product)
  const handleSaveVariant = async (variantData) => {
    try {
      if (isEditing) {
        // Real Backend Variant CRUD
        const payload = {
          serialCode: variantData.serialCode.trim(),
          variantName: variantData.variantName?.trim() || variantData.serialCode.trim(),
          slug: variantData.slug?.trim() || undefined,
          price: Number(variantData.price),
          originalPrice: variantData.originalPrice ? Number(variantData.originalPrice) : null,
          stockQuantity: Number(variantData.stockQuantity || 0),
          imageUrl: variantData.imageUrl?.trim() || undefined,
        };

        if (editingVariant && typeof editingVariant.id === "number") {
          // Update existing variant via API
          await productApi.updateVariant(product.id, editingVariant.id, payload);
          notify("Đã cập nhật biến thể thành công trên cơ sở dữ liệu.");
        } else {
          // Add new variant to existing product via API
          await productApi.addVariant(product.id, payload);
          notify("Đã thêm biến thể mới thành công vào cơ sở dữ liệu.");
        }

        // Re-fetch updated product with variants
        const refreshed = await productApi.getAdminProductById(product.id);
        const mapped = (refreshed.variants || []).map((v) => ({
          id: v.id,
          serialCode: v.serialCode,
          sku: v.serialCode,
          variantName: v.variantName,
          variant: v.variantName,
          slug: v.slug,
          price: Number(v.price),
          originalPrice: Number(v.originalPrice || 0),
          stockQuantity: Number(v.stockQuantity),
          stock: Number(v.stockQuantity),
          imageUrl: v.imageUrl || "",
          image: v.imageUrl || "",
          attributes: v.attributes || [],
          specs: (v.attributes || []).reduce((acc, a) => {
            acc[a.specificationName] = a.value;
            return acc;
          }, {}),
        }));
        setVariants(mapped);
      } else {
        // In-memory drafting for new product
        const targetId = editingVariant ? editingVariant.id : `draft-var-${Date.now()}`;
        const newRecord = {
          id: targetId,
          serialCode: variantData.serialCode.trim(),
          sku: variantData.serialCode.trim(),
          variantName: variantData.variantName?.trim() || variantData.serialCode.trim(),
          variant: variantData.variantName?.trim() || variantData.serialCode.trim(),
          slug: variantData.slug?.trim() || "",
          price: Number(variantData.price),
          originalPrice: Number(variantData.originalPrice || 0),
          stockQuantity: Number(variantData.stockQuantity || 0),
          stock: Number(variantData.stockQuantity || 0),
          imageUrl: variantData.imageUrl?.trim() || "",
          image: variantData.imageUrl?.trim() || "",
          specs: variantData.specs || {},
        };

        if (editingVariant) {
          setVariants((prev) => prev.map((v) => (v.id === targetId ? newRecord : v)));
          notify("Đã cập nhật bản nháp biến thể.");
        } else {
          setVariants((prev) => [...prev, newRecord]);
          notify("Đã thêm biến thể mới vào danh sách.");
        }

        if (!previewVariantId) {
          setPreviewVariantId(targetId);
        }
      }

      closeVariantModal();
    } catch (e) {
      notify(e.message || "Lỗi khi lưu biến thể.", "danger");
      throw e;
    }
  };

  // Delete Variant
  const handleDeleteVariant = async (variantId) => {
    try {
      if (isEditing && typeof variantId === "number") {
        await productApi.deleteVariant(product.id, variantId);
        notify("Đã xóa biến thể khỏi cơ sở dữ liệu.");
        // Re-fetch
        const refreshed = await productApi.getAdminProductById(product.id);
        const mapped = (refreshed.variants || []).map((v) => ({
          id: v.id,
          serialCode: v.serialCode,
          sku: v.serialCode,
          variantName: v.variantName,
          variant: v.variantName,
          slug: v.slug,
          price: Number(v.price),
          originalPrice: Number(v.originalPrice || 0),
          stockQuantity: Number(v.stockQuantity),
          stock: Number(v.stockQuantity),
          imageUrl: v.imageUrl || "",
          image: v.imageUrl || "",
          attributes: v.attributes || [],
          specs: (v.attributes || []).reduce((acc, a) => {
            acc[a.specificationName] = a.value;
            return acc;
          }, {}),
        }));
        setVariants(mapped);
      } else {
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        notify("Đã xóa biến thể khỏi danh sách.");
      }

      if (previewVariantId === variantId) {
        setPreviewVariantId(null);
      }
    } catch (e) {
      notify(e.message || "Không thể xóa biến thể.", "danger");
    }
  };

  // Save Product Master (Draft or Publish)
  const handleSaveProduct = async (targetStatus = "DRAFT") => {
    try {
      if (!productForm.name.trim()) {
        throw new Error("Vui lòng nhập Tên sản phẩm.");
      }
      if (!productForm.brandId) {
        throw new Error("Vui lòng chọn Thương hiệu.");
      }
      if (!productForm.categoryId) {
        throw new Error("Vui lòng chọn Danh mục.");
      }

      if (targetStatus === "ACTIVE" && variants.length === 0) {
        throw new Error("Sản phẩm phải có ít nhất 1 biến thể SKU hợp lệ để đăng bán.");
      }

      setSubmitting(true);

      if (isEditing) {
        // UPDATE EXISTING PRODUCT
        const updatePayload = {
          name: productForm.name.trim(),
          brandId: Number(productForm.brandId),
          categoryId: Number(productForm.categoryId),
          warrantyPeriodMonths: Number(productForm.warranty) || 12,
          description: productForm.description || "",
          status: targetStatus,
        };

        await productApi.updateProduct(product.id, updatePayload);

        if (targetStatus === "ACTIVE" && product.status !== "ACTIVE") {
          await productApi.publishProduct(product.id);
        }

        setProductForm((prev) => ({ ...prev, status: targetStatus }));
        notify(
          targetStatus === "ACTIVE"
            ? "Đã cập nhật và Đăng bán sản phẩm thành công trên hệ thống!"
            : "Đã cập nhật thông tin sản phẩm (Bản nháp)."
        );

        if (onSaved) {
          onSaved();
        }
      } else {
        // CREATE NEW PRODUCT
        const preparedVariants = variants.map((v) => ({
          serialCode: v.serialCode.trim(),
          variantName: v.variantName?.trim() || v.serialCode.trim(),
          slug: v.slug?.trim() || undefined,
          price: Number(v.price),
          originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
          stockQuantity: Number(v.stockQuantity || 0),
          imageUrl: v.imageUrl?.trim() || undefined,
        }));

        const createPayload = {
          name: productForm.name.trim(),
          brandId: Number(productForm.brandId),
          categoryId: Number(productForm.categoryId),
          warrantyPeriodMonths: Number(productForm.warranty) || 12,
          description: productForm.description || "",
          variants: preparedVariants.length > 0 ? preparedVariants : undefined,
        };

        const createdProd = await productApi.createProductDraft(createPayload);

        if (targetStatus === "ACTIVE" && preparedVariants.length > 0) {
          await productApi.publishProduct(createdProd.id);
        }

        notify(
          targetStatus === "ACTIVE"
            ? "Đã tạo mới và Đăng bán sản phẩm thành công!"
            : "Đã tạo sản phẩm mới dưới dạng Bản nháp."
        );

        if (onSaved) {
          onSaved(createdProd);
        }
      }
    } catch (e) {
      notify(e.message || "Lỗi khi lưu sản phẩm.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!isEditing) return;
    try {
      setSubmitting(true);
      await productApi.deleteProduct(product.id);
      notify(`Đã xóa sản phẩm '${product.name}' thành công.`);
      if (onBack) {
        onBack();
      }
    } catch (e) {
      notify(e.message || "Không thể xóa sản phẩm.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
