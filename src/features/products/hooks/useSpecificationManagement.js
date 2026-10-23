import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";

export function useSpecificationManagement() {
  const { notify } = useStore();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [allSpecs, setAllSpecs] = useState([]);
  const [draft, setDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedSpecId, setSelectedSpecId] = useState("");

  const loadData = useCallback(async (preferredCatId = null, bypassCache = false) => {
    try {
      setLoading(true);
      const [cats, specs] = await Promise.all([
        productApi.getCategories({ bypassCache }),
        productApi.getSpecifications({ bypassCache }),
      ]);
      setCategories(cats || []);
      setAllSpecs(specs || []);

      const activeId = preferredCatId || (cats && cats.length > 0 ? cats[0].id : null);
      if (activeId) {
        setSelectedCategoryId(activeId);
        const cat = cats.find((c) => c.id === activeId);
        if (cat && Array.isArray(cat.specifications)) {
          setDraft(
            cat.specifications.map((s) => ({
              specificationId: s.specificationId,
              name: s.specificationName,
              filter: !!s.isFilterable,
              primary: !!s.isPrimary,
              menu: !!s.showInMenu,
              compatibility: !!s.isCompatibility,
            }))
          );
        } else {
          setDraft([]);
        }
      }
    } catch (err) {
      console.error("Failed to load specifications data:", err);
      notify("Không thể tải danh sách thông số danh mục: " + (err.message || "Lỗi mạng"), "danger");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function choose(catId) {
    const id = Number(catId);
    setSelectedCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat && Array.isArray(cat.specifications)) {
      setDraft(
        cat.specifications.map((s) => ({
          specificationId: s.specificationId,
          name: s.specificationName,
          filter: !!s.isFilterable,
          primary: !!s.isPrimary,
          menu: !!s.showInMenu,
          compatibility: !!s.isCompatibility,
        }))
      );
    } else {
      setDraft([]);
    }
  }

  function toggle(index, key) {
    setDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: !item[key] } : item))
    );
  }

  function removeSpec(index) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function addExistingSpec(specId) {
    const id = Number(specId);
    if (!id) return;
    const spec = allSpecs.find((s) => s.id === id);
    if (!spec) return;
    if (draft.some((s) => s.specificationId === id)) {
      notify(`Thông số "${spec.name}" đã có trong danh mục này.`, "danger");
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        specificationId: spec.id,
        name: spec.name,
        filter: false,
        primary: false,
        menu: false,
        compatibility: false,
      },
    ]);
    setSelectedSpecId("");
    notify(`Đã thêm thông số "${spec.name}" vào danh sách. Nhớ nhấn Lưu thay đổi.`);
  }

  async function createNewSpec() {
    const trimmed = newName.trim();
    if (!trimmed) {
      notify("Vui lòng nhập tên thông số mới.", "danger");
      return;
    }
    if (draft.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      notify("Thông số này đã có trong danh mục.", "danger");
      return;
    }

    try {
      // Check if it already exists in allSpecs
      let existing = allSpecs.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
      if (!existing) {
        existing = await productApi.createSpecification({ name: trimmed });
        setAllSpecs((prev) => [...prev, existing]);
      }

      setDraft((prev) => [
        ...prev,
        {
          specificationId: existing.id,
          name: existing.name,
          filter: false,
          primary: false,
          menu: false,
          compatibility: false,
        },
      ]);
      setNewName("");
      notify(`Đã tạo và thêm thông số "${existing.name}". Nhớ nhấn Lưu thay đổi.`);
    } catch (err) {
      notify("Không thể tạo thông số mới: " + (err.message || "Lỗi hệ thống"), "danger");
    }
  }

  async function saveChanges() {
    if (!selectedCategoryId) return;
    try {
      setSaving(true);
      const payload = draft.map((s) => ({
        specificationId: s.specificationId,
        isFilterable: !!s.filter,
        isPrimary: !!s.primary,
        showInMenu: !!s.menu,
        isCompatibility: !!s.compatibility,
      }));

      await productApi.configureCategorySpecifications(selectedCategoryId, payload);
      // Reload categories with bypass cache
      await loadData(selectedCategoryId, true);
      notify("Đã lưu cấu hình thông số cho danh mục thành công!");
    } catch (err) {
      console.error("Save specs error:", err);
      notify("Lỗi khi lưu cấu hình thông số: " + (err.message || "Vui lòng thử lại"), "danger");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;

  return {
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
  };
}
