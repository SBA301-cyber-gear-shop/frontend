import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { categories } from "../constants";
import { money } from "@/utils";
import { Badge, Empty } from "@/components/ui";
import { Field } from "@/components/form";
import { ProductCard } from "./ProductCard";
import { useCatalog } from "../hooks/useCatalog";

export function CatalogBrowser() {
  const {
    setParams,
    selectedCategory,
    term,
    brands,
    sort,
    max,
    base,
    found,
    page,
    totalPages,
    pageProducts,
    goToPage,
    update,
    toggleBrand,
    title,
    catalogLoading,
    catalogError,
  } = useCatalog();

  const scrollRef = useRef(null);
  const activeBtnRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && activeBtnRef.current) {
      const container = scrollRef.current;
      const btn = activeBtnRef.current;
      const targetLeft =
        btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    }
  }, [page]);

  if (catalogLoading || catalogError) return null;
  return (
    <>
      <div className="breadcrumb">
        <Link to="/cua-hang">Trang chủ</Link>
        <span>›</span>
        <span>{title}</span>
      </div>
      <div className="category-head">
        <div>
          <div className="eyebrow">CHỌN ĐÚNG CHO NHU CẦU</div>
          <h1>
            {term
              ? "Kết quả cho “" + term + "”"
              : title + " cho góc máy của bạn"}
          </h1>
          <p>Lựa chọn theo thương hiệu, mức giá và danh mục của phiên bản.</p>
        </div>
        <Badge tone="info">Nhận tại cửa hàng</Badge>
      </div>
      <div className="catalog-layout">
        <aside className="filters">
          <div className="between">
            <h3>Bộ lọc sản phẩm</h3>
            <button
              className="text-button"
              onClick={() =>
                setParams(
                  term
                    ? { q: term }
                    : selectedCategory === "parts"
                      ? { category: "parts" }
                      : {},
                )
              }
            >
              Xóa tất cả
            </button>
          </div>
          <div className="filter-group">
            <h4>Thương hiệu</h4>
            <div className="filter-options-scroll">
              {[...new Set(base.map((p) => p.brand))]
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b, "vi"))
                .map((b) => (
                  <label className="filter-option" key={b}>
                    <input
                      aria-label={b}
                      type="checkbox"
                      key={b + "-" + (brands.includes(b) ? "on" : "off")}
                      defaultChecked={brands.includes(b)}
                      onChange={() => toggleBrand(b)}
                    />
                    {b}
                    <small>{base.filter((p) => p.brand === b).length}</small>
                  </label>
                ))}
            </div>
          </div>
          <div className="filter-group">
            <Field label="Giá tối đa">
              {(id) => (
                <select
                  id={id}
                  className="input"
                  value={max}
                  onChange={(e) => update("max", e.target.value)}
                >
                  <option value="0">Tất cả mức giá</option>
                  {[2000000, 5000000, 10000000, 20000000, 35000000].map((v) => (
                    <option value={v} key={v}>
                      {money(v)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="filter-group">
            <h4>Danh mục</h4>
            <div className="filter-options-scroll">
              {categories.map((c) => (
                <Link
                  className={`category-filter ${selectedCategory === c.id ? "active" : ""}`}
                  key={c.id}
                  to={"/danh-muc/" + c.id}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
        <div>
          <div className="between section-title">
            <b>{found.length} phiên bản phù hợp</b>
            <select
              className="input"
              aria-label="Sắp xếp sản phẩm"
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="name">Tên A–Z</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
          {found.length ? (
            <div className="catalog-products">
              {pageProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa tìm thấy sản phẩm"
              description="Thử đổi từ khóa hoặc xóa bộ lọc."
            />
          )}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                type="button"
                className="pagination-nav-btn"
                disabled={page <= 1}
                aria-label="Trang trước"
                onClick={() => goToPage(page - 1)}
              >
                ←
              </button>
              <div
                className="pagination-scroll"
                ref={scrollRef}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      type="button"
                      className={page === i + 1 ? "active" : ""}
                      key={i}
                      ref={page === i + 1 ? activeBtnRef : null}
                      onClick={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="pagination-nav-btn"
                disabled={page >= totalPages}
                aria-label="Trang tiếp"
                onClick={() => goToPage(page + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
