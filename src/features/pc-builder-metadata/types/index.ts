export interface TemplateSlot {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  stepOrder: number;
  required: boolean;
  minQty: number;
  maxQty: number;
  requiredIfCategoryId: number | null;
  requiredIfCategoryName: string | null;
  requiredIfSpecId: number | null;
  requiredIfSpecName: string | null;
  requiredIfValue: string | null;
}

export interface TemplateSlotFormData {
  categoryId: number;
  stepOrder: number;
  required: boolean;
  minQty: number;
  maxQty: number;
  requiredIfCategoryId?: number | null;
  requiredIfSpecId?: number | null;
  requiredIfValue?: string | null;
}

export interface SlotShareItem {
  profileId: number | null;
  slotId: number;
  categoryId: number;
  categoryName: string;
  stepOrder: number;
  sharePct: number;
}

export interface BudgetProfilePurpose {
  purpose: string;
  label: string;
  description: string;
  minBudget: number;
  totalSharePct: number;
  slots: SlotShareItem[];
}

export interface BudgetProfileFormData {
  purpose?: string;
  minBudget: number;
  slotShares: Record<number, number>;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  alreadyHasSlot: boolean;
}

export interface SpecOptionItem {
  categoryId: number;
  specId: number;
  specName: string;
  code: string;
  displayValue: string;
}

export interface MetadataCategoryOptions {
  categories: CategoryItem[];
  specOptions: SpecOptionItem[];
}

