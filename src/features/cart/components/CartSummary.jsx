import { Link } from "react-router-dom";
import { money } from "@/utils";
import { Button } from "@/components/ui";

export function CartSummary({
  selectedCount,
  selectedSetsCount,
  selectedLooseCount,
  selectedTotalAmount,
  selectedIds,
  hasSelectedPcSet,
  cartBusy,
  cartLoading,
}) {
  const isReady = selectedCount > 0 && !cartBusy && !cartLoading;

  return (
    <aside className="cart-summary-wrapper">
      <div className="cart-summary-card">
        <h2 className="cart-summary-title">Tóm tắt đơn hàng</h2>

        <div className="cart-summary-rows">
          <div className="cart-summary-row">
            <span>Sản phẩm đã chọn</span>
            <span className="cart-summary-count">
              <strong>{selectedCount}</strong> sản phẩm
            </span>
          </div>

          {selectedSetsCount > 0 && (
            <div className="cart-summary-row-sub">
              <span>Bao gồm:</span>
              <span>
                {selectedSetsCount} bộ PC{selectedLooseCount > 0 ? ` + ${selectedLooseCount} món lẻ` : ""}
              </span>
            </div>
          )}

          <div className="cart-summary-row">
            <span>Tổng tiền hàng</span>
            <span className="cart-summary-val tabular-nums">
              {money(selectedTotalAmount)}
            </span>
          </div>

          <div className="cart-summary-row">
            <span className="cart-perk-free">
              Công lắp ráp bộ PC
              <span className="badge-free">FREE</span>
            </span>
            <span className="cart-perk-val">0 đ</span>
          </div>

          <div className="cart-summary-row">
            <span>Phí vận chuyển</span>
            <span className="cart-summary-note">Tính ở bước thanh toán</span>
          </div>
        </div>

        {/* Total Calculation */}
        <div className="cart-summary-total-box">
          <div className="cart-summary-total-label">Tổng thanh toán:</div>
          <div className="cart-summary-total-value tabular-nums">
            {money(selectedTotalAmount)}
          </div>
          <span className="cart-summary-vat">(Đã bao gồm thuế VAT)</span>
        </div>

        {/* Checkout CTA */}
        {isReady ? (
          <Link
            to="/thanh-toan"
            state={{ selectedVariantIds: Array.from(selectedIds || []) }}
            className="cart-btn-checkout"
          >
            Tiếp tục đặt hàng ({selectedCount}) →
          </Link>
        ) : (
          <button type="button" className="cart-btn-checkout disabled" disabled>
            {selectedCount === 0 ? "Vui lòng chọn sản phẩm" : "Đang xử lý..."}
          </button>
        )}

        <p className="cart-summary-tip">
          {selectedCount === 0
            ? "Chọn ít nhất 1 sản phẩm để tiếp tục đặt hàng"
            : "Bạn có thể áp dụng mã ưu đãi / voucher ở bước thanh toán"}
        </p>
      </div>

      {/* Trust & Policy Assurance */}
      <div className="cart-trust-card">
        <div className="cart-trust-title">
          <span className="trust-shield">🛡️</span> Quyền lợi mua hàng tại TechZone:
        </div>
        <ul className="cart-trust-list">
          <li>• Cam kết <strong>1 đổi 1 trong 30 ngày</strong> nếu phát sinh lỗi phần cứng.</li>
          <li>• Bảo hành chính hãng theo từng serial linh kiện.</li>
          <li>• Hỗ trợ kỹ thuật và tư vấn nâng cấp trọn đời máy.</li>
        </ul>
      </div>
    </aside>
  );
}

