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
      pcCustomId: item.pcCustomId ?? null,
      pcCustomName: item.pcCustomName ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      name: item.productName,
      variant: item.variantName,
      image: item.imageUrl,
      stock: item.stockQuantity,
      available: item.available !== false,
    }));
  },
  async add(productVariantId: string | number, quantity: number, pcCustomId?: number | null) {
    await axiosClient.post(`${endpoints.cart}/items`, {
      productVariantId: Number(productVariantId),
      quantity,
      pcCustomId: pcCustomId || undefined,
    });
  },
  async addBatch(items: { productVariantId: string | number; quantity: number }[], pcCustomId?: number | null) {
    await axiosClient.post(`${endpoints.cart}/items/batch`, {
      items: items.map((i) => ({
        productVariantId: Number(i.productVariantId),
        quantity: i.quantity || 1,
        pcCustomId: pcCustomId || undefined,
      })),
      pcCustomId: pcCustomId || undefined,
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
  async removePcSet(pcCustomId: number) {
    await axiosClient.delete(`${endpoints.cart}/items/pc-build/${pcCustomId}`);
  },
  async detachPcSet(pcCustomId: number) {
    await axiosClient.post(`${endpoints.cart}/items/pc-build/${pcCustomId}/detach`);
  },
};
