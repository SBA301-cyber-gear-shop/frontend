import { axiosClient } from "@/services";

export interface Province {
  id: number;
  name: string;
}

export interface District {
  id: number;
  provinceId: number;
  name: string;
}

export interface Ward {
  code: string;
  districtId: number;
  name: string;
}

export interface CalculateFeeResponse {
  totalFee: number;
  serviceName: string;
}

export interface TrackingLogItem {
  time: string;
  status: string;
  description: string;
  location: string;
}

export interface TrackingResponse {
  orderCode: string;
  trackingCode: string;
  carrier: string;
  status: string;
  statusText: string;
  expectedDeliveryTime: string;
  printUrl: string | null;
  codAmount: number;
  shippingFee: number;
  logs: TrackingLogItem[];
}

export const shippingApi = {
  async getProvinces(): Promise<Province[]> {
    const { data } = await axiosClient.get("/api/shipping/provinces");
    return data.data;
  },

  async getDistricts(provinceId: number): Promise<District[]> {
    const { data } = await axiosClient.get("/api/shipping/districts", {
      params: { provinceId },
    });
    return data.data;
  },

  async getWards(districtId: number): Promise<Ward[]> {
    const { data } = await axiosClient.get("/api/shipping/wards", {
      params: { districtId },
    });
    return data.data;
  },

  async calculateFee(
    toDistrictId: number,
    toWardCode: string,
    weightGram = 1000,
  ): Promise<CalculateFeeResponse> {
    const { data } = await axiosClient.post("/api/shipping/calculate-fee", {
      toDistrictId,
      toWardCode,
      weightGram,
    });
    return data.data;
  },

  async createShipment(orderCode: string): Promise<TrackingResponse> {
    const { data } = await axiosClient.post(
      `/api/shipping/orders/${encodeURIComponent(orderCode)}/create-shipment`,
    );
    return data.data;
  },

  async getTracking(orderCode: string): Promise<TrackingResponse> {
    const { data } = await axiosClient.get(
      `/api/shipping/orders/${encodeURIComponent(orderCode)}/tracking`,
    );
    return data.data;
  },

  async switchStatus(
    orderCode: string,
    status: string,
    note = "",
  ): Promise<TrackingResponse> {
    const { data } = await axiosClient.post(
      `/api/shipping/orders/${encodeURIComponent(orderCode)}/switch-status`,
      { status, note },
    );
    return data.data;
  },

  async getPrintToken(
    orderCode: string,
  ): Promise<{ token: string; printUrl: string }> {
    const { data } = await axiosClient.get(
      `/api/shipping/orders/${encodeURIComponent(orderCode)}/print-token`,
    );
    return data.data;
  },
};
