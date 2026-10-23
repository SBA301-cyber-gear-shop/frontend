import { axiosClient } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";

export const reviewsApi = {
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
