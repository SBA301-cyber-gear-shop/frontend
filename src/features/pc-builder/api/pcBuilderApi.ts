import axios from "axios";
import { axiosClient, endpoints } from "@/services";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorBody,
  AutoBuildRequest,
  BuildResult,
  PcBuildConfig,
  ReplacementOption,
  ReplacementRequest,
  SaveBuildRequest,
  SaveBuildResult,
  SavedBuild,
  ValidateBuildRequest,
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

/** Lỗi do AbortController hủy: không hiện cho khách. */
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
    // axiosClient đã đặt message = câu lỗi của backend (hoặc gộp validationErrors)
    error.message || body.message || "Máy chủ không phản hồi",
    response?.status ?? 0,
    typeof body.code === "string" ? body.code : undefined,
    header != null && Number.isFinite(seconds) && seconds >= 0 ? seconds : null,
    body.data,
  );
}

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  try {
    const { data } = await axiosClient.get<ApiResponseWrapper<T>>(url, { signal });
    if (data == null || data.data == null) throw new Error("Không nhận được dữ liệu từ máy chủ");
    return data.data;
  } catch (error) {
    throw toPcBuildApiError(error);
  }
}

async function post<T>(url: string, payload: unknown, signal?: AbortSignal): Promise<T> {
  try {
    const { data } = await axiosClient.post<ApiResponseWrapper<T>>(url, payload, { signal });
    if (data == null || data.data == null) throw new Error("Không nhận được dữ liệu từ máy chủ");
    return data.data;
  } catch (error) {
    throw toPcBuildApiError(error);
  }
}

export const pcBuilderApi = {
  /**
   * Lấy cấu hình ban đầu (mức ngân sách tối đa và tối thiểu từ Database kho thực tế).
   * Endpoint: GET /api/pc-build/config
   */
  getConfig({ signal }: RequestOptions = {}): Promise<PcBuildConfig> {
    return get<PcBuildConfig>(endpoints.pcBuilder.config, signal);
  },

  /**
   * Bước 1–3: AI đọc nhu cầu, kiểm ngân sách tối thiểu và kỳ vọng hiệu năng.
   * Endpoint: POST /api/pc-build/requirements/analyze
   */
  analyze(payload: AnalyzeRequest, { signal }: RequestOptions = {}): Promise<AnalyzeResponse> {
    return post<AnalyzeResponse>(endpoints.pcBuilder.analyze, payload, signal);
  },

  /**
   * Bước 4–8: chia ngân sách, chọn linh kiện, kiểm tra và giải thích (status luôn VALID).
   * Endpoint: POST /api/pc-build/builds/auto
   */
  autoBuild(payload: AutoBuildRequest, { signal }: RequestOptions = {}): Promise<BuildResult> {
    return post<BuildResult>(endpoints.pcBuilder.auto, payload, signal);
  },

  /**
   * Bước 9 → 6/7: kiểm lại bộ PC sau khi khách đổi món hoặc số lượng. Không gọi AI.
   * Endpoint: POST /api/pc-build/builds/validate
   */
  validate(payload: ValidateBuildRequest, { signal }: RequestOptions = {}): Promise<BuildResult> {
    return post<BuildResult>(endpoints.pcBuilder.validate, payload, signal);
  },

  /**
   * Bước 9: các món còn hàng, tương thích với phần còn lại của bộ PC.
   * Endpoint: POST /api/pc-build/builds/replacements
   */
  async replacements(
    payload: ReplacementRequest,
    { signal }: RequestOptions = {},
  ): Promise<ReplacementOption[]> {
    const list = await post<ReplacementOption[]>(endpoints.pcBuilder.replacements, payload, signal);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Bước 9: lưu bộ PC (cần đăng nhập). Giá do server đọc lại từ DB.
   * 409 OVER_BUDGET_NOT_CONFIRMED khi vượt ngân sách mà chưa có confirmOverBudget = true.
   * Endpoint: POST /api/pc-build/builds/save
   */
  save(payload: SaveBuildRequest): Promise<SaveBuildResult> {
    return post<SaveBuildResult>(endpoints.pcBuilder.save, payload);
  },

  /**
   * Các bộ PC tài khoản đang đăng nhập đã lưu, mới nhất trước (cần đăng nhập, 401 khi thiếu token).
   * Endpoint: GET /api/pc-build/builds/saved
   */
  async listSaved({ signal }: RequestOptions = {}): Promise<SavedBuild[]> {
    const list = await get<SavedBuild[]>(endpoints.pcBuilder.saved, signal);
    return Array.isArray(list) ? list : [];
  },
};
