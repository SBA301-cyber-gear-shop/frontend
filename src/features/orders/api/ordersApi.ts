import { axiosClient, endpoints } from "@/services";

function orderView(order) {
  return {
    id: order.orderCode,
    databaseId: order.id,
    userId: order.userId,
    status: order.status,
    pickupName: order.pickupName,
    pickupPhone: order.pickupPhone,
    note: order.note || "",
    cancelReason: order.cancelReason || "",
    total: order.totalAmount,
    discount: order.discountAmount,
    final: order.finalAmount,
    promotion: order.promotionCode,
    method:
      order.methodType === "cash"
        ? order.deliveryType === "shipping" ? "cod" : "store"
        : order.methodType,
    payment: order.paymentStatus,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    paymentUrl: order.paymentUrl,
    deliveryType: order.deliveryType || "store",
    shippingFee: order.shippingFee || 0,
    shippingAddress: order.shippingAddress || "",
    trackingCode: order.trackingCode || null,
    carrier: order.carrier || "GHN",
    completedAt: order.status === "completed" ? order.updatedAt : undefined,
    lines: order.items.map((item) => ({
      id: String(item.productVariantId),
      orderItemId: item.id,
      name: item.productName,
      variant: "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      warranty: item.warrantyPeriodMonths,
      review: item.rating
        ? { rating: item.rating, comment: item.reviewComment }
        : null,
    })),
  };
}

const codePath = (base, code) => `${base}/${encodeURIComponent(code)}`;
export const ordersApi = {
  async warrantyCards(code: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.aftersales.cards, { params: { q: code }, signal });
    return data.data ?? data;
  },
  async place(payload, idempotencyKey: string) {
    const { data } = await axiosClient.post(endpoints.orders, payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return orderView(data);
  },
  async mine(signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.orders, { signal });
    return data.map(orderView);
  },
  async one(code: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(codePath(endpoints.orders, code), {
      signal,
    });
    return orderView(data);
  },
  async operations(search = "", status = "all", signal?: AbortSignal) {
    const { data } = await axiosClient.get(endpoints.orderOperations, {
      signal,
      params: { search, ...(status !== "all" ? { status } : {}) },
    });
    return data.map(orderView);
  },
  async advance(code: string, status: string) {
    const { data } = await axiosClient.patch(
      `${codePath(endpoints.orderOperations, code)}/status`,
      { status },
    );
    return orderView(data);
  },
  async shippingSerials(code: string, devices: { orderItemId: number; serialNumber: string }[]) {
    const { data } = await axiosClient.post(`${codePath(endpoints.orderOperations, code)}/shipping-serials`, { devices });
    return orderView(data);
  },
  async collect(code: string, receivedAmount: number, reference: string) {
    const { data } = await axiosClient.post(
      `${codePath(endpoints.orderOperations, code)}/collect`,
      { receivedAmount, reference },
    );
    return orderView(data);
  },
  async cashCollection(code: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get(
      `${codePath(endpoints.orderOperations, code)}/cash-collection`,
      { signal },
    );
    return data || null;
  },
  async handover(code: string, payload) {
    const { data } = await axiosClient.post(
      `${codePath(endpoints.orderOperations, code)}/handover`,
      payload,
    );
    return orderView(data);
  },
  async cancel(code: string, reason = "", operations = false) {
    const { data } = await axiosClient.post(
      `${codePath(operations ? endpoints.orderOperations : endpoints.orders, code)}/cancel`,
      operations ? { reason } : undefined,
    );
    return orderView(data);
  },
};
