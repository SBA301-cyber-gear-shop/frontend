export const endpoints = {
  auth: { login: "/api/auth/login", register: "/api/auth/register" },
  pcBuilder: {
    suggest: "/api/v1/pc-build/ai-suggest",
    replacements: "/api/v1/pc-build/compatible-replacements",
    saveCustom: "/api/v1/pc-build/save",
    save: (buildId: number | string) => `/api/v1/pc-build/${buildId}/save`,
    myBuilds: "/api/v1/pc-build/my-builds",
    detail: (buildId: number | string) => `/api/v1/pc-build/${buildId}`,
    delete: (buildId: number | string) => `/api/v1/pc-build/${buildId}`,
  },
  aftersales: {
    cards: "/api/warranty-cards",
    requests: "/api/service-requests",
    request: (id: number | string) => `/api/service-requests/${id}`,
    transitions: (id: number | string) =>
      `/api/service-requests/${id}/transitions`,
    notes: (id: number | string) => `/api/service-requests/${id}/notes`,
    card: (id: number | string) => `/api/service-requests/${id}/warranty-card`,
    replacement: (id: number | string) =>
      `/api/service-requests/${id}/replacement`,
    myCards: "/api/my/warranty-cards",
  },
} as const;
