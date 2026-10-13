import { useState } from "react";
import { useStore } from "@/store";

export function useProductEditor({ product, onCreated }) {
  const { commit, notify } = useStore();
  const [form, setForm] = useState(
    product || {
      name: "",
      productId: "",
      brand: "",
      category: "ram",
      variant: "",
      sku: "",
      price: 0,
      originalPrice: 0,
      stock: 0,
      warranty: 36,
      status: "draft",
      image: "",
      description: "",
      specs: {},
      tech: {},
    },
  );
  const [specText, setSpecText] = useState(
    Object.entries(form.specs)
      .map(([k, v]) => k + ": " + v)
      .join("\n"),
  );
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function save(status) {
    try {
      if (
        !form.name.trim() ||
        !form.brand.trim() ||
        !form.sku.trim() ||
        !form.variant.trim()
      )
        throw new Error("Nhập đủ tên, thương hiệu, SKU và phiên bản.");
      if (
        !Number.isFinite(Number(form.price)) ||
        Number(form.price) <= 0 ||
        !Number.isInteger(Number(form.stock)) ||
        Number(form.stock) < 0 ||
        !Number.isInteger(Number(form.warranty)) ||
        Number(form.warranty) < 0
      )
        throw new Error("Kiểm tra giá, tồn kho và thời hạn bảo hành.");
      if (form.image && !/^(https?:\/\/|\/(?!\/))/.test(form.image))
        throw new Error("Ảnh phải là URL http(s) hoặc đường dẫn nội bộ.");
      const specs = {};
      for (const line of specText.split("\n").filter((l) => l.trim())) {
        const pos = line.indexOf(":");
        if (pos < 1 || !line.slice(pos + 1).trim())
          throw new Error(
            "Nhập thông số theo dạng Tên: Giá trị, mỗi dòng một thông số.",
          );
        const key = line.slice(0, pos).trim();
        if (specs[key]) throw new Error("Thông số bị trùng: " + key);
        specs[key] = line.slice(pos + 1).trim();
      }
      const id = product?.id || crypto.randomUUID(),
        value = {
          ...form,
          id,
          productId: form.productId || id,
          price: Number(form.price),
          originalPrice: Number(form.originalPrice),
          stock: Number(form.stock),
          warranty: Number(form.warranty),
          sku: form.sku.trim().toUpperCase(),
          specs,
          status,
        };
      // Changing raw display specifications invalidates the separate demo compatibility data.
      if (
        product &&
        (specText !==
          Object.entries(product.specs)
            .map(([k, v]) => k + ": " + v)
            .join("\n") ||
          form.category !== product.category)
      )
        value.tech = {};
      commit((d) => {
        if (d.products.some((p) => p.id !== id && p.sku === value.sku))
          throw new Error("SKU đã được sử dụng.");
        return {
          ...d,
          products: product
            ? d.products.map((p) => (p.id === id ? value : p))
            : [...d.products, value],
        };
      });
      notify("Đã lưu sản phẩm demo.");
      if (!product) onCreated(id);
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  return { form, specText, setSpecText, update, save };
}
