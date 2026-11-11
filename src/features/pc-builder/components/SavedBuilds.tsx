import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { money } from "@/utils";
import { savedBuildHighlights } from "../domain/buildLines";
import { useSavedBuilds } from "../hooks/useSavedBuilds";
import type { SavedBuild } from "../types/pcBuilder.types";
import { BuilderTabs } from "./BuilderTabs";
import { SavedBuildModal } from "./SavedBuildModal";

/** Trang "Cấu hình đã lưu": lưới thẻ gọn (linh kiện chính + tổng tiền), bấm thẻ mở popup chi tiết. */
export function SavedBuilds() {
  const { demoMode, builds, error, isLoading, reload } = useSavedBuilds();
  const [selected, setSelected] = useState<SavedBuild | null>(null);

  return (
    <div className="pc-builder-container">
      <BuilderTabs />
      <div className="page-header">
        <div>
          <h1 className="page-title">Cấu hình đã lưu</h1>
          <p className="page-sub">Bấm vào một cấu hình để xem đầy đủ linh kiện và đổi linh kiện ngay trong popup.</p>
        </div>
      </div>

      {demoMode && (
        <Notice tone="warning">
          Bản demo chạy không có backend nên chưa xem được cấu hình đã lưu. Tắt VITE_USE_DEMO_DATA và chạy backend để
          dùng chức năng này.
        </Notice>
      )}

      {isLoading && (
        <div className="page-loading" role="status">
          <span />
          Đang tải cấu hình đã lưu…
        </div>
      )}

      {error && (
        <div className="check-error" role="alert">
          <p>Không tải được cấu hình đã lưu: {error}</p>
          <button type="button" className="btn-replace-part" onClick={reload}>
            Thử lại
          </button>
        </div>
      )}

      {!error && builds?.length === 0 && (
        <div className="builder-empty-state">
          <h3>Bạn chưa lưu cấu hình nào</h3>
          <p>
            Tạo một cấu hình ở tab <strong>"Tạo cấu hình"</strong> rồi bấm <strong>"Lưu cấu hình vào tài khoản"</strong>,
            cấu hình sẽ hiện ở đây.
          </p>
          <Button to="/build-pc">Tạo cấu hình mới</Button>
        </div>
      )}

      {!error && builds && builds.length > 0 && (
        <div className="saved-grid">
          {builds.map((build) => (
            <button
              key={build.buildId}
              type="button"
              className="saved-card"
              onClick={() => setSelected(build)}
              aria-label={`Xem chi tiết cấu hình #${build.buildId}`}
            >
              <div className="saved-card-head">
                <strong>Cấu hình #{build.buildId}</strong>
                <span>{build.items.length} linh kiện</span>
              </div>
              <dl className="saved-card-parts">
                {savedBuildHighlights(build).map((part) => (
                  <div key={part.label}>
                    <dt>{part.label}</dt>
                    <dd title={part.value}>{part.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="saved-card-foot">
                <strong>{money(build.total)}</strong>
                <span>Xem chi tiết →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <SavedBuildModal
          build={selected}
          onSaved={() => {
            setSelected(null);
            reload();
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
