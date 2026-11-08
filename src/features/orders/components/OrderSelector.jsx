import { useState, useEffect } from "react";
import { Badge,
  Icon, Empty } from "@/components/ui";
import { money, dateTime, formatShortOrderCode } from "@/utils";
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
  statusCounts = {},
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
      {/* 1. Ô tìm kiếm nhanh */}
      <div style={{ marginBottom: "12px", position: "relative" }}>
        <input
          className="input full"
          aria-label="Tra cứu đơn hàng"
          placeholder="🔍 Tìm nhanh theo mã đơn (kể cả đuôi mã), SĐT hoặc tên khách…"
          value={search}
          disabled={busy}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            title="Xóa tìm kiếm"
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "#e2e8f0",
              border: 0,
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "11px",
              color: "#475569",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Thanh Status Pills lọc nhanh trực quan với số lượng từng trạng thái */}
      <div className="status-pills-bar" role="tablist" aria-label="Lọc nhanh theo trạng thái">
        <button
          type="button"
          role="tab"
          aria-selected={status === "all"}
          className={`status-pill-btn ${status === "all" ? "active" : ""} ${(statusCounts.all ?? 0) > 0 ? "has-items" : "empty-items"}`}
          onClick={() => setStatus("all")}
        >
          <span>Tất cả</span>
          <span className="status-pill-count">{statusCounts.all ?? orders.length}</span>
        </button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => {
          const count = statusCounts[k] ?? 0;
          const isActive = status === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`status-pill-btn ${isActive ? "active" : ""} ${count > 0 ? "has-items" : "empty-items"}`}
              onClick={() => setStatus(k)}
            >
              <span>{v}</span>
              <span className="status-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tiêu đề danh sách & Nút thu gọn */}
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
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          {o.deliveryType === "shipping" ? (
                            <Badge tone="info"><Icon name="truck" style={{ verticalAlign: "-2px", marginRight: "4px" }} /> GHN</Badge>
                          ) : (
                            <Badge tone="neutral"><Icon name="store" style={{ verticalAlign: "-2px", marginRight: "4px" }} /> Quầy</Badge>
                          )}
                          <Badge tone={tone}>
                            {ORDER_STATUS[o.status] || o.status}
                          </Badge>
                        </div>
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
