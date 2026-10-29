import { useState, useEffect } from "react";
import { Badge, Empty } from "@/components/ui";
import { money, dateTime, formatShortOrderCode, formatOrderSuffix } from "@/utils";
import { ORDER_STATUS } from "../constants";

const STATUS_TONES = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  ready_for_pickup: "success",
  completed: "success",
  canceled: "danger",
};

const PAGE_SIZE = 8;

export function OrderSelector({
  orders = [],
  selected,
  onSelect,
  busy = false,
  search = "",
  setSearch,
  status = "all",
  setStatus,
}) {
  const [page, setPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Reset page to 1 when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  // If a selected order is outside the current page, switch to that page
  useEffect(() => {
    if (!selected) return;
    const index = orders.findIndex((o) => o.id === selected.id);
    if (index !== -1) {
      const targetPage = Math.floor(index / PAGE_SIZE) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      }
    }
  }, [selected?.id]);

  const totalPages = Math.ceil(orders.length / PAGE_SIZE) || 1;
  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedOrders = orders.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="order-selector-box">
      <div className="row section-title" style={{ marginBottom: "12px" }}>
        <input
          className="input flex"
          aria-label="Tra cứu đơn hàng"
          placeholder="Mã đơn (kể cả đuôi mã), SĐT hoặc tên khách…"
          value={search}
          disabled={busy}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Lọc trạng thái đơn"
          disabled={busy}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái ({orders.length})</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="order-selector-header">
        <div className="order-selector-header-title">
          <span>Danh sách đơn hàng</span>
          <span className="order-selector-count-badge">
            {orders.length} đơn
          </span>
        </div>
        {selected && (
          <button
            type="button"
            className="order-selector-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "▼ Hiện danh sách chọn đơn" : "▲ Thu gọn danh sách"}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {orders.length === 0 ? (
            <Empty
              title="Không tìm thấy đơn phù hợp"
              sub="Vui lòng thử tìm với từ khóa, số điện thoại hoặc trạng thái khác."
            />
          ) : (
            <>
              <div className="order-cards-grid">
                {pagedOrders.map((o) => {
                  const isSelected = o.id === selected?.id;
                  const tone = STATUS_TONES[o.status] || "info";
                  const totalItems =
                    o.lines?.reduce((sum, l) => sum + (l.quantity || 1), 0) || 0;

                  return (
                    <div
                      key={o.id}
                      className={`order-card-item ${isSelected ? "active" : ""}`}
                      onClick={() => !busy && onSelect(o)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          !busy && onSelect(o);
                        }
                      }}
                    >
                      <div className="order-card-header-row">
                        <span className="order-code-text" title={`Mã đầy đủ: ${o.id}`}>
                          {formatShortOrderCode(o.id)}
                        </span>
                        <Badge tone={tone}>
                          {ORDER_STATUS[o.status] || o.status}
                        </Badge>
                      </div>

                      <div className="order-card-customer-row">
                        <strong>{o.pickupName || "Khách tại quầy"}</strong>
                        {o.pickupPhone && (
                          <span className="muted">· {o.pickupPhone}</span>
                        )}
                      </div>

                      <div className="order-card-footer-row">
                        <span className="order-card-total">
                          {money(o.final)}
                        </span>
                        <span className="order-card-time" title={dateTime(o.createdAt)}>
                          {totalItems} SP · {dateTime(o.createdAt).split(" ")[1] || ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="order-pagination-bar">
                  <div className="order-pagination-summary">
                    Hiển thị {startIndex + 1} -{" "}
                    {Math.min(startIndex + PAGE_SIZE, orders.length)} trên{" "}
                    {orders.length} đơn
                  </div>
                  <div className="order-pagination-actions">
                    <button
                      type="button"
                      className="order-pagination-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Trước
                    </button>
                    <span className="order-pagination-indicator">
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="order-pagination-btn"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
