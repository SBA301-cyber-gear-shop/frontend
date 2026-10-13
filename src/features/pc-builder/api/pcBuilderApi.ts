import { request, endpoints } from "@/services";
import type {
  AiBuildRequestPayload,
  AiBuildSuggestionResponse,
} from "../types/pcBuilder.types";
export const pcBuilderApi = {
  async suggest(
    payload: AiBuildRequestPayload,
  ): Promise<AiBuildSuggestionResponse> {
    const response = await request(endpoints.pcBuilder.suggest, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response?.data ?? response;
  },
};
