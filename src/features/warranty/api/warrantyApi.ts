import { axiosClient, endpoints } from "@/services";
export const warrantyApi = {
  async mine(signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.warranties, { signal });
    return data;
  },
};
