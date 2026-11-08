import { axiosClient } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";

const view = (promotion) => ({
  ...promotion,
  start: promotion.start?.slice(0, 16) || "",
  end: promotion.end?.slice(0, 16) || "",
  bannerTitle: promotion.bannerTitle || "",
  bannerImage: promotion.bannerImage || "",
  bannerLink: promotion.bannerLink || "/san-pham",
});

export const promotionsApi = {
  async staffList(signal?: AbortSignal) {
    const { data } = await axiosClient.get("/api/operations/promotions", { signal });
    return data.map(view);
  },
  async mine(signal?: AbortSignal) {
    const { data } = await axiosClient.get("/api/me/vouchers", { signal });
    return data;
  },
  async recipients(id: number, search: string, assignedOnly: boolean, signal?: AbortSignal) {
    const { data } = await axiosClient.get(`/api/admin/promotions/${id}/recipients`, { params: { search, assignedOnly }, signal });
    return data;
  },
  async grant(id: number, userIds: number[]) {
    await axiosClient.post(`/api/admin/promotions/${id}/recipients`, { userIds });
  },
  async revoke(id: number, userId: number) {
    await axiosClient.delete(`/api/admin/promotions/${id}/recipients/${userId}`);
  },
  async history(
    id: number,
    params: { page: number; size: number; status: string; search: string },
    signal?: AbortSignal,
  ) {
    const { data } = await axiosClient.get(
      `/api/admin/promotions/${id}/usages`,
      { params, signal },
    );
    return data;
  },
  async list(signal?: AbortSignal, options?: CacheOptions) {
    return apiCache.fetchWithCache(
      "admin_promotions",
      async () => {
        const { data } = await axiosClient.get("/api/admin/promotions", {
          signal,
        });
        return data.map(view);
      },
      { ttl: 120_000, storage: "session", ...options },
    );
  },

  async visible(signal?: AbortSignal, options?: CacheOptions) {
    return apiCache.fetchWithCache(
      "public_promotions",
      async () => {
        const { data } = await axiosClient.get("/api/promotions", { signal });
        return data.map(view);
      },
      { ttl: 180_000, storage: "session", ...options },
    );
  },

  async save(promotion) {
    const payload = {
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      value: Number(promotion.value),
      limit: Number(promotion.limit),
      start: promotion.start,
      end: promotion.end,
      active: promotion.active,
      bannerTitle: promotion.bannerTitle,
      bannerImage: promotion.bannerImage,
      bannerLink: promotion.bannerLink,
      bannerOrder: Number(promotion.bannerOrder) || 0,
      bannerActive: promotion.bannerActive,
      audience: promotion.audience || "PUBLIC",
    };
    const { data } = promotion.id
      ? await axiosClient.put(`/api/admin/promotions/${promotion.id}`, payload)
      : await axiosClient.post("/api/admin/promotions", payload);

    apiCache.invalidate("admin_promotions");
    apiCache.invalidate("public_promotions");
    return view(data);
  },
};
