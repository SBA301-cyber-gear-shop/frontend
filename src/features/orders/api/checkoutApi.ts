import { axiosClient, endpoints } from "@/services";

export interface CheckoutValidatePayload {
  cartItemIds?: (number | string)[];
  itemVariantIds?: (number | string)[];
}

export interface CheckoutDetailsPayload {
  pickupName: string;
  pickupPhone: string;
  note: string;
  promotionCode: string;
  cartItemIds?: number[];
  itemVariantIds?: number[];
}

export const checkoutApi = {
  async validate(
    ids?: (number | string)[] | CheckoutValidatePayload,
    signal?: AbortSignal
  ) {
    let payload: { cartItemIds?: number[]; itemVariantIds?: number[] } | undefined;
    if (ids) {
      if (Array.isArray(ids)) {
        if (ids.length > 0) {
          payload = { itemVariantIds: ids.map(Number) };
        }
      } else {
        const { cartItemIds, itemVariantIds } = ids;
        const cIds = Array.isArray(cartItemIds) && cartItemIds.length > 0 ? cartItemIds.map(Number) : undefined;
        const vIds = Array.isArray(itemVariantIds) && itemVariantIds.length > 0 ? itemVariantIds.map(Number) : undefined;
        if (cIds || vIds) {
          payload = { cartItemIds: cIds, itemVariantIds: vIds };
        }
      }
    }
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
