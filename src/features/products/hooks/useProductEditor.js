import { useState, useMemo } from "react";
import { useStore } from "@/store";

export function useProductEditor({ product, onCreated }) {
  const { data, commit, notify } = useStore();

  const [currentProductId] = useState(() => {
    return product?.productId || product?.id || "prod-" + Date.now();
  });

  // Master product info
  const [productForm, setProductForm] = useState({
    name: product?.name || "",
    brand: product?.brand || "",
    category: product?.category || "ram",
    warranty: product?.warranty || 36,
    description: product?.description || "",
    status: product?.status || "draft",
  });

  // Modal state for adding/editing variant
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // All variants of this product - works for both existing products and brand new drafting products
  const variants = useMemo(() => {
    return data.products.filter(
      (p) => p.productId === currentProductId || (product && p.id === product.id)
    );
  }, [data.products, currentProductId, product]);

  // Currently active variant for preview (default to the first variant or the product itself)
  const [previewVariantId, setPreviewVariantId] = useState(product?.id || null);
  const activePreviewVariant = useMemo(() => {
    if (previewVariantId) {
      const found = variants.find((v) => v.id === previewVariantId);
      if (found) return found;
    }
    return variants[0] || null;
  }, [variants, previewVariantId]);

  const updateProduct = (k, v) => setProductForm((f) => ({ ...f, [k]: v }));

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

  // Save or Update Variant
  const handleSaveVariant = (variantData) => {
    try {
      const isEditing = Boolean(editingVariant);
      const targetId = isEditing ? editingVariant.id : (variantData.id || "var-" + Date.now());

      commit((d) => {
        // Check SKU uniqueness
        if (d.products.some((p) => p.id !== targetId && p.sku === variantData.sku)) {
          throw new Error("Mã SKU '" + variantData.sku + "' đã được sử dụng trên một biến thể khác.");
        }

        const newVariantRecord = {
          ...variantData,
          id: targetId,
          productId: currentProductId,
          name: productForm.name || variantData.variant,
          brand: productForm.brand,
          category: productForm.category,
          warranty: Number(productForm.warranty),
          description: productForm.description,
          status: productForm.status,
          variant: variantData.variantName || variantData.variant,
          price: Number(variantData.price),
          originalPrice: Number(variantData.originalPrice || 0),
          stock: Number(variantData.stockQuantity),
          image: variantData.imageUrl || "",
          specs: variantData.specs || {},
        };

        let updatedProducts;
        if (isEditing) {
          updatedProducts = d.products.map((p) => (p.id === targetId ? newVariantRecord : p));
        } else {
          updatedProducts = [...d.products, newVariantRecord];
        }

        return {
          ...d,
          products: updatedProducts,
        };
      });

      notify(isEditing ? "Đã cập nhật biến thể." : "Đã thêm biến thể mới.");
      if (!previewVariantId) {
        setPreviewVariantId(targetId);
      }
      closeVariantModal();
    } catch (e) {
      notify(e.message, "danger");
      throw e;
    }
  };

  // Delete Variant with Order guard
  const handleDeleteVariant = (variantId) => {
    try {
      const variantToDelete = data.products.find((p) => p.id === variantId);
      if (!variantToDelete) return;

      // Check if variant has existing orders
      const hasOrders = data.orders.some((o) =>
        o.lines?.some((l) => l.id === variantId)
      );

      if (hasOrders) {
        throw new Error(
          `Không thể xóa biến thể '${variantToDelete.variant || variantToDelete.sku}' vì đã phát sinh trong đơn hàng. Vui lòng chỉnh tồn kho về 0 thay vì xóa.`
        );
      }

      commit((d) => {
        const remaining = d.products.filter((p) => p.id !== variantId);
        const productVariants = remaining.filter((p) => p.productId === currentProductId);
        if (productVariants.length === 0) {
          setProductForm((f) => ({ ...f, status: "draft" }));
        }
        return {
          ...d,
          products: remaining,
        };
      });

      if (previewVariantId === variantId) {
        setPreviewVariantId(null);
      }
      notify("Đã xóa biến thể.");
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  // Save Product Master and propagate changes to its variants
  const handleSaveProduct = (targetStatus) => {
    try {
      if (!productForm.name.trim() || !productForm.brand.trim()) {
        throw new Error("Vui lòng nhập đầy đủ Tên sản phẩm và Thương hiệu.");
      }

      if (targetStatus === "active") {
        if (variants.length === 0) {
          throw new Error("Sản phẩm phải có ít nhất 1 biến thể (variant) để đăng bán.");
        }
      }

      commit((d) => {
        const updatedStatus = targetStatus || productForm.status;
        
        let hasExisting = d.products.some(
          (p) => p.productId === currentProductId || p.id === product?.id
        );

        let updatedProducts;
        if (hasExisting) {
          updatedProducts = d.products.map((p) => {
            if (p.productId === currentProductId || p.id === product?.id) {
              return {
                ...p,
                name: productForm.name.trim(),
                brand: productForm.brand.trim(),
                category: productForm.category,
                warranty: Number(productForm.warranty),
                description: productForm.description,
                status: updatedStatus,
              };
            }
            return p;
          });
        } else {
          // If no variants added yet, create base draft placeholder
          const placeholderVariant = {
            id: currentProductId,
            productId: currentProductId,
            name: productForm.name.trim(),
            brand: productForm.brand.trim(),
            category: productForm.category,
            warranty: Number(productForm.warranty),
            description: productForm.description,
            variant: "Tiêu chuẩn",
            sku: (productForm.brand.slice(0, 3) + "-" + Date.now().toString().slice(-4)).toUpperCase(),
            price: 0,
            originalPrice: 0,
            stock: 0,
            image: "",
            specs: {},
            status: "draft",
          };
          updatedProducts = [...d.products, placeholderVariant];
        }

        return {
          ...d,
          products: updatedProducts,
        };
      });

      setProductForm((f) => ({ ...f, status: targetStatus }));
      notify(targetStatus === "active" ? "Đã lưu và đăng bán sản phẩm thành công." : "Đã lưu thông tin sản phẩm (Bản nháp).");

      if (!product && onCreated) {
        onCreated(currentProductId);
      }
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  return {
    currentProductId,
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
  };
}
