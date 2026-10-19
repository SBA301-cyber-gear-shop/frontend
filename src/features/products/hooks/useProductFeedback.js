import { useStore } from "@/store";

export function useProductFeedback(product) {
  const { data, demoMode } = useStore();
  if (!demoMode) {
    return {
      averageRating: product.averageRating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      buyerCount: product.buyerCount ?? 0,
    };
  }

  const completedOrders = data.orders.filter(
    (order) => order.status === "completed",
  );
  const completedIds = new Set(completedOrders.map((order) => order.id));
  const reviews = data.reviews.filter(
    (review) =>
      review.productId === product.id && completedIds.has(review.orderId),
  );
  const buyers = new Set(
    completedOrders
      .filter((order) => order.lines.some((line) => line.id === product.id))
      .map((order) => order.userId),
  );
  return {
    averageRating: reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0,
    reviewCount: reviews.length,
    buyerCount: buyers.size,
  };
}
