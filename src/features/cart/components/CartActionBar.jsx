export function CartActionBar({
  totalItemsCount,
  selectedItemsCount,
  isAllSelected,
  onToggleSelectAll,
  onDeleteSelected,
  disabled = false,
}) {
  return (
    <div className="cart-action-bar">
      <div className="cart-action-bar-left">
        <label className="cart-checkbox-label">
          <input
            type="checkbox"
            className="cart-checkbox"
            checked={isAllSelected}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            disabled={disabled || totalItemsCount === 0}
          />
          <span className="cart-checkbox-text">
            Chọn tất cả ({totalItemsCount} sản phẩm)
          </span>
        </label>
      </div>

      <div className="cart-action-bar-right">
        <span className="cart-selection-badge">
          Đã chọn: <strong>{selectedItemsCount}</strong> sản phẩm
        </span>
        {selectedItemsCount > 0 && (
          <button
            type="button"
            className="cart-btn-bulk-delete"
            onClick={onDeleteSelected}
            disabled={disabled}
          >
            Xóa mục đã chọn
          </button>
        )}
      </div>
    </div>
  );
}

