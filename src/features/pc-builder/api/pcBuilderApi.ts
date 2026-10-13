import { axiosClient, endpoints } from "@/services";
import type {
  AiBuildRequestPayload,
  AiBuildSuggestionResponse,
} from "../types/pcBuilder.types";
export const pcBuilderApi = {
  async suggest(
    payload: AiBuildRequestPayload,
  ): Promise<AiBuildSuggestionResponse> {
    const { data } = await axiosClient.post<
      AiBuildSuggestionResponse | { data: AiBuildSuggestionResponse }
    >(endpoints.pcBuilder.suggest, payload);
    if (data == null) return null;
    return "data" in data ? data.data : data;
  },
};
