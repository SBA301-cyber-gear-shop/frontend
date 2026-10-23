import { useEffect } from "react";
import { money } from "@/utils";
import type {
  ComponentRole,
  ReplacementCandidate,
} from "../types/pcBuilder.types";
import { ROLE_LABELS } from "../domain";

interface ReplacePartModalProps {
  isOpen: boolean;
  role: ComponentRole | null;
  candidates: ReplacementCandidate[];
  isLoading?: boolean;
  onSelect: (candidate: ReplacementCandidate) => void;
  onClose: () => void;
}

export function ReplacePartModal({
  isOpen,
  role,
  candidates,
  isLoading = false,
  onSelect,
  onClose,
}: ReplacePartModalProps) {
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

  if (!isOpen || !role) return null;

  const roleTitle = ROLE_LABELS[role] || role.toUpperCase();

  return (
    <div
      className={`modal-backdrop ${isOpen ? "is-open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>Thay đổi linh kiện: {roleTitle}</span>
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              fontSize: 13,
              color: "var(--muted, #657185)",
              marginBottom: 16,
            }}
          >
            Lọc danh sách các mẫu linh kiện trong kho đang còn hàng và đối chiếu
            quy tắc tương thích tự động với hệ thống:
          </div>

          {isLoading ? (
            <div style={{ padding: "36px 16px", textAlign: "center" }}>
              <div
                className="loading-spinner"
                style={{ width: 32, height: 32, marginBottom: 12 }}
              />
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted, #657185)",
                  fontWeight: 500,
                }}
              >
                Đang đối chiếu quy chuẩn phần cứng và tải linh kiện tương thích từ kho...
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--muted, #657185)",
              }}
            >
              Chưa có linh kiện thay thế phù hợp cho danh mục này.
            </div>
          ) : (
            candidates.map((c) => {
              const isCompatible = c.isCompatible;
              const isCurrent = c.isCurrent;

              return (
                <div
                  key={c.variantId}
                  className={`replacement-item ${
                    !isCompatible ? "incompatible" : ""
                  } ${isCurrent ? "current-selected" : ""}`}
                >
                  <div className="item-meta">
                    <div className="item-header-row">
                      <strong>{c.productName}</strong>
                      <span
                        className={`badge-compat ${
                          isCompatible ? "pass" : "fail"
                        }`}
                      >
                        {isCompatible
                          ? isCurrent
                            ? "Đang chọn"
                            : "Tương thích"
                          : "Xung đột phần cứng"}
                      </span>
                    </div>
                    <div className="item-variant-desc">{c.variantName}</div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 3,
                        color: isCompatible ? "#148465" : "#d91f31",
                        fontWeight: 600,
                      }}
                    >
                      {c.compatibilityNote}
                    </div>
                    <div className="item-price">{money(c.price)}</div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <button
                        type="button"
                        className="btn-select-part disabled"
                        disabled
                      >
                        Đang dùng
                      </button>
                    ) : isCompatible ? (
                      <button
                        type="button"
                        className="btn-select-part primary"
                        onClick={() => onSelect(c)}
                      >
                        Chọn linh kiện
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-select-part disabled"
                        disabled
                        title={c.compatibilityNote}
                      >
                        Không thể chọn
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
