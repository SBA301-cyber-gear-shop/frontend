import { useProductFeedback } from "../hooks/useProductFeedback";

const countFormat = new Intl.NumberFormat("vi-VN");
const ratingFormat = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function ProductFeedback({ product }) {
  const { averageRating, reviewCount, buyerCount } =
    useProductFeedback(product);
  const rating = Math.max(0, Math.min(5, averageRating));
  const ratingText = ratingFormat.format(rating);
  const reviewText = countFormat.format(reviewCount);

  return (
    <div className="product-feedback">
      {reviewCount > 0 ? (
        <span
          className="product-feedback-rating"
          role="img"
          aria-label={`${ratingText} trên 5 sao, ${reviewText} đánh giá`}
        >
          <span className="product-feedback-stars" aria-hidden="true">
            <span>★★★★★</span>
            <span
              className="product-feedback-stars-fill"
              style={{ width: `${(rating / 5) * 100}%` }}
            >
              ★★★★★
            </span>
          </span>
          <strong>{ratingText}/5</strong>
          <span className="muted">({reviewText} đánh giá)</span>
        </span>
      ) : (
        <span className="muted">Chưa có đánh giá</span>
      )}
      <span className="product-feedback-buyers">
        {countFormat.format(buyerCount)} người đã mua
      </span>
    </div>
  );
}
