import { axiosClient } from "@/services";

export const reviewsApi = {
  async list(variantId: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(
      `/api/products/${encodeURIComponent(variantId)}/reviews`,
      { signal },
    );
    return data;
  },
  async save(orderItemId: number, rating: number, comment: string) {
    await axiosClient.put(`/api/order-items/${orderItemId}/review`, {
      rating,
      comment,
    });
  },
};
