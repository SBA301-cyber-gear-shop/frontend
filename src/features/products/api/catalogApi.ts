import { axiosClient, endpoints } from "@/services";
import { apiCache, type CacheOptions } from "@/services/apiCache";

export const catalogApi = {
  async list(signal?: AbortSignal, options?: CacheOptions) {
    try {
      // Dọn dẹp cache phiên cũ nếu có trong sessionStorage
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("tz_cache_catalog_products");
      }
    } catch {}

    return apiCache.fetchWithCache(
      "catalog_products",
      async () => {
        const { data } = await axiosClient.get(endpoints.products, { signal });
        if (!Array.isArray(data)) throw new Error("Dữ liệu sản phẩm không hợp lệ.");
        return data.map((product) => ({
          ...product,
          id: String(product.id),
          productId: String(product.productId),
          category: product.category || "other",
          originalPrice: product.originalPrice ?? product.price,
          specs: product.specs || {},
          ...(product.status
            ? { status: String(product.status).toLowerCase() }
            : {}),
        }));
      },
      { ttl: 10_000, storage: "memory", ...options }
    );
  },
};
