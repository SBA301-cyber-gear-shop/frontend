import { useEffect, useState } from "react";
import { Button, Modal, Notice } from "@/components/ui";
import { Field } from "@/components/form";
import { useStore } from "@/store";
import { reviewsApi } from "../api/reviewsApi";
import { ReviewMediaGallery } from "./ReviewMediaGallery";
import "./ReviewComposer.css";

export function ReviewViewer({ order, demoMode = false, onClose }) {
  const { data } = useStore();
  const [selectedId, setSelectedId] = useState(String(order.lines[0]?.orderItemId ?? order.lines[0]?.id));
  const selected = order.lines.find((line) => String(line.orderItemId ?? line.id) === selectedId);
  const [resource, setResource] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    reviewsApi.editor(Number(selectedId), abort.signal)
      .then((review) => { if (!abort.signal.aborted) setResource({ id: selectedId, review, error: review.reviewed ? "" : "Sản phẩm này chưa có đánh giá đã gửi." }); })
      .catch((error) => { if (!abort.signal.aborted) setResource({ id: selectedId, error: error.message || "Không tải được đánh giá." }); });
    return () => abort.abort();
  }, [selectedId, retry, demoMode]);
  const result = resource?.id === selectedId ? resource : null;
  const review = demoMode ? selected?.review || data.reviews.find((entry) => entry.orderId === order.id && entry.productId === selected?.id) : result?.review;
  return <Modal title="Đánh giá đã gửi" className="review-composer-modal" onClose={onClose}>
    <div className="review-composer">
      {order.lines.length > 1 && <Field label="Sản phẩm đã đánh giá">{(id) => <select id={id} className="input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{order.lines.map((line) => <option key={line.orderItemId ?? line.id} value={line.orderItemId ?? line.id}>{line.name}</option>)}</select>}</Field>}
      <div className="review-composer-product"><strong>{selected?.name}</strong><span>Đơn {order.id}</span></div>
      {!demoMode && !result ? <Notice>Đang tải đánh giá…</Notice> : result?.error ? <Notice tone="danger">{result.error}<Button tone="ghost" onClick={() => setRetry((value) => value + 1)}>Tải lại đánh giá</Button></Notice> : review ? <>
        <div className="review-star-row"><span>Chất lượng sản phẩm</span><span className="review-saved-stars" role="img" aria-label={`${review.rating} trên 5 sao`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></span></div>
        <div><strong>Nhận xét</strong><p className="review-saved-comment">{review.comment}</p></div>
        <ReviewMediaGallery media={review.media || []} />
        <p className="small muted">Đánh giá đã gửi chỉ có thể xem lại, không thể chỉnh sửa.</p>
      </> : <Notice>Không tìm thấy đánh giá đã gửi.</Notice>}
      <div className="review-composer-footer"><Button tone="secondary" onClick={onClose}>Đóng</Button></div>
    </div>
  </Modal>;
}
