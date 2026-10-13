import { request, endpoints } from "@/services";
export const authApi = {
  login: (payload) =>
    request(endpoints.auth.login, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request(endpoints.auth.register, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
