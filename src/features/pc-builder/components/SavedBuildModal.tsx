import { Button, Modal } from "@/components/ui";
import { money } from "@/utils";
import { slotLabel } from "../domain/buildLines";
import type { SavedBuild } from "../types/pcBuilder.types";

interface SavedBuildModalProps {
  build: SavedBuild;
  onReopen: () => void;
  onClose: () => void;
}

/** Popup chi tiết một bộ đã lưu: đủ linh kiện, giá lúc lưu, nút mở lại trong bộ lắp ráp. */
export function SavedBuildModal({ build, onReopen, onClose }: SavedBuildModalProps) {
  return (
    <Modal title={`Cấu hình #${build.buildId}`} onClose={onClose} className="wide saved-build-modal">
      <p className="saved-modal-sub">
        {build.items.length} linh kiện · giá lúc lưu. Mở lại để xem giá và tồn kho hiện tại.
      </p>
      <div className="table-container">
        <table className="builder-table">
          <thead>
            <tr>
              <th className="saved-modal-role-cell" style={{ width: 120 }}>Linh kiện</th>
              <th>Sản phẩm</th>
              <th style={{ width: 50, textAlign: "center" }}>SL</th>
              <th style={{ width: 130, textAlign: "right" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {build.items.map((item) => (
              <tr key={`${item.category}-${item.id}`}>
                <td className="saved-modal-role-cell">
                  <span className="part-role-badge">{slotLabel(item.category)}</span>
                </td>
                <td>
                  <span className="saved-modal-role">{slotLabel(item.category)}</span>
                  <span className="part-name">{item.name}</span>
                  {item.qty > 1 && <div className="saved-modal-unit">{money(item.price)} / cái</div>}
                </td>
                <td style={{ textAlign: "center" }}>{item.qty}</td>
                <td style={{ textAlign: "right" }}>
                  <strong>{money(item.price * item.qty)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="saved-modal-foot">
        <div className="saved-modal-total">
          <span>Tổng lúc lưu</span>
          <strong>{money(build.total)}</strong>
        </div>
        <div className="saved-modal-actions">
          <Button tone="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={onReopen}>Mở lại để chỉnh sửa</Button>
        </div>
      </div>
    </Modal>
  );
}
