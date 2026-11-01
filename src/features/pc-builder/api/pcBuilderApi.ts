import axios from "axios";
import { axiosClient, endpoints } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";
import type {
  AiBuildRequestPayload,
  AiBuildResponse,
  ApiErrorBody,
  BuildOptionsResponse,
  CompatibleReplacementResponse,
  CompatibleReplacementsQuery,
  SavedPcBuildSummary,
  SavedPcBuildDetail,
  ValidateBuildPayload,
  ValidateBuildResponse,
} from "../types/pcBuilder.types";

interface ApiResponseWrapper<T> {
  status: number;
  message: string;
  data: T;
}

interface RequestOptions {
  signal?: AbortSignal;
}

/** Lỗi HTTP của PC Builder: giữ `code`, `status`, `retryAfter` (giây, header Retry-After) và `data` của backend. */
export class PcBuildApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter: number | null;
  readonly data?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    retryAfter: number | null = null,
    data?: unknown,
  ) {
    super(message);
    this.name = "PcBuildApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.data = data;
  }
}

/** Lỗi do AbortController hủy: không hiện cho khách, không ghi vào apiError (DD 10.4). */
export function isAbortError(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/** Đổi lỗi axios sang PcBuildApiError; lỗi hủy được ném lại nguyên vẹn. */
export function toPcBuildApiError(error: unknown): unknown {
  if (isAbortError(error) || error instanceof PcBuildApiError) return error;
  if (!axios.isAxiosError(error)) return error;
  const response = error.response;
  const body = (response?.data ?? {}) as Partial<ApiErrorBody>;
  const header = response?.headers?.["retry-after"];
  const seconds = Number(header);
  return new PcBuildApiError(
    error.message || body.message || "Máy chủ không phản hồi",
    response?.status ?? 0,
    typeof body.code === "string" ? body.code : undefined,
    header != null && Number.isFinite(seconds) && seconds >= 0 ? seconds : null,
    body.data,
  );
}

function unwrap<T>(data: ApiResponseWrapper<T> | T | null | undefined): T {
  if (data == null) throw new Error("Không nhận được dữ liệu từ máy chủ");
  return typeof data === "object" && "data" in data && data.data != null
    ? (data as ApiResponseWrapper<T>).data
    : (data as T);
}

async function post<T>(url: string, payload: unknown, signal?: AbortSignal): Promise<T> {
  try {
    const { data } = await axiosClient.post<ApiResponseWrapper<T> | T>(url, payload, { signal });
    return unwrap(data);
  } catch (error) {
    throw toPcBuildApiError(error);
  }
}

function hashKey(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

export const pcBuilderApi = {
  /** Bí danh cũ của suggestBuild, giữ cho code và test hiện có. */
  async suggest(payload: AiBuildRequestPayload, options?: RequestOptions): Promise<AiBuildResponse> {
    return this.suggestBuild(payload, options);
  },

  /**
   * Đề xuất cấu hình PC bằng AI từ cơ sở dữ liệu kho hàng thực tế
   * Endpoint: POST /api/v1/pc-build/ai-suggest
   */
  async suggestBuild(
    payload: AiBuildRequestPayload,
    { signal }: RequestOptions = {},
  ): Promise<AiBuildResponse> {
    return post<AiBuildResponse>(endpoints.pcBuilder.suggest, payload, signal);
  },

  /**
   * Kiểm tra tương thích, ngân sách, tồn kho của cả bộ (giá do server tính). Không cache.
   * Endpoint: POST /api/v1/pc-build/validate
   */
  async validateBuild(
    payload: ValidateBuildPayload,
    { signal }: RequestOptions = {},
  ): Promise<ValidateBuildResponse> {
    return post<ValidateBuildResponse>(endpoints.pcBuilder.validate, payload, signal);
  },

  /**
   * Linh kiện thay thế, mỗi ứng viên được kiểm trên toàn bộ cấu hình hiện tại
   * Endpoint: POST /api/v1/pc-build/compatible-replacements
   */
  async getCompatibleReplacements(
    query: CompatibleReplacementsQuery,
    { signal, ...options }: RequestOptions & CacheOptions = {},
  ): Promise<CompatibleReplacementResponse[]> {
    const key = "pc_replacements_" + query.role + "_" + hashKey(JSON.stringify(query));
    const fetcher = async () => {
      const list = await post<CompatibleReplacementResponse[]>(
        endpoints.pcBuilder.replacements,
        query,
        signal,
      );
      return Array.isArray(list) ? list : [];
    };
    try {
      return await apiCache.fetchWithCache(key, fetcher, { ttl: 60_000, storage: "session", ...options });
    } catch (error) {
      // Cùng key với một request vừa bị hủy thì apiCache trả lại promise đã hủy đó: tự gọi lại
      if (isAbortError(error) && !signal?.aborted) return fetcher();
      throw error;
    }
  },

  /**
   * Giới hạn ngân sách, từ điển metadata, câu gợi ý nhu cầu
   * Endpoint: GET /api/v1/pc-build/options
   */
  async getBuildOptions(options?: CacheOptions): Promise<BuildOptionsResponse> {
    return apiCache.fetchWithCache(
      "pc_build_options",
      async () => {
        try {
          const { data } = await axiosClient.get<
            ApiResponseWrapper<BuildOptionsResponse> | BuildOptionsResponse
          >(endpoints.pcBuilder.options);
          return unwrap(data);
        } catch (error) {
          throw toPcBuildApiError(error);
        }
      },
      { ttl: 60_000, storage: "session", ...options },
    );
  },

  /**
   * Lưu cấu hình PC mới vào tài khoản; giá do server tính lại nên không gửi giá
   * Endpoint: POST /api/v1/pc-build/save
   */
  async saveCustomBuild(payload: {
    buildName?: string;
    items: Array<{
      variantId: number | string;
      role: string;
      quantity: number;
    }>;
  }): Promise<number> {
    const id = await post<number>(endpoints.pcBuilder.saveCustom, payload);
    apiCache.invalidate("my_saved_pc_builds");
    return id;
  },

  /**
   * Lấy danh sách cấu hình PC đã lưu của người dùng hiện tại
   * Endpoint: GET /api/v1/pc-build/my-builds
   */
  async getMySavedBuilds(options?: CacheOptions): Promise<SavedPcBuildSummary[]> {
    return apiCache.fetchWithCache(
      "my_saved_pc_builds",
      async () => {
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
      { ttl: 60_000, storage: "session", ...options }
    );
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
    apiCache.invalidate("my_saved_pc_builds");
  },
};
