import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { productApi } from "../api/productApi";

function findCategoryById(cats, id) {
  if (!Array.isArray(cats) || !id) return null;
  for (const c of cats) {
    if (c.id === id) return c;
    if (c.children && c.children.length > 0) {
      const found = findCategoryById(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

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

  // Category CRUD states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    parentId: "",
    description: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

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
        const cat = findCategoryById(cats, activeId);
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
      } else {
        setSelectedCategoryId(null);
        setDraft([]);
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
    const cat = findCategoryById(categories, id);
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
      await loadData(selectedCategoryId, true);
      notify("Đã lưu cấu hình thông số cho danh mục thành công!");
    } catch (err) {
      console.error("Save specs error:", err);
      notify("Lỗi khi lưu cấu hình thông số: " + (err.message || "Vui lòng thử lại"), "danger");
    } finally {
      setSaving(false);
    }
  }

  // Category CRUD Handlers
  function openCreateCategoryModal(defaultParentId = null) {
    setEditingCategoryId(null);
    setCategoryForm({
      name: "",
      slug: "",
      parentId: defaultParentId ? String(defaultParentId) : "",
      description: "",
    });
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(cat, e) {
    if (e) e.stopPropagation();
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name || "",
      slug: cat.slug || "",
      parentId: cat.parentId || "",
      description: cat.description || "",
    });
    setCategoryModalOpen(true);
  }

  function openDeleteCategoryModal(cat, e) {
    if (e) e.stopPropagation();
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  }

  async function handleSaveCategory() {
    const trimmedName = categoryForm.name.trim();
    if (!trimmedName) {
      notify("Vui lòng nhập tên danh mục.", "danger");
      return;
    }

    try {
      setCategorySubmitting(true);
      const payload = {
        name: trimmedName,
        slug: categoryForm.slug.trim() || undefined,
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        description: categoryForm.description.trim() || undefined,
      };

      let savedCat;
      if (editingCategoryId) {
        savedCat = await productApi.updateCategory(editingCategoryId, payload);
        notify(`Đã cập nhật danh mục "${savedCat.name}" thành công!`);
      } else {
        savedCat = await productApi.createCategory(payload);
        notify(`Đã tạo mới danh mục "${savedCat.name}" thành công!`);
      }

      setCategoryModalOpen(false);
      await loadData(savedCat?.id || selectedCategoryId, true);
    } catch (err) {
      console.error("Save category error:", err);
      notify(
        err.response?.data?.message || err.message || "Không thể lưu thông tin danh mục.",
        "danger"
      );
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;
    try {
      setCategorySubmitting(true);
      await productApi.deleteCategory(categoryToDelete.id);
      notify(`Đã xóa danh mục "${categoryToDelete.name}" thành công!`);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      await loadData(null, true);
    } catch (err) {
      console.error("Delete category error:", err);
      notify(
        err.response?.data?.message || err.message || "Không thể xóa danh mục.",
        "danger"
      );
    } finally {
      setCategorySubmitting(false);
    }
  }

  const selectedCategory = findCategoryById(categories, selectedCategoryId) || null;

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
    // Category CRUD exports
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
  };
}
