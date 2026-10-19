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
} as const;
