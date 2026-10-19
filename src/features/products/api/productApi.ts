import { axiosClient } from "@/services/axiosClient";
import { endpoints } from "@/services/endpoints";

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
    return res.data;
  },

  listAdminProducts: async (status?: string): Promise<ProductResponse[]> => {
    const res = await axiosClient.get<ProductResponse[]>(endpoints.admin.products, {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  getAdminProductById: async (productId: number): Promise<ProductResponse> => {
    const res = await axiosClient.get<ProductResponse>(`${endpoints.admin.products}/${productId}`);
    return res.data;
  },

  publishProduct: async (productId: number): Promise<ProductResponse> => {
    const res = await axiosClient.put<ProductResponse>(`${endpoints.admin.products}/${productId}/publish`);
    return res.data;
  },

  // Admin Variant APIs
  addVariant: async (productId: number, payload: CreateVariantPayload): Promise<VariantResponse> => {
    const res = await axiosClient.post<VariantResponse>(`${endpoints.admin.products}/${productId}/variants`, payload);
    return res.data;
  },

  updateVariant: async (productId: number, variantId: number, payload: UpdateVariantPayload): Promise<VariantResponse> => {
    const res = await axiosClient.put<VariantResponse>(`${endpoints.admin.products}/${productId}/variants/${variantId}`, payload);
    return res.data;
  },

  deleteVariant: async (productId: number, variantId: number): Promise<void> => {
    await axiosClient.delete(`${endpoints.admin.products}/${productId}/variants/${variantId}`);
  },

  getVariants: async (productId: number): Promise<VariantResponse[]> => {
    const res = await axiosClient.get<VariantResponse[]>(`${endpoints.admin.products}/${productId}/variants`);
    return res.data;
  },

  // Specifications & Options
  getSpecifications: async (): Promise<{ id: number; name: string }[]> => {
    const res = await axiosClient.get(endpoints.admin.specifications);
    return res.data;
  },

  getSpecificationOptions: async (specId: number): Promise<SpecOptionResponse[]> => {
    const res = await axiosClient.get<SpecOptionResponse[]>(`${endpoints.admin.specifications}/${specId}/options`);
    return res.data;
  },

  addSpecificationOption: async (specId: number, data: { code: string; displayValue: string }): Promise<SpecOptionResponse> => {
    const res = await axiosClient.post<SpecOptionResponse>(`${endpoints.admin.specifications}/${specId}/options`, data);
    return res.data;
  },

  // Brands & Categories
  getBrands: async (): Promise<{ id: number; name: string; logoUrl?: string; description?: string }[]> => {
    const res = await axiosClient.get(endpoints.admin.brands);
    return res.data;
  },

  getCategories: async (): Promise<any[]> => {
    const res = await axiosClient.get(endpoints.admin.categories);
    return res.data;
  },
};
