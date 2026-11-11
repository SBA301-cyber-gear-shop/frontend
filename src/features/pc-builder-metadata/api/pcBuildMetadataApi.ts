import { axiosClient } from "@/services/axiosClient";
import { endpoints } from "@/services/endpoints";
import type {
  TemplateSlot,
  TemplateSlotFormData,
  BudgetProfilePurpose,
  BudgetProfileFormData,
  MetadataCategoryOptions,
} from "../types";

/**
 * Lấy toàn bộ danh sách template slots
 */
export async function getTemplateSlots(): Promise<TemplateSlot[]> {
  const response = await axiosClient.get<TemplateSlot[]>(endpoints.admin.pcBuildMetadata.slots);
  return response.data;
}

/**
 * Tạo mới template slot
 */
export async function createTemplateSlot(input: TemplateSlotFormData): Promise<TemplateSlot> {
  const response = await axiosClient.post<TemplateSlot>(endpoints.admin.pcBuildMetadata.slots, input);
  return response.data;
}

/**
 * Cập nhật template slot
 */
export async function updateTemplateSlot(id: number, input: TemplateSlotFormData): Promise<TemplateSlot> {
  const response = await axiosClient.put<TemplateSlot>(endpoints.admin.pcBuildMetadata.slot(id), input);
  return response.data;
}

/**
 * Xóa template slot
 */
export async function deleteTemplateSlot(id: number): Promise<void> {
  await axiosClient.delete(endpoints.admin.pcBuildMetadata.slot(id));
}

/**
 * Cập nhật thứ tự toàn bộ các slot linh kiện
 */
export async function reorderTemplateSlots(orderedSlotIds: number[]): Promise<TemplateSlot[]> {
  const response = await axiosClient.put<TemplateSlot[]>(
    endpoints.admin.pcBuildMetadata.reorderSlots,
    orderedSlotIds
  );
  return response.data;
}

/**
 * Lấy danh sách category và options phục vụ form nhập liệu
 */
export async function getAvailableCategoryOptions(): Promise<MetadataCategoryOptions> {
  const response = await axiosClient.get<MetadataCategoryOptions>(
    endpoints.admin.pcBuildMetadata.categoriesAvailable
  );
  return response.data;
}

/**
 * Lấy danh sách budget profiles nhóm theo purpose
 */
export async function getBudgetProfiles(): Promise<BudgetProfilePurpose[]> {
  const response = await axiosClient.get<BudgetProfilePurpose[]>(
    endpoints.admin.pcBuildMetadata.budgetProfiles
  );
  return response.data;
}

/**
 * Tạo mới một purpose
 */
export async function createBudgetProfilePurpose(
  input: BudgetProfileFormData
): Promise<BudgetProfilePurpose> {
  const response = await axiosClient.post<BudgetProfilePurpose>(
    endpoints.admin.pcBuildMetadata.budgetProfilePurposes,
    input
  );
  return response.data;
}

/**
 * Cập nhật một purpose
 */
export async function updateBudgetProfilePurpose(
  purpose: string,
  input: BudgetProfileFormData
): Promise<BudgetProfilePurpose> {
  const response = await axiosClient.put<BudgetProfilePurpose>(
    endpoints.admin.pcBuildMetadata.budgetProfilePurpose(purpose),
    input
  );
  return response.data;
}

/**
 * Xóa một purpose
 */
export async function deleteBudgetProfilePurpose(purpose: string): Promise<void> {
  await axiosClient.delete(endpoints.admin.pcBuildMetadata.budgetProfilePurpose(purpose));
}

/**
 * Lấy cấu hình PC Builder (bao gồm giá trị bộ PC đắt nhất maxBuildPrice từ hệ thống)
 * Endpoint: GET /api/pc-build/config
 */
export async function getPcBuildConfig(): Promise<{ maxBuildPrice: number; lowestMinBudget: number }> {
  const response = await axiosClient.get<{
    data?: { maxBuildPrice: number; lowestMinBudget: number };
    maxBuildPrice?: number;
    lowestMinBudget?: number;
  }>(endpoints.pcBuilder.config);
  if (response.data && typeof response.data === "object") {
    if ("data" in response.data && response.data.data) {
      return response.data.data;
    }
    if ("maxBuildPrice" in response.data && typeof response.data.maxBuildPrice === "number") {
      return response.data as { maxBuildPrice: number; lowestMinBudget: number };
    }
  }
  return { maxBuildPrice: 0, lowestMinBudget: 0 };
}

