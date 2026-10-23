import { axiosClient } from "@/services/axiosClient";
import { endpoints } from "@/services/endpoints";
import { apiCache, type CacheOptions } from "@/services/apiCache";

export interface AttributeValueInput {
  specificationId: number;
  optionId?: number | null;
  value?: string | null;
}

export interface CreateVariantPayload {
  serialCode: string;
  variantName?: string;
  slug?: string;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  attributes?: AttributeValueInput[];
}

export interface UpdateVariantPayload {
  serialCode: string;
  variantName?: string;
  slug?: string;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  attributes?: AttributeValueInput[];
}

export interface CreateProductPayload {
  name: string;
  brandId: number;
  categoryId: number;
  warrantyPeriodMonths: number;
  description?: string;
  variants?: CreateVariantPayload[];
}

export interface UpdateProductPayload {
  name: string;
  brandId: number;
  categoryId: number;
  warrantyPeriodMonths: number;
  description?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

export interface SpecOptionResponse {
  id: number;
  specificationId: number;
  code: string;
  displayValue: string;
}

export interface SpecValueResponse {
  id: number;
  specificationId: number;
  specificationName: string;
  optionId?: number | null;
  optionCode?: string | null;
  value: string;
}

export interface VariantResponse {
  id: number;
  productId: number;
  serialCode: string;
  variantName: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  attributes: SpecValueResponse[];
}

export interface CategorySpecResponse {
  id: number;
  specificationId: number;
  specificationName: string;
  isFilterable: boolean;
  isPrimary: boolean;
  showInMenu: boolean;
  isCompatibility: boolean;
}

export interface CategoryItemResponse {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  description?: string | null;
  children?: CategoryItemResponse[];
  specifications: CategorySpecResponse[];
}

export interface ConfigureCategorySpecPayload {
  specificationId: number;
  isFilterable?: boolean;
  isPrimary?: boolean;
  showInMenu?: boolean;
  isCompatibility?: boolean;
}

export interface ProductResponse {
  id: number;
  name: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  warrantyPeriodMonths: number;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  variants: VariantResponse[];
}

export const productApi = {
  // Admin Product APIs
  createProductDraft: async (payload: CreateProductPayload): Promise<ProductResponse> => {
    const res = await axiosClient.post<ProductResponse>(endpoints.admin.products, payload);
    apiCache.invalidate("admin_products");
    apiCache.invalidate("catalog_products");
    return res.data;
  },

  listAdminProducts: async (status?: string, options?: CacheOptions): Promise<ProductResponse[]> => {
    const cacheKey = `admin_products_${status || "ALL"}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const res = await axiosClient.get<ProductResponse[]>(endpoints.admin.products, {
          params: status ? { status } : undefined,
        });
        return res.data;
      },
      { ttl: 120_000, storage: "session", ...options }
    );
  },

  getAdminProductById: async (productId: number, options?: CacheOptions): Promise<ProductResponse> => {
    const cacheKey = `admin_product_${productId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const res = await axiosClient.get<ProductResponse>(`${endpoints.admin.products}/${productId}`);
        return res.data;
      },
      { ttl: 120_000, storage: "session", ...options }
    );
  },

  publishProduct: async (productId: number): Promise<ProductResponse> => {
    const res = await axiosClient.put<ProductResponse>(`${endpoints.admin.products}/${productId}/publish`);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate("catalog_products");
    return res.data;
  },

  updateProduct: async (productId: number, payload: UpdateProductPayload): Promise<ProductResponse> => {
    const res = await axiosClient.put<ProductResponse>(`${endpoints.admin.products}/${productId}`, payload);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate("catalog_products");
    return res.data;
  },

  deleteProduct: async (productId: number): Promise<void> => {
    await axiosClient.delete(`${endpoints.admin.products}/${productId}`);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate("catalog_products");
  },

