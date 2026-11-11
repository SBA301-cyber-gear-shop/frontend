import axios from "axios";
import type { ApiErrorResponse } from "@/types";
import { apiCache } from "./apiCache";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  responseType: "json",
  transitional: { silentJSONParsing: false },
});

axiosClient.interceptors.request.use((config) => {
  // Read on every request so login, token changes and logout take effect.
  const token = sessionStorage.getItem("techzone-token");
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response.status === 204) response.data = null;

    // Automatic cache invalidation on non-GET mutations
    const method = response.config.method?.toUpperCase();
    if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const url = response.config.url || "";
      if (url.includes("/products") || url.includes("/orders")) {
        apiCache.invalidate("admin_product");
        apiCache.invalidate("admin_variant");
        apiCache.invalidate("catalog_product");
      } else if (url.includes("/categories")) {
        apiCache.invalidate("admin_categories");
        apiCache.invalidate("catalog_categories");
      } else if (url.includes("/brands")) {
        apiCache.invalidate("admin_brands");
      } else if (url.includes("/specifications")) {
        apiCache.invalidate("admin_spec");
      }
    }

    // Keep AxiosResponse intact. Each feature API extracts its HTTP body.
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
      const { status, data } = error.response;
      if (status < 200 || status >= 300) {
        let message = `Yêu cầu thất bại (${status}).`;
        if (data?.message) message = data.message;
        else if (data?.validationErrors) {
          message = Object.values(data.validationErrors).join("; ");
        }
        error.message = message;
      }
    }
    // Preserve HTTP details, network errors and Axios cancellation identity.
    return Promise.reject(error);
  },
);
