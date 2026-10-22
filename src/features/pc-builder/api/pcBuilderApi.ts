import { axiosClient, endpoints } from "@/services";
import type {
  AiBuildRequestPayload,
  AiBuildResponse,
  CompatibleReplacementResponse,
  SavedPcBuildSummary,
  SavedPcBuildDetail,
} from "../types/pcBuilder.types";

interface ApiResponseWrapper<T> {
  status: number;
  message: string;
  data: T;
}

export const pcBuilderApi = {
  /**
   * Đề xuất cấu hình PC bằng AI từ cơ sở dữ liệu kho hàng thực tế
   * Endpoint: POST /api/v1/pc-build/ai-suggest
   */
  async suggest(payload: AiBuildRequestPayload): Promise<AiBuildResponse> {
    return this.suggestBuild(payload);
  },

  async suggestBuild(payload: AiBuildRequestPayload): Promise<AiBuildResponse> {
    const { data } = await axiosClient.post<
      ApiResponseWrapper<AiBuildResponse> | AiBuildResponse
    >(endpoints.pcBuilder.suggest, payload);

    if (data == null) {
      throw new Error("Không nhận được dữ liệu từ máy chủ");
    }

    return "data" in data && data.data ? data.data : (data as AiBuildResponse);
  },

  /**
   * Lấy danh sách linh kiện thay thế tương thích thông minh
   * Endpoint: GET /api/v1/pc-build/compatible-replacements
   */
  async getCompatibleReplacements(
    role: string,
    currentCpuId?: number | string,
    currentMbId?: number | string,
  ): Promise<CompatibleReplacementResponse[]> {
    const params = new URLSearchParams({ role });
    if (currentCpuId) {
      params.append("currentCpuId", String(currentCpuId));
    }
    if (currentMbId) {
      params.append("currentMbId", String(currentMbId));
    }

    const { data } = await axiosClient.get<
      | ApiResponseWrapper<CompatibleReplacementResponse[]>
      | CompatibleReplacementResponse[]
    >(`${endpoints.pcBuilder.replacements}?${params.toString()}`);

    if (data == null) return [];

    return "data" in data && Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
  },

  /**
   * Lưu cấu hình PC mới từ danh sách linh kiện đã chọn vào tài khoản
   * Endpoint: POST /api/v1/pc-build/save
   */
  async saveCustomBuild(payload: {
    buildName?: string;
    totalPrice: number;
    items: Array<{
      variantId: number | string;
      role: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<number> {
    const { data } = await axiosClient.post<ApiResponseWrapper<number>>(
      endpoints.pcBuilder.saveCustom,
      payload,
    );
    return data.data;
  },

  /**
   * Lưu cấu hình PC vào tài khoản khách hàng theo buildId
   * Endpoint: POST /api/v1/pc-build/{buildId}/save
   */
  async saveBuild(buildId: number | string): Promise<string> {
    const { data } = await axiosClient.post<
      ApiResponseWrapper<string> | string
    >(endpoints.pcBuilder.save(buildId));

    if (typeof data === "object" && data !== null && "data" in data) {
      return data.data || data.message || "OK";
    }

    return String(data || "OK");
  },

  /**
   * Lấy danh sách cấu hình PC đã lưu của người dùng hiện tại
   * Endpoint: GET /api/v1/pc-build/my-builds
   */
  async getMySavedBuilds(): Promise<SavedPcBuildSummary[]> {
    const { data } = await axiosClient.get<
      ApiResponseWrapper<SavedPcBuildSummary[]> | SavedPcBuildSummary[]
    >(endpoints.pcBuilder.myBuilds);

    if (data == null) return [];
    return "data" in data && Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
  },

  /**
   * Xem chi tiết đầy đủ linh kiện một cấu hình PC đã lưu
   * Endpoint: GET /api/v1/pc-build/{buildId}
   */
  async getSavedBuildDetail(
    buildId: number | string,
  ): Promise<SavedPcBuildDetail> {
    const { data } = await axiosClient.get<
      ApiResponseWrapper<SavedPcBuildDetail> | SavedPcBuildDetail
    >(endpoints.pcBuilder.detail(buildId));

    if (data == null) {
      throw new Error("Không nhận được dữ liệu cấu hình từ máy chủ");
    }
    return "data" in data && data.data ? data.data : (data as SavedPcBuildDetail);
  },

  /**
   * Xóa một cấu hình PC đã lưu
   * Endpoint: DELETE /api/v1/pc-build/{buildId}
   */
  async deleteSavedBuild(buildId: number | string): Promise<void> {
    await axiosClient.delete(endpoints.pcBuilder.delete(buildId));
  },
};
