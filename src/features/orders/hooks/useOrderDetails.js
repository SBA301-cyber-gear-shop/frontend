import { useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { transitionOrder } from "../domain";
import { ORDER_STATUS } from "../constants";
import { useApiOrders } from "./useApiOrders";
import { ordersApi } from "../api/ordersApi";
import { reviewsApi } from "@/features/reviews";

export function useOrderDetails() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    {
      data: storeData,
      user,
      commit,
      notify,
      demoMode,
      reloadCatalog,
    } = useStore(),
    [confirm, setConfirm] = useState(false),
    [review, setReview] = useState(null),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState("");
  const remote = useApiOrders({ code: id });
  const [busy, setBusy] = useState(false),
    pending = useRef(false);
  const order = (demoMode ? storeData.orders : remote.orders).find(
    (o) => o.id === id && o.userId === user.id,
  );
  const data = demoMode
    ? storeData
    : {
        ...storeData,
        reviews: (order?.lines || [])
          .filter((line) => line.review)
          .map((line) => ({
            orderId: id,
            productId: line.id,
            ...line.review,
          })),
      };
  async function act(action) {
    if (!demoMode) {
      if (pending.current || action !== "cancel") return;
      pending.current = true;
      setBusy(true);
      try {
        remote.replaceOrder(await ordersApi.cancel(id));
        setConfirm(false);
        notify("Đã hủy đơn và hoàn tồn kho.");
      } catch (error) {
        notify(error.message, "danger");
      } finally {
        pending.current = false;
        setBusy(false);
      }
      return;
    }
    try {
      commit((d) => transitionOrder(d, id, action));
      setConfirm(false);
      notify("Đã cập nhật đơn demo.");
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  const labels = Object.values(ORDER_STATUS).slice(0, 5),
    index = Object.keys(ORDER_STATUS).indexOf(order?.status);
  async function saveReview() {
    if (!comment.trim()) return notify("Nhập nội dung đánh giá.", "danger");
    if (!demoMode) {
      if (pending.current) return;
      const line = order?.lines.find((item) => item.id === review);
      if (!line) return;
      pending.current = true;
      setBusy(true);
      try {
        await reviewsApi.save(line.orderItemId, rating, comment.trim());
        remote.refresh();
        void reloadCatalog();
        setReview(null);
        notify("Đã lưu đánh giá.");
      } catch (error) {
        notify(error.message, "danger");
      } finally {
        pending.current = false;
        setBusy(false);
      }
      return;
    }
    commit((d) => ({
      ...d,
      reviews: [
        ...d.reviews.filter(
          (r) => !(r.orderId === id && r.productId === review),
        ),
        {
          id: crypto.randomUUID(),
          orderId: id,
          productId: review,
          rating,
          comment: comment.trim(),
          name: user.name,
        },
      ],
    }));
    setReview(null);
    notify("Đã lưu đánh giá.");
  }
  return {
    id,
    params,
    data,
    commit,
    notify,
    confirm,
    setConfirm,
    review,
    setReview,
    rating,
    setRating,
    comment,
    setComment,
    order,
    act,
    labels,
    index,
    saveReview,
    loading: remote.loading,
    error: remote.error,
    refresh: remote.refresh,
    busy,
    demoMode,
  };
}
