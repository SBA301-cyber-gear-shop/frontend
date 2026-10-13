export const endpoints = {
  auth: { login: "/api/auth/login", register: "/api/auth/register" },
  pcBuilder: { suggest: "/api/v1/pc-build/ai-suggest" },
} as const;
