import { axiosClient, endpoints } from "@/services";

export interface CheckoutDetailsPayload {
  pickupName: string;
  pickupPhone: string;
  note: string;
  promotionCode: string;
  itemVariantIds?: number[];
}

export const checkoutApi = {
  async validate(itemVariantIds?: (number | string)[], signal?: AbortSignal) {
    const payload =
      itemVariantIds && itemVariantIds.length > 0
        ? { itemVariantIds: itemVariantIds.map(Number) }
        : undefined;
    const { data } = await axiosClient.post(
      endpoints.checkout.validate,
      payload,
      { signal },
    );
    return data;
  },
  async preview(payload: CheckoutDetailsPayload, signal?: AbortSignal) {
    const { data } = await axiosClient.post(
      endpoints.checkout.preview,
      payload,
      { signal },
    );
    return data;
  },
};
