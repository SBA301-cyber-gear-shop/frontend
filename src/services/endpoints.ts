export const endpoints = {
  auth: { login: "/api/auth/login", register: "/api/auth/register", me: "/api/auth/me" },
  pcBuilder: {
    analyze: "/api/pc-build/requirements/analyze",
    auto: "/api/pc-build/builds/auto",
    validate: "/api/pc-build/builds/validate",
    replacements: "/api/pc-build/builds/replacements",
    save: "/api/pc-build/builds/save",
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
