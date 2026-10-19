export const endpoints = {
  auth: { login: "/api/auth/login", register: "/api/auth/register" },
  pcBuilder: { suggest: "/api/v1/pc-build/ai-suggest" },
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
} as const;
