export const endpoints = {
  auth: { login: "/api/auth/login", register: "/api/auth/register", me: "/api/auth/me" },
  pcBuilder: {
    suggest: "/api/v1/pc-build/ai-suggest",
    replacements: "/api/v1/pc-build/compatible-replacements",
    validate: "/api/v1/pc-build/validate",
    options: "/api/v1/pc-build/options",
    peripherals: "/api/v1/pc-build/peripherals",
    saveCustom: "/api/v1/pc-build/save",
    myBuilds: "/api/v1/pc-build/my-builds",
    detail: (buildId: number | string) => `/api/v1/pc-build/${buildId}`,
    delete: (buildId: number | string) => `/api/v1/pc-build/${buildId}`,
  },
  catalog: {
    products: "/api/catalog/products",
    categories: "/api/catalog/categories",
  },
  admin: {
    products: "/api/admin/products",
    specifications: "/api/admin/specifications",
    categories: "/api/admin/categories",
    brands: "/api/admin/brands",
  },
  products: "/api/products",
  cart: "/api/orders/cart",
  checkout: {
    validate: "/api/checkout/validate",
    preview: "/api/checkout/details/preview",
  },
  orders: "/api/orders",
  orderOperations: "/api/operations/orders",
  warranties: "/api/me/warranties",
  support: {
    chat: "/api/ai/customer-support",
    poll: "/api/ai/customer-support/messages",
    staff: {
      sessions: "/api/staff/live-chat/sessions",
      session: (id: string) => `/api/staff/live-chat/sessions/${id}`,
      messages: (id: string) => `/api/staff/live-chat/sessions/${id}/messages`,
      assign: (id: string) => `/api/staff/live-chat/sessions/${id}/assign`,
      send: (id: string) => `/api/staff/live-chat/sessions/${id}/messages`,
      close: (id: string) => `/api/staff/live-chat/sessions/${id}/close`,
    },
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
    intakes: "/api/service-intakes",
    intake: (id: number | string) => `/api/service-intakes/${id}`,
    intakeReturn: (id: number | string) => `/api/service-intakes/${id}/return`,
    intakeCancel: (id: number | string) => `/api/service-intakes/${id}/cancel`,
    intakeComponents: (id: number | string) =>
      `/api/service-intakes/${id}/requests`,
    intakeNoFault: (id: number | string) =>
      `/api/service-intakes/${id}/no-fault-rest`,
    myIntakes: "/api/my/service-intakes",
  },
} as const;
