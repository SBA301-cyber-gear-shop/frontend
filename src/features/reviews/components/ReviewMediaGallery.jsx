import { useEffect, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { reviewsApi } from "../api/reviewsApi";
import { useStore } from "@/store";
import "./ReviewComposer.css";

export function ReviewMediaGallery({ reviewId, media }) {
  const { demoMode } = useStore();
  const [resource, setResource] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (media || !reviewId || demoMode) return;
    const abort = new AbortController();
    reviewsApi.media(String(reviewId), abort.signal)
      .then((items) => { if (!abort.signal.aborted) setResource({ id: reviewId, items, error: "" }); })
      .catch((error) => { if (!abort.signal.aborted) setResource({ id: reviewId, items: [], error: error.message || "Không tải được ảnh/video đánh giá." }); });
    return () => abort.abort();
  }, [reviewId, media, retry, demoMode]);
  const result = resource?.id === reviewId ? resource : null;
  if (!media && demoMode) return null;
  if (!media && reviewId && !result) return <p className="small muted">Đang tải ảnh/video…</p>;
  if (!media && result?.error) return <Notice tone="danger">{result.error} <Button tone="ghost" onClick={() => setRetry((value) => value + 1)}>Tải lại ảnh/video</Button></Notice>;
  const items = media || result?.items || [];
  if (!items.length) return null;
  return <div className="review-saved-gallery" aria-label="Ảnh và video đánh giá">{items.map((item, index) => item.mediaType === "image"
    ? <a key={item.id} href={reviewsApi.mediaUrl(item.url)} target="_blank" rel="noopener noreferrer" aria-label={`Mở ảnh đánh giá ${index + 1}`}><img src={reviewsApi.mediaUrl(item.url)} alt={`Ảnh đánh giá ${index + 1}`} loading="lazy" /></a>
    : <video key={item.id} src={reviewsApi.mediaUrl(item.url)} controls preload="metadata" aria-label="Video đánh giá" />)}</div>;
}