  // Admin Variant APIs
  addVariant: async (productId: number, payload: CreateVariantPayload): Promise<VariantResponse> => {
    const res = await axiosClient.post<VariantResponse>(`${endpoints.admin.products}/${productId}/variants`, payload);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate(`admin_variants_${productId}`);
    apiCache.invalidate("catalog_products");
    return res.data;
  },

  updateVariant: async (productId: number, variantId: number, payload: UpdateVariantPayload): Promise<VariantResponse> => {
    const res = await axiosClient.put<VariantResponse>(`${endpoints.admin.products}/${productId}/variants/${variantId}`, payload);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate(`admin_variants_${productId}`);
    apiCache.invalidate("catalog_products");
    return res.data;
  },

  deleteVariant: async (productId: number, variantId: number): Promise<void> => {
    await axiosClient.delete(`${endpoints.admin.products}/${productId}/variants/${variantId}`);
    apiCache.invalidate("admin_products");
    apiCache.invalidate(`admin_product_${productId}`);
    apiCache.invalidate(`admin_variants_${productId}`);
    apiCache.invalidate("catalog_products");
  },

  getVariants: async (productId: number, options?: CacheOptions): Promise<VariantResponse[]> => {
    const cacheKey = `admin_variants_${productId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const res = await axiosClient.get<VariantResponse[]>(`${endpoints.admin.products}/${productId}/variants`);
        return res.data;
      },
      { ttl: 120_000, storage: "session", ...options }
    );
  },

  // Specifications & Options
  getSpecifications: async (options?: CacheOptions): Promise<{ id: number; name: string }[]> => {
    return apiCache.fetchWithCache(
      "admin_specifications",
      async () => {
        const res = await axiosClient.get(endpoints.admin.specifications);
        return res.data;
      },
      { ttl: 600_000, storage: "session", ...options } // 10 minutes cache
    );
  },

  getSpecificationOptions: async (specId: number, options?: CacheOptions): Promise<SpecOptionResponse[]> => {
    return apiCache.fetchWithCache(
      `admin_spec_options_${specId}`,
      async () => {
        const res = await axiosClient.get<SpecOptionResponse[]>(`${endpoints.admin.specifications}/${specId}/options`);
        return res.data;
      },
      { ttl: 600_000, storage: "session", ...options }
    );
  },

  addSpecificationOption: async (specId: number, data: { code: string; displayValue: string }): Promise<SpecOptionResponse> => {
    const res = await axiosClient.post<SpecOptionResponse>(`${endpoints.admin.specifications}/${specId}/options`, data);
    apiCache.invalidate(`admin_spec_options_${specId}`);
    return res.data;
  },

  createSpecification: async (data: { name: string }): Promise<{ id: number; name: string }> => {
    const res = await axiosClient.post<{ id: number; name: string }>(endpoints.admin.specifications, data);
    apiCache.invalidate("admin_specifications");
    return res.data;
  },

  // Brands & Categories (Static master data, 10 mins cache)
  getBrands: async (options?: CacheOptions): Promise<{ id: number; name: string; logoUrl?: string; description?: string }[]> => {
    return apiCache.fetchWithCache(
      "admin_brands",
      async () => {
        const res = await axiosClient.get(endpoints.admin.brands);
        return res.data;
      },
      { ttl: 600_000, storage: "session", ...options }
    );
  },

  getCategories: async (options?: CacheOptions): Promise<CategoryItemResponse[]> => {
    return apiCache.fetchWithCache(
      "admin_categories",
      async () => {
        const res = await axiosClient.get<CategoryItemResponse[]>(endpoints.admin.categories);
        return res.data;
      },
      { ttl: 600_000, storage: "session", ...options }
    );
  },

  configureCategorySpecifications: async (
    categoryId: number,
    requests: ConfigureCategorySpecPayload[]
  ): Promise<CategorySpecResponse[]> => {
    const res = await axiosClient.post<CategorySpecResponse[]>(
      `${endpoints.admin.categories}/${categoryId}/specifications`,
      requests
    );
    apiCache.invalidate("admin_categories");
    return res.data;
  },
};
