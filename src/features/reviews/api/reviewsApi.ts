import { axiosClient, endpoints } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";

export const reviewsApi = {
  mediaUrl(url: string) {
    return new URL(url, axiosClient.defaults.baseURL || window.location.origin).href;
  },
  async editor(orderItemId: number, signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.reviews.orderItem(orderItemId), { signal });
    return data;
  },
  async media(reviewId: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.reviews.media(reviewId), { signal });
    return data;
  },
  async saveWithMedia(orderItemId: number, rating: number, comment: string, retainedMediaIds: number[], files: File[]) {
    const payload = new FormData();
    payload.append("payload", new Blob([JSON.stringify({ review: { rating, comment }, retainedMediaIds })], { type: "application/json" }));
    files.forEach((file) => payload.append("files", file));
    await axiosClient.put(endpoints.reviews.orderItem(orderItemId), payload, { headers: { "Content-Type": undefined } });
    apiCache.invalidate("reviews_variant_");
    apiCache.invalidate("catalog_products");
  },
  async list(variantId: string, signal?: AbortSignal, options?: CacheOptions) {
    return apiCache.fetchWithCache(
      `reviews_variant_${variantId}`,
      async () => {
        const { data } = await axiosClient.get(
          endpoints.reviews.product(variantId),
          { signal },
        );
        return data;
      },
      { ttl: 120_000, storage: "session", ...options }
    );
  },
  async save(orderItemId: number, rating: number, comment: string) {
    await axiosClient.put(endpoints.reviews.orderItem(orderItemId), {
      rating,
      comment,
    });
    apiCache.invalidate("reviews_variant_");
  },
};
