import { Button } from "@/components/ui";

function FilterSelect({ icon, children, ...props }) {
  const icons = {
    status: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2.5" />
        <circle cx="15" cy="17" r="2.5" />
      </>
    ),
    discount: (
      <>
        <path d="M3 4h8l10 10-7 7L3 10V4Z" />
        <circle cx="7.5" cy="8" r="1" />
        <path d="m12 11 5 5" />
      </>
    ),
    quota: (
      <>
        <path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" />
        <path d="M14 5v3m0 3v2m0 3v3" />
      </>
    ),
    sku: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7 5.8l9 5" />
      </>
    ),
    sort: (
      <>
        <path d="M8 4v16m-4-4 4 4 4-4M14 5h7m-7 5h5m-5 5h3" />
      </>
    ),
  };
  return (
    <div
      className={`promotion-filter-control promotion-filter-control-${icon}`}
    >
      <svg
        className="promotion-filter-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icons[icon]}
      </svg>
      <select {...props}>{children}</select>
    </div>
  );
}

export function PromotionListFilters({ kind, model }) {
  const { filters, counts, setFilter, resetFilters, hasFilters } = model;
  const voucher = kind === "voucher";
  const label = voucher ? "voucher" : "lịch sale";
  return (
    <section
      className="promotion-filter-bar section"
      aria-label={`Tìm kiếm và bộ lọc ${label}`}
    >
      <div className="promotion-filter-top">
        <label className="promotion-list-search">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            aria-label={`Tìm kiếm ${label}`}
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            maxLength={100}
            placeholder={
              voucher
                ? "Tìm theo mã voucher, tên chương trình…"
                : "Tìm theo ID, tên sản phẩm hoặc phiên bản…"
            }
          />
          {filters.search && (
            <button
              type="button"
              className="promotion-search-clear"
              aria-label={`Xóa từ khóa ${label}`}
              onClick={() => setFilter("search", "")}
            >
              ×
            </button>
          )}
        </label>
        <div
          className="promotion-filter-segments"
          role="group"
          aria-label={`Trạng thái ${label}`}
        >
          {[
            ["all", "Tất cả"],
            ["active", "Đang áp dụng"],
            ["disabled", "Đã tắt"],
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.segment === value}
              onClick={() => setFilter("segment", value)}
            >
              {text} ({counts[value]})
            </button>
          ))}
        </div>
      </div>
      <div className="promotion-filter-selects">
        <FilterSelect
          icon="status"
          className="input"
          aria-label={`Trạng thái chi tiết ${label}`}
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="all">Trạng thái: Tất cả</option>
          <option value="active">Đang áp dụng</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="expired">Đã hết hạn</option>
          <option value="disabled">Đã tắt</option>
          {voucher && <option value="exhausted">Hết lượt</option>}
        </FilterSelect>
        {voucher ? (
          <>
            <FilterSelect
              icon="discount"
              className="input"
              aria-label="Loại giảm giá voucher"
              value={filters.type}
              onChange={(event) => setFilter("type", event.target.value)}
            >
              <option value="all">Loại giảm giá: Tất cả</option>
              <option value="percentage">Phần trăm</option>
              <option value="fixed_amount">Số tiền cố định</option>
            </FilterSelect>
            <FilterSelect
              icon="quota"
              className="input"
              aria-label="Hạn mức voucher"
              value={filters.remaining}
              onChange={(event) => setFilter("remaining", event.target.value)}
            >
              <option value="all">Hạn mức: Tất cả</option>
              <option value="available">Còn lượt</option>
              <option value="empty">Hết lượt</option>
            </FilterSelect>
          </>
        ) : (
          <>
            <FilterSelect
              icon="discount"
              className="input"
              aria-label="Loại giảm giá trong danh sách sale"
              value={filters.type}
              onChange={(event) => setFilter("type", event.target.value)}
            >
              <option value="all">Loại giảm giá: Tất cả</option>
              <option value="percentage">Phần trăm</option>
              <option value="fixed_amount">Số tiền cố định</option>
            </FilterSelect>
            <FilterSelect
              icon="sku"
              className="input"
              aria-label="Số SKU trong lịch sale"
              value={filters.variantCount}
              onChange={(event) =>
                setFilter("variantCount", event.target.value)
              }
            >
              <option value="all">Số SKU: Tất cả</option>
              <option value="single">Một SKU</option>
              <option value="multiple">Nhiều SKU</option>
            </FilterSelect>
          </>
        )}
        <FilterSelect
          icon="sort"
          className="input"
          aria-label={`Sắp xếp ${label}`}
          value={filters.sort}
          onChange={(event) => setFilter("sort", event.target.value)}
        >
          {voucher ? (
            <option value="newest">Sắp xếp: Mới nhất</option>
          ) : (
            <option value="start_desc">Bắt đầu: mới → cũ</option>
          )}
          <option value="end_asc">Kết thúc sớm nhất</option>
          {voucher ? (
            <option value="usage_desc">Lượt giữ/dùng nhiều nhất</option>
          ) : (
            <option value="discount_desc">Mức giảm cao nhất theo loại</option>
          )}
          <option value="name_asc">
            {voucher ? "Mã voucher: A → Z" : "Tên sản phẩm: A → Z"}
          </option>
        </FilterSelect>
      </div>
      {hasFilters && (
        <div className="promotion-filter-reset">
          <Button tone="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </section>
  );
}
