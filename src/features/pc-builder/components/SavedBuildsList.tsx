import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { money } from "@/utils";
import { useStore } from "@/store";
import type {
  SavedPcBuildSummary,
  SavedPcBuildDetail,
} from "../types/pcBuilder.types";
import { pcBuilderApi } from "../api/pcBuilderApi";
import { SavedBuildDetailModal } from "./SavedBuildDetailModal";

interface SavedBuildsListProps {
  onLoadToBuilder: (detail: SavedPcBuildDetail) => void;
  onSwitchToBuilder: () => void;
  onAddToCart: (detail: SavedPcBuildDetail) => void;
}

export function SavedBuildsList({
  onLoadToBuilder,
  onSwitchToBuilder,
  onAddToCart,
}: SavedBuildsListProps) {
  const { user, notify } = useStore();
  const navigate = useNavigate();

  const [builds, setBuilds] = useState<SavedPcBuildSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal State
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const fetchBuilds = useCallback(async () => {
    if (!user) {
      setBuilds([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await pcBuilderApi.getMySavedBuilds();
      setBuilds(data);
    } catch (err: unknown) {
      console.error("[SavedBuildsList] Lỗi tải danh sách cấu hình:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể tải danh sách cấu hình lúc này",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  async function handleDelete(build: SavedPcBuildSummary) {
    if (build.isOrdered) {
      notify("Không thể xóa cấu hình đã gắn với đơn hàng.", "danger");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa cấu hình "${build.buildName}" khỏi tài khoản của mình?`,
    );
    if (!confirmed) return;

    setIsDeletingId(build.buildId);
    try {
      await pcBuilderApi.deleteSavedBuild(build.buildId);
      setBuilds((prev) => prev.filter((b) => b.buildId !== build.buildId));
      notify(`Đã xóa cấu hình "${build.buildName}" thành công!`, "success");
    } catch (err: unknown) {
      console.error("[SavedBuildsList] Lỗi khi xóa cấu hình:", err);
      notify(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa cấu hình",
        "danger",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  function handleOpenDetail(buildId: number) {
    setSelectedBuildId(buildId);
    setIsDetailModalOpen(true);
  }

  function handleCloseDetail() {
    setIsDetailModalOpen(false);
    setSelectedBuildId(null);
  }

  // TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP
  if (!user) {
    return (
      <div className="builder-empty-state" style={{ margin: "24px 0" }}>
        <div className="builder-empty-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3>Bạn chưa đăng nhập tài khoản</h3>
        <p>
          Vui lòng đăng nhập để hệ thống tải lại toàn bộ các bộ máy tính bạn đã
          lưu trữ hoặc được AI đề xuất trước đây.
        </p>
        <button
          type="button"
          className="btn-ai-submit"
          style={{ marginTop: 12 }}
          onClick={() => navigate("/dang-nhap?redirect=/build-pc")}
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: ĐANG TẢI DỮ LIỆU
  if (isLoading) {
    return (
      <div style={{ padding: "60px 16px", textAlign: "center" }}>
        <div
          className="loading-spinner"
          style={{ width: 36, height: 36, marginBottom: 16 }}
        />
        <div style={{ fontSize: 14, color: "var(--muted, #657185)", fontWeight: 500 }}>
          Đang lấy danh sách các cấu hình PC từ cơ sở dữ liệu...
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 3: LỖI
  if (errorMessage) {
    return (
      <div className="builder-empty-state" style={{ margin: "24px 0" }}>
        <div className="builder-empty-icon" style={{ background: "#fee2e2", color: "#d91f31" }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 style={{ color: "#d91f31" }}>Không thể tải danh sách cấu hình</h3>
        <p>{errorMessage}</p>
        <button
          type="button"
          className="btn-ai-submit"
          style={{ marginTop: 12 }}
          onClick={fetchBuilds}
        >
          Thử lại
        </button>
      </div>
    );
  }

  // TRƯỜNG HỢP 4: DANH SÁCH RỖNG
  if (builds.length === 0) {
    return (
      <div className="builder-empty-state" style={{ margin: "24px 0" }}>
        <div className="builder-empty-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </svg>
        </div>
        <h3>Bạn chưa có cấu hình PC nào được lưu</h3>
        <p>
          Bạn có thể chuyển sang tab <strong>"Tạo cấu hình mới (AI)"</strong>, nhờ AI
          tư vấn bộ linh kiện tối ưu từ kho và nhấn <strong>"Lưu cấu hình vào tài khoản"</strong> để
          lưu giữ các dàn máy yêu thích tại đây nhé!
        </p>
        <button
          type="button"
          className="btn-ai-submit"
          style={{ marginTop: 12 }}
          onClick={onSwitchToBuilder}
        >
          ✨ Bắt đầu tạo cấu hình với AI
        </button>
      </div>
    );
  }

  // TRƯỜNG HỢP 5: CÓ DỮ LIỆU
  return (
    <div className="saved-builds-container" style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--ink, #152237)" }}>
            Các bộ PC đã lưu trong tài khoản ({builds.length})
          </h2>
          <span style={{ fontSize: 13, color: "var(--muted, #657185)" }}>
            Bấm "Xem chi tiết" để xem bảng linh kiện, thêm vào giỏ hàng hoặc đưa vào bộ lắp ráp.
          </span>
        </div>
        <button
          type="button"
          onClick={fetchBuilds}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#fff",
            fontSize: 13,
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          Làm mới
        </button>
      </div>

      <div className="saved-builds-grid">
        {builds.map((build) => {
          const isDeleting = isDeletingId === build.buildId;
          return (
            <div
              key={build.buildId}
              className="saved-build-card"
              style={{
                background: "#fff",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "var(--radius, 12px)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                {/* Header card: Tên & Badge trạng thái */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--ink, #152237)",
                      lineHeight: 1.35,
                    }}
                  >
                    {build.buildName}
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: build.isOrdered ? "#e6f6f1" : "#eff6ff",
                      color: build.isOrdered ? "#148465" : "#2563eb",
                      border: `1px solid ${build.isOrdered ? "#a7f3d0" : "#bfdbfe"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {build.isOrdered ? `ĐÃ ĐẶT (#${build.orderId})` : "BẢN LƯU NHÁP"}
                  </span>
                </div>

                {/* Giá tiền */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: "var(--muted, #657185)", display: "block" }}>
                    Tổng chi phí linh kiện:
                  </span>
                  <strong style={{ fontSize: 18, color: "#148465", fontWeight: 800 }}>
                    {money(build.totalPrice)}
                  </strong>
                </div>

                {/* Các linh kiện cốt lõi */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    marginBottom: 16,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {build.cpuName && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "#e2e8f0",
                          color: "#334155",
                        }}
                      >
                        CPU
                      </span>
                      <span
                        style={{
                          color: "#1e293b",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {build.cpuName}
                      </span>
                    </div>
                  )}

                  {build.gpuName && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "#e2e8f0",
                          color: "#334155",
                        }}
                      >
                        VGA
                      </span>
                      <span
                        style={{
                          color: "#1e293b",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {build.gpuName}
                      </span>
                    </div>
                  )}

                  {build.ramSummary && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "#e2e8f0",
                          color: "#334155",
                        }}
                      >
                        RAM
                      </span>
                      <span
                        style={{
                          color: "#1e293b",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {build.ramSummary}
                      </span>
                    </div>
                  )}

                  {build.mainboardName && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "#e2e8f0",
                          color: "#334155",
                        }}
                      >
                        MAIN
                      </span>
                      <span
                        style={{
                          color: "#1e293b",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {build.mainboardName}
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: "var(--muted, #657185)", marginTop: 4 }}>
                    Tổng cộng: {build.itemCount} linh kiện
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={() => handleOpenDetail(build.buildId)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Xem chi tiết</span>
                </button>

                {!build.isOrdered && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 6,
                      border: "1px solid #fee2e2",
                      background: "#fff",
                      color: "#d91f31",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Xóa cấu hình khỏi tài khoản"
                    onClick={() => handleDelete(build)}
                  >
                    {isDeleting ? "..." : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP CHI TIẾT CẤU HÌNH */}
      <SavedBuildDetailModal
        isOpen={isDetailModalOpen}
        buildId={selectedBuildId}
        onClose={handleCloseDetail}
        onAddToCart={onAddToCart}
        onLoadToBuilder={onLoadToBuilder}
      />
    </div>
  );
}
