import { Modal } from "@/components/ui";

interface ConfirmOverBudgetModalProps {
  /** Câu popup bước 7 (server trả trong 409 OVER_BUDGET_NOT_CONFIRMED hoặc budgetWarning). */
  message: string;
  isBusy: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function ConfirmOverBudgetModal({ message, isBusy, onContinue, onCancel }: ConfirmOverBudgetModalProps) {
  return (
    <Modal title="Cấu hình vượt ngân sách" onClose={onCancel}>
      <p className="confirm-message" id="overBudgetMessage">
        {message}
      </p>
      <div className="confirm-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isBusy}>
          Quay lại chỉnh sửa
        </button>
        <button type="button" className="btn btn-primary" onClick={onContinue} disabled={isBusy}>
          Tiếp tục
        </button>
      </div>
    </Modal>
  );
}
