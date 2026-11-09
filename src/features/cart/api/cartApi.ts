import { axiosClient, endpoints } from "@/services";

export const cartApi = {
  async get(signal?: AbortSignal) {
    const { data: body } = await axiosClient.get(endpoints.cart, { signal });
    const cart = body?.data ?? body;
    if (!Array.isArray(cart?.items))
      throw new Error("Dữ liệu giỏ hàng không hợp lệ.");
    return cart.items.map((item) => ({
      id: String(item.productVariantId),
      cartItemId: item.cartItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      name: item.productName,
      variant: item.variantName,
      image: item.imageUrl,
      stock: item.stockQuantity,
      available: item.available !== false,
    }));
  },
  async add(productVariantId: string | number, quantity: number) {
    await axiosClient.post(`${endpoints.cart}/items`, {
      productVariantId: Number(productVariantId),
      quantity,
    });
  },
  async addBatch(items: { productVariantId: string | number; quantity: number }[]) {
    await axiosClient.post(`${endpoints.cart}/items/batch`, {
      items: items.map((i) => ({
        productVariantId: Number(i.productVariantId),
        quantity: i.quantity || 1,
      })),
    });
  },
  async update(cartItemId: number, quantity: number) {
    await axiosClient.put(`${endpoints.cart}/items/${cartItemId}`, {
      quantity,
    });
  },
  async remove(cartItemId: number) {
    await axiosClient.delete(`${endpoints.cart}/items/${cartItemId}`);
  },
};
