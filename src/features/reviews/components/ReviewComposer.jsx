import { useEffect, useRef, useState } from "react";
import { Button, Modal, Notice } from "@/components/ui";
import { Field } from "@/components/form";
import { useStore } from "@/store";
import { reviewsApi } from "../api/reviewsApi";
import "./ReviewComposer.css";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoTypes = ["video/mp4", "video/webm"];

export function ReviewComposer({ order, demoMode = false, onClose, onSaved }) {
  const { data, user, commit } = useStore();
  const [selectedId, setSelectedId] = useState(order.lines.find((line) => !line.review)?.orderItemId ?? order.lines[0]?.orderItemId ?? order.lines[0]?.id);
  const selected = order.lines.find((line) => (line.orderItemId ?? line.id) === selectedId);
  const previousReview = selected?.review || (demoMode ? data.reviews.find((entry) => entry.orderId === order.id && entry.productId === selected?.id) : null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [retained, setRetained] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadedId, setLoadedId] = useState(null);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const uploads = useRef([]);
  const pending = useRef(false);
  const loading = loadedId !== selectedId;
  const urls = files.map((file) => file.url);
  const imageCount = retained.filter((file) => file.mediaType === "image").length + files.filter((file) => file.mediaType === "image").length;
  const videoCount = retained.length + files.length - imageCount;

  useEffect(() => {
    const abort = new AbortController();
    if (demoMode) {
      Promise.resolve().then(() => {
        if (abort.signal.aborted) return;
        setRating(previousReview?.rating || 5); setComment(previousReview?.comment || "");
        setRetained([]); setLoadedId(selectedId); setLoadFailed(false);
      });
    } else {
      reviewsApi.editor(selectedId, abort.signal).then((value) => {
        if (abort.signal.aborted) return;
        if (value.reviewed) { setError("Sản phẩm này đã được đánh giá. Vui lòng đóng khung và chọn Xem đánh giá."); setLoadFailed(true); setLoadedId(selectedId); return; }
        setRating(value.rating || 5); setComment(value.comment || ""); setRetained(value.media || []); setError(""); setLoadedId(selectedId); setLoadFailed(false);
      }).catch((failure) => { if (!abort.signal.aborted) { setError(failure.message || "Không tải được thông tin đánh giá."); setLoadedId(selectedId); setLoadFailed(true); } });
    }
    return () => abort.abort();
  }, [selectedId, retry, demoMode, previousReview]);
  useEffect(() => () => uploads.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  function chooseFiles(event) {
    const picked = [...(event.target.files || [])]; event.target.value = "";
    const next = []; let images = imageCount; let videos = videoCount;
    for (const file of picked) {
      const image = imageTypes.includes(file.type); const video = videoTypes.includes(file.type);
      if (!image && !video) { setError("Chỉ nhận ảnh JPG, PNG, WEBP, GIF hoặc video MP4, WEBM."); return; }
      if (!file.size || file.size > (image ? 5 : 30) * 1024 * 1024) { setError(image ? "Mỗi ảnh không quá 5 MB và không được rỗng." : "Video không quá 30 MB và không được rỗng."); return; }
      if (image) images++; else videos++;
      if (images > 3 || videos > 1) { setError("Mỗi sản phẩm được đính kèm tối đa 3 ảnh và 1 video."); return; }
      next.push({ file, mediaType: image ? "image" : "video" });
    }
    const added = next.map((item) => ({ ...item, url: URL.createObjectURL(item.file) }));
    uploads.current = [...uploads.current, ...added]; setFiles((current) => [...current, ...added]); setError("");
  }
  function removeFile(index) {
    const item = files[index]; URL.revokeObjectURL(item.url);
    uploads.current = uploads.current.filter((entry) => entry.url !== item.url);
    setFiles((current) => current.filter((_, i) => i !== index));
  }
  function selectProduct(value) {
    uploads.current.forEach((item) => URL.revokeObjectURL(item.url)); uploads.current = [];
    setFiles([]); setRetained([]); setError(""); setLoadedId(null); setSelectedId(value);
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current || loading || loadFailed || !selected || !comment.trim()) return;
    if (previousReview) { setError("Sản phẩm trong đơn này đã được đánh giá. Mỗi sản phẩm chỉ được đánh giá một lần."); return; }
    if (demoMode) {
      if (files.length) { setError("Upload ảnh/video cần kết nối API thật. Vui lòng dùng tài khoản backend để gửi đánh giá."); return; }
      commit((current) => ({ ...current, reviews: [...current.reviews.filter((entry) => !(entry.orderId === order.id && entry.productId === selected.id)), { id: previousReview?.id || crypto.randomUUID(), orderId: order.id, productId: selected.id, rating, comment: comment.trim(), name: user.name }] }));
      onSaved?.(); onClose(); return;
    }
    pending.current = true; setSaving(true); setError("");
    try {
      await reviewsApi.saveWithMedia(selectedId, rating, comment.trim(), retained.map((item) => item.id), files.map((item) => item.file));
      onSaved?.(); onClose();
    } catch (failure) { setError(failure.message || "Không gửi được đánh giá. Vui lòng thử lại."); }
    finally { pending.current = false; setSaving(false); }
  }
  const safeClose = (event) => { if (pending.current) { event?.preventDefault(); return; } onClose(); };
  return (
    <Modal title="Đánh giá sản phẩm" className="review-composer-modal" onClose={safeClose}>
      <form className="review-composer" onSubmit={submit}>
        {order.lines.length > 1 ? <Field label="Sản phẩm đánh giá">{(id) => <select id={id} className="input" disabled={saving} value={selectedId} onChange={(event) => selectProduct(order.lines.find((line) => String(line.orderItemId ?? line.id) === event.target.value)?.orderItemId ?? event.target.value)}>{order.lines.map((line) => <option key={line.orderItemId ?? line.id} value={line.orderItemId ?? line.id}>{line.name}</option>)}</select>}</Field> : <div className="review-composer-product"><strong>{selected?.name}</strong><span>Đơn {order.id}</span></div>}
        {loading ? <Notice>Đang tải đánh giá…</Notice> : <>
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="review-star-row"><span>Chất lượng sản phẩm</span><div className="review-stars" role="radiogroup" aria-label="Số sao">{[1,2,3,4,5].map((star) => <label key={star} className={star <= rating ? "is-selected" : ""}><input type="radio" name="review-rating" value={star} checked={rating === star} disabled={saving} aria-label={`${star} sao`} onChange={() => setRating(star)} /><span aria-hidden="true">★</span></label>)}</div><strong className="review-rating-label">{["", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"][rating]}</strong></div>
          <Field label="Nhận xét" hint={`${comment.length}/5000 ký tự`}>{(id) => <textarea id={id} className="input" rows={5} required maxLength={5000} disabled={saving} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ trải nghiệm về chất lượng, tính năng và sản phẩm bạn nhận được…" />}</Field>
          <div className="review-upload-actions"><label className={`review-upload-button ${saving || imageCount >= 3 ? "is-disabled" : ""}`}><span aria-hidden="true">▧</span> Thêm ảnh ({imageCount}/3)<input type="file" accept={imageTypes.join(",")} multiple disabled={saving || imageCount >= 3} aria-label="Thêm ảnh đánh giá" onChange={chooseFiles} /></label><label className={`review-upload-button ${saving || videoCount >= 1 ? "is-disabled" : ""}`}><span aria-hidden="true">▷</span> Thêm video ({videoCount}/1)<input type="file" accept={videoTypes.join(",")} disabled={saving || videoCount >= 1} aria-label="Thêm video đánh giá" onChange={chooseFiles} /></label></div>
          <p className="review-upload-hint">Tối đa 3 ảnh (5 MB/ảnh) và 1 video (30 MB). Ảnh: JPG, PNG, WEBP, GIF. Video: MP4, WEBM.</p>
          <div className="review-media-previews">{retained.map((item) => <div className="review-media-preview" key={item.id}>{item.mediaType === "image" ? <img src={reviewsApi.mediaUrl(item.url)} alt="Ảnh đánh giá đã lưu" /> : <video src={reviewsApi.mediaUrl(item.url)} controls preload="metadata" />}<button type="button" disabled={saving} aria-label="Xóa tệp đã lưu" onClick={() => setRetained((current) => current.filter((entry) => entry.id !== item.id))}>×</button></div>)}{files.map((item,index) => <div className="review-media-preview" key={urls[index]}>{item.mediaType === "image" ? <img src={item.url} alt={`Ảnh đánh giá ${index+1}`} /> : <video src={item.url} controls preload="metadata" />}<button type="button" disabled={saving} aria-label={`Xóa tệp ${item.file.name}`} onClick={() => removeFile(index)}>×</button></div>)}</div>
          <div className="review-composer-footer"><Button tone="secondary" disabled={saving} onClick={safeClose}>Trở lại</Button><Button type="submit" disabled={saving || loadFailed || !comment.trim()}>{saving ? "Đang gửi…" : "Lưu đánh giá"}</Button></div>
          {loadFailed && <Button tone="ghost" disabled={saving} onClick={() => { setLoadedId(null); setRetry((value) => value+1); }}>Tải thông tin đã lưu</Button>}
        </>}
      </form>
    </Modal>
  );
}
