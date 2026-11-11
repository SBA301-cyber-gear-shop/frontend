import { axiosClient } from "@/services/axiosClient";
import { endpoints } from "@/services/endpoints";
import type { AiConfig, AiConfigFormInput, PromptTestResult } from "../types";

/**
 * Lấy toàn bộ danh sách cấu hình AI từ Backend
 */
export async function getAiConfigs(): Promise<AiConfig[]> {
  const response = await axiosClient.get<AiConfig[]>(endpoints.admin.aiConfigs);
  return response.data;
}

/**
 * Lấy chi tiết một cấu hình theo ID
 */
export async function getAiConfigById(id: number): Promise<AiConfig> {
  const response = await axiosClient.get<AiConfig>(endpoints.admin.aiConfig(id));
  return response.data;
}

/**
 * Tạo mới cấu hình AI
 */
export async function createAiConfig(input: AiConfigFormInput): Promise<AiConfig> {
  const response = await axiosClient.post<AiConfig>(endpoints.admin.aiConfigs, input);
  return response.data;
}

/**
 * Cập nhật cấu hình AI
 */
export async function updateAiConfig(id: number, input: Partial<AiConfigFormInput>): Promise<AiConfig> {
  const response = await axiosClient.put<AiConfig>(endpoints.admin.aiConfig(id), input);
  return response.data;
}

/**
 * Xóa một cấu hình AI
 */
export async function deleteAiConfig(id: number): Promise<boolean> {
  await axiosClient.delete(endpoints.admin.aiConfig(id));
  return true;
}

/**
 * Bật/tắt trạng thái kích hoạt (is_active)
 * Backend tự động hoán đổi: nếu kích hoạt bản ghi này, bản ghi khác cùng key sẽ tự chuyển thành false.
 */
export async function toggleAiConfigStatus(id: number, isActive?: boolean): Promise<AiConfig> {
  const response = await axiosClient.patch<AiConfig>(endpoints.admin.aiConfigToggle(id), { isActive });
  return response.data;
}

/**
 * Thử nghiệm Prompt trong Sandbox test
 */
export async function testAiPrompt(
  config: Partial<AiConfig>,
  userMessage: string
): Promise<PromptTestResult> {
  const response = await axiosClient.post<PromptTestResult>(endpoints.admin.aiConfigTest, {
    configKey: config.configKey,
    provider: config.provider,
    modelName: config.modelName,
    apiKey: config.apiKey,
    systemPrompt: config.systemPrompt,
    userMessage,
  });
  return response.data;
}
