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