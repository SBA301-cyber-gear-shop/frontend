import { axiosClient } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";

export const reviewsApi = {
  mediaUrl(url: string) {
    return new URL(url, axiosClient.defaults.baseURL || window.location.origin).href;
  },
  async editor(orderItemId: number, signal?: AbortSignal) {
    const { data } = await axiosClient.get(`/api/order-items/${orderItemId}/review`, { signal });
    return data;
  },
  async media(reviewId: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(`/api/reviews/${encodeURIComponent(reviewId)}/media`, { signal });
    return data;
  },
  async saveWithMedia(orderItemId: number, rating: number, comment: string, retainedMediaIds: number[], files: File[]) {
    const payload = new FormData();
    payload.append("payload", new Blob([JSON.stringify({ review: { rating, comment }, retainedMediaIds })], { type: "application/json" }));
    files.forEach((file) => payload.append("files", file));
    await axiosClient.put(`/api/order-items/${orderItemId}/review`, payload, { headers: { "Content-Type": undefined } });
    apiCache.invalidate("reviews_variant_");
    apiCache.invalidate("catalog_products");
  },
  async list(variantId: string, signal?: AbortSignal, options?: CacheOptions) {
    return apiCache.fetchWithCache(
      `reviews_variant_${variantId}`,
      async () => {
        const { data } = await axiosClient.get(
          `/api/products/${encodeURIComponent(variantId)}/reviews`,
          { signal },
        );
        return data;
      },
      { ttl: 120_000, storage: "session", ...options }
    );
  },
  async save(orderItemId: number, rating: number, comment: string) {
    await axiosClient.put(`/api/order-items/${orderItemId}/review`, {
      rating,
      comment,
    });
    apiCache.invalidate("reviews_variant_");
  },
};
