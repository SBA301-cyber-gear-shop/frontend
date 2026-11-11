import { Button, Modal } from "@/components/ui";
import { money } from "@/utils";
import { useSavedBuildEditor } from "../hooks/useSavedBuildEditor";
import type { SavedBuild } from "../types/pcBuilder.types";
import { PartsTable } from "./PartsTable";
import { ReplacePartModal } from "./ReplacePartModal";
import { buildVerdict } from "./SummaryCard";

interface SavedBuildModalProps {
  build: SavedBuild;
  /** Gọi sau khi lưu thay đổi thành công: đóng popup và tải lại danh sách. */
  onSaved: () => void;
  onClose: () => void;
}

/** Popup một bộ đã lưu: giá và tồn kho hiện tại, đổi linh kiện / số lượng tại chỗ rồi "Lưu thay đổi". */
export function SavedBuildModal({ build: saved, onSaved, onClose }: SavedBuildModalProps) {
  const editor = useSavedBuildEditor(saved, onSaved);
  const { build, replace } = editor;
  const verdict = buildVerdict(build, editor.isChecking, editor.checkError);

  return (
    <>
      <Modal title={`Cấu hình #${saved.buildId}`} onClose={onClose} className="wide saved-build-modal">
        <p className="saved-modal-sub">
          Giá và tồn kho hiện tại. Đổi linh kiện hoặc số lượng rồi bấm "Lưu thay đổi"; đóng popup là bỏ thay đổi.
        </p>

        {editor.loadError ? (
          <div className="check-error" role="alert">
            <p>Không tải được giá và tồn kho hiện tại: {editor.loadError}</p>
            <button type="button" className="btn-replace-part" onClick={editor.reload}>
              Thử lại
            </button>
          </div>
        ) : !build ? (
          <div className="replace-state" role="status">
            <div className="loading-spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
            <div>Đang tải giá và tồn kho hiện tại…</div>
          </div>
        ) : (
          <>
            <PartsTable
              title="Linh kiện trong cấu hình"
              items={build.items}
              verdict={verdict}
              disabled={editor.isSaving}
              onReplace={editor.openReplace}
              onChangeQty={editor.changeQty}
            />

            {editor.checkError ? (
              <div className="check-error" role="alert">
                <p>Không kiểm tra được cấu hình: {editor.checkError}</p>
                <button type="button" className="btn-replace-part" onClick={editor.recheck}>
                  Kiểm tra lại
                </button>
              </div>
            ) : (
              !editor.isChecking &&
              build.violations.length > 0 && (
                <div className="check-list saved-modal-violations">
                  {build.violations.map((violation, index) => (
                    <div key={`${violation.rule}-${index}`} className="check-item fail">
                      <div className="check-icon-badge fail" aria-hidden="true">
                        ✕
                      </div>
                      <div className="check-content">
                        <strong>{violation.rule}</strong>
                        <span>{violation.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            <div className="saved-modal-foot">
              <div className="saved-modal-total">
                <span>Tổng hiện tại</span>
                <strong>{money(build.total)}</strong>
                {build.total !== saved.total && <small>Lúc lưu {money(saved.total)}</small>}
              </div>
              <div className="saved-modal-actions">
                <Button tone="secondary" onClick={onClose}>
                  Đóng
                </Button>
                <Button
                  onClick={() => void editor.save()}
                  disabled={Boolean(editor.blockedReason) || editor.isSaving}
                  title={editor.blockedReason ?? undefined}
                >
                  {editor.isSaving ? "Đang lưu…" : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Ngoài <Modal> cha: Escape / click nền của popup đổi món không lan lên làm đóng popup cấu hình */}
      {replace && (
        <ReplacePartModal
          category={replace.category}
          current={build?.items[replace.index] ?? null}
          options={replace.options}
          isLoading={replace.loading}
          error={replace.error}
          onSelect={editor.chooseReplacement}
          onClose={editor.closeReplace}
        />
      )}
    </>
  );
}
