import { axiosClient, endpoints } from "@/services";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

type AuthResponseBody = AuthResponse | { data: AuthResponse };

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponseBody> {
    const { data } = await axiosClient.post<AuthResponseBody>(
      endpoints.auth.login,
      payload,
    );
    return data;
  },
  async updateProfile(payload: {
    fullName: string;
    phone: string;
    address: string;
  }) {
    const { data } = await axiosClient.put(endpoints.auth.me, payload);
    return data.data;
  },
  async register(payload: RegisterPayload): Promise<AuthResponseBody> {
    const { data } = await axiosClient.post<AuthResponseBody>(
      endpoints.auth.register,
      payload,
    );
    return data;
  },
};
