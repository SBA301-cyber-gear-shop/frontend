import { axiosClient } from "@/services";

export const paymentApi = {
  async callbackVnPay(payload: Record<string, string>) {
    const { data } = await axiosClient.post("/api/payment/vnpay/callback", payload);
    return data;
  },
  async createVnPayUrl(orderCode: string) {
    const { data } = await axiosClient.post(
      `/api/payment/vnpay/create-url?orderCode=${encodeURIComponent(orderCode)}`
    );
    return data;
  },
};
