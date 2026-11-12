import { axiosClient, endpoints } from "@/services";
import { apiCache } from "@/services/apiCache";

export interface ProductSale {
  productId: number;
  productName: string;
  configured: boolean;
  enabled: boolean;
  percentage: number | null;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number | null;
  start: string | null;
  end: string | null;
  active: boolean;
  variantIds?: number[] | null;
  variants: {
    id: number;
    name: string;
    basePrice: number;
    regularPrice: number;
    effectivePrice: number;
  }[];
}

const invalidatePrices = () => {
  apiCache.invalidate("catalog_products");
  apiCache.invalidate("admin_product");
  apiCache.invalidate("admin_variant");
};

export const productSalesApi = {
  async search(search: string): Promise<
    {
      productId: number;
      productName: string;
      brand: string;
      variantCount: number;
    }[]
  > {
    const { data } = await axiosClient.get(endpoints.promotions.saleProducts, {
      params: { search },
    });
    return data;
  },
  async list(signal?: AbortSignal): Promise<ProductSale[]> {
    const { data } = await axiosClient.get(endpoints.promotions.sales, { signal });
    return data;
  },
  async get(productId: number): Promise<ProductSale> {
    const { data } = await axiosClient.get(endpoints.promotions.sale(productId));
    return data;
  },
  async save(
    productId: number,
    payload: {
      enabled: boolean;
      discountType: "percentage" | "fixed_amount";
      discountValue: number;
      start: string;
      end: string;
      variantIds?: number[] | null;
    },
  ): Promise<ProductSale> {
    const { data } = await axiosClient.put(endpoints.promotions.sale(productId), payload);
    invalidatePrices();
    return data;
  },
  async remove(productId: number) {
    await axiosClient.delete(endpoints.promotions.sale(productId));
    invalidatePrices();
  },
};
