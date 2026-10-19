import { axiosClient, endpoints } from "@/services";

export const catalogApi = {
  async list(signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.products, { signal });
    if (!Array.isArray(data)) throw new Error("Dữ liệu sản phẩm không hợp lệ.");
    return data.map((product) => ({
      ...product,
      id: String(product.id),
      productId: String(product.productId),
      category: product.category || "other",
      originalPrice: product.originalPrice ?? product.price,
      specs: product.specs || {},
    }));
  },
};
