import { axiosClient } from "@/services";

const view = (promotion) => ({
  ...promotion,
  start: promotion.start?.slice(0, 16) || "",
  end: promotion.end?.slice(0, 16) || "",
  bannerTitle: promotion.bannerTitle || "",
  bannerImage: promotion.bannerImage || "",
  bannerLink: promotion.bannerLink || "/san-pham",
});
export const promotionsApi = {
  async list(signal?: AbortSignal) {
    const { data } = await axiosClient.get("/api/admin/promotions", { signal });
    return data.map(view);
  },
  async visible(signal?: AbortSignal) {
    const { data } = await axiosClient.get("/api/promotions", { signal });
    return data.map(view);
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
    };
    const { data } = promotion.id
      ? await axiosClient.put(`/api/admin/promotions/${promotion.id}`, payload)
      : await axiosClient.post("/api/admin/promotions", payload);
    return view(data);
  },
};
