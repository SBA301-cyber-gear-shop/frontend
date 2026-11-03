import { useEffect, useState } from "react";
import { money } from "@/utils";
import type { SavedPcBuildDetail } from "../types/pcBuilder.types";
import { ROLE_LABELS } from "../domain";
import { visibleSpecs } from "../domain/buildLines";
import { pcBuilderApi } from "../api/pcBuilderApi";

interface SavedBuildDetailModalProps {
  isOpen: boolean;
  buildId: number | null;
  onClose: () => void;
  onAddToCart: (detail: SavedPcBuildDetail) => void;
  onLoadToBuilder: (detail: SavedPcBuildDetail) => void;
}

export function SavedBuildDetailModal({
  isOpen,
  buildId,
  onClose,
  onAddToCart,
  onLoadToBuilder,
}: SavedBuildDetailModalProps) {
  const [detail, setDetail] = useState<SavedPcBuildDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || buildId == null) {
      setDetail(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    pcBuilderApi
      .getSavedBuildDetail(buildId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("[SavedBuildDetailModal] Lỗi tải chi tiết cấu hình:", err);
          setErrorMessage(
            err instanceof Error ? err.message : "Không thể tải chi tiết cấu hình lúc này",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, buildId]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal-backdrop ${isOpen ? "is-open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-card"
        style={{ maxWidth: 860, width: "95%" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <h3>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{detail?.buildName || "Chi tiết cấu hình PC đã lưu"}</span>
            </h3>
            {detail && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: detail.isOrdered ? "#e6f6f1" : "#eff6ff",
                    color: detail.isOrdered ? "#148465" : "#2563eb",
                    border: `1px solid ${detail.isOrdered ? "#a7f3d0" : "#bfdbfe"}`,
                  }}
                >
                  {detail.isOrdered ? `ĐÃ ĐẶT HÀNG (#${detail.orderId})` : "BẢN LƯU NHÁP"}
                </span>
                <span style={{ fontSize: 13, color: "var(--muted, #657185)" }}>
                  Mã cấu hình: #{detail.buildId}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {isLoading ? (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <div
                className="loading-spinner"
                style={{ width: 36, height: 36, marginBottom: 16 }}
              />
              <div style={{ fontSize: 14, color: "var(--muted, #657185)", fontWeight: 500 }}>
                Đang lấy thông số và hình ảnh các linh kiện...
              </div>
            </div>
          ) : errorMessage ? (
            <div style={{ padding: 32, textAlign: "center", color: "#d91f31" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Lỗi tải cấu hình
              </div>
              <div>{errorMessage}</div>
            </div>
          ) : detail && detail.items ? (
            <div className="saved-detail-table-wrap">
              <table className="parts-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, #e2e8f0)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", width: 110 }}>Linh kiện</th>
                    <th style={{ padding: "10px 12px" }}>Tên sản phẩm & Thông số</th>
                    <th style={{ padding: "10px 12px", width: 120, textAlign: "right" }}>Đơn giá</th>
                    <th style={{ padding: "10px 12px", width: 70, textAlign: "center" }}>SL</th>
                    <th style={{ padding: "10px 12px", width: 130, textAlign: "right" }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item, idx) => {
                    const roleLabel = ROLE_LABELS[item.role] || item.role.toUpperCase();
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid var(--border, #f1f5f9)",
                          verticalAlign: "middle",
                        }}
                      >
                        <td style={{ padding: "12px 12px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            {roleLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                              src={item.imageUrl || "/placeholder-pc.svg"}
                              alt={item.productName}
                              style={{
                                width: 42,
                                height: 42,
                                objectFit: "contain",
                                borderRadius: 6,
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-pc.svg";
                              }}
                            />
                            <div>
                              <strong style={{ display: "block", fontSize: 13, color: "var(--ink, #152237)" }}>
                                {item.productName}
                              </strong>
                              {item.variantName && (
                                <span style={{ fontSize: 11, color: "var(--muted, #657185)" }}>
                                  {item.variantName}
                                </span>
                              )}
                              {visibleSpecs(item.specs).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                  {visibleSpecs(item.specs).slice(0, 3).map(([k, v]) => (
                                    <span
                                      key={k}
                                      style={{
                                        fontSize: 10,
                                        background: "rgba(37,99,235,0.06)",
                                        color: "#2563eb",
                                        padding: "1px 5px",
                                        borderRadius: 3,
                                      }}
                                    >
                                      {k}: {v}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontSize: 13 }}>
                          {money(item.unitPrice)}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            padding: "12px 12px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--ink, #152237)",
                          }}
                        >
                          {money(item.subtotal || item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {detail && (
          <div
            className="modal-footer"
            style={{
              padding: "14px 20px",
              background: "#f8fafc",
              borderTop: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              borderRadius: "0 0 12px 12px",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--muted, #657185)", display: "block" }}>
                Tổng chi phí cấu hình:
              </span>
              <strong style={{ fontSize: 18, color: "#148465", fontWeight: 800 }}>
                {money(detail.totalPrice)}
              </strong>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="btn-modal-action secondary"
                onClick={() => {
                  onLoadToBuilder(detail);
                  onClose();
                }}
                title="Tải cấu hình vào bộ lắp ráp để chỉnh sửa linh kiện"
                style={{
                  padding: "9px 14px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                🛠️ Tải vào bộ lắp ráp
              </button>

              <button
                type="button"
                className="btn-modal-action primary"
                onClick={() => {
                  onAddToCart(detail);
                  onClose();
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Thêm vào giỏ & Đặt hàng</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
