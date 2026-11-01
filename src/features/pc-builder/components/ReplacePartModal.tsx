import { useEffect } from "react";
import { Badge } from "@/components/ui";
import { money } from "@/utils";
import type {
  CompatibilityStatus,
  ComponentRole,
  ReplacementCandidate,
  RequirementProfile,
} from "../types/pcBuilder.types";
import { ROLE_LABELS } from "../domain";
import { CHECK_STATUS } from "./SummaryCard";
import { itemReason } from "./ProfileEditor";

const STATUS_TEXT: Record<CompatibilityStatus, string> = {
  pass: "Tương thích",
  warning: "Cần lưu ý",
  unknown: "Chưa xác minh",
  fail: "Xung đột phần cứng",
};

interface ReplacePartModalProps {
  isOpen: boolean;
  role: ComponentRole | null;
  candidates: ReplacementCandidate[];
  isLoading?: boolean;
  profile?: RequirementProfile | null;
  onSelect: (candidate: ReplacementCandidate) => void;
  onClose: () => void;
}

export function ReplacePartModal({
  isOpen,
  role,
  candidates,
  isLoading = false,
  profile,
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
              const status: CompatibilityStatus =
                c.status ?? (c.isCompatible ? "pass" : "fail");
              const isCompatible = c.isCompatible && status !== "fail";
              const isCurrent = c.isCurrent;
              // Check P:{id} là lệch hồ sơ: chỉ cảnh báo, vẫn cho chọn (DD 7.4)
              const profileMisses = (c.warningChecks || [])
                .filter((key) => key.startsWith("P:"))
                .map((key) => itemReason(profile, key.slice(2)));

              return (
                <div
                  key={c.variantId}
                  className={`replacement-item ${status} ${
                    !isCompatible ? "incompatible" : ""
                  } ${isCurrent ? "current-selected" : ""}`}
                >
                  <div className="item-meta">
                    <div className="item-header-row">
                      <strong>{c.productName}</strong>
                      <Badge tone={CHECK_STATUS[status].tone}>
                        {isCurrent && isCompatible ? "Đang chọn" : STATUS_TEXT[status]}
                      </Badge>
                    </div>
                    <div className="item-variant-desc">{c.variantName}</div>
                    <div className={`replacement-note ${status}`}>
                      {c.compatibilityNote}
                    </div>
                    {profileMisses.map((reason) => (
                      <div key={reason} className="replacement-profile-miss">
                        Không đạt: {reason}
                      </div>
                    ))}
                    <div className="item-price">
                      {money(c.price)}
                      {!isCurrent && c.priceDelta != null && (
                        <span className={`replacement-delta ${c.priceDelta > 0 ? "up" : "down"}`}>
                          {c.priceDelta > 0 ? "+" : "−"}
                          {money(Math.abs(c.priceDelta))}
                        </span>
                      )}
                      {!isCurrent && c.newPercent != null && (
                        <span className="replacement-percent">
                          → {c.newPercent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% ngân sách
                        </span>
                      )}
                    </div>
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
