import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { transitionOrder } from "../domain";
import { ORDER_STATUS } from "../constants";

export function useOrderDetails() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    { data, user, commit, notify } = useStore(),
    [confirm, setConfirm] = useState(false),
    [review, setReview] = useState(null),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState("");
  const order = data.orders.find((o) => o.id === id && o.userId === user.id);
  function act(action) {
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
  function saveReview() {
    if (!comment.trim()) return notify("Nhập nội dung đánh giá.", "danger");
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
  };
}
