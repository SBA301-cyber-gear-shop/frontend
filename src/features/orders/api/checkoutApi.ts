import { axiosClient, endpoints } from "@/services";

export interface CheckoutDetailsPayload {
  pickupName: string;
  pickupPhone: string;
  note: string;
  promotionCode: string;
}

export const checkoutApi = {
  async validate(signal?: AbortSignal) {
    const { data } = await axiosClient.post(
      endpoints.checkout.validate,
      undefined,
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
