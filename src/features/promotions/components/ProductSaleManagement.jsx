import { useEffect, useState, useRef } from "react";
import { useStore } from "@/store";
import { money } from "@/utils";
import { Button, Heading, Notice, Panel, KV, Modal } from "@/components/ui";
import { Field } from "@/components/form";
import { productSalesApi } from "../api/productSalesApi";
import { PromotionListFilters } from "./PromotionListFilters";
import {
  usePromotionListFilters,
  promotionListStatus,
  listStatusLabels,
  listStatusTones,
} from "../hooks/usePromotionListFilters";

const localDate = (offset = 0) =>
  new Date(Date.now() + offset)
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T")
    .slice(0, 16);
const blank = () => ({
  enabled: true,
  discountType: "percentage",
  discountValue: "2",
  start: localDate(),
  end: localDate(86400000),
});

function displaySaleDate(value) {
  if (!value) return "—";
  const [date, time] = value.split("T");
  return `${date.split("-").reverse().join("/")} · ${time?.slice(0, 5) || "00:00"}`;
}

function saleStatus(sale, now) {
  const status = promotionListStatus(sale, "sale", now);
  return { label: listStatusLabels[status], tone: listStatusTones[status] };
}

export function ProductSaleManagement() {
  const { notify, reloadCatalog, reloadCart, demoMode } = useStore();
  const [items, setItems] = useState([]);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useRef(false);
  const listFilters = usePromotionListFilters(items, "sale");

  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    productSalesApi
      .list(abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted) {
          setItems(rows);
          setLoading(false);
        }
      })
      .catch((failure) => {
        if (!abort.signal.aborted) {
          setError(failure.message);
          setLoading(false);
        }
      });
    return () => abort.abort();
  }, [demoMode]);

  function show(data) {
    setProduct(data);
    setCode(String(data.productId));
    setForm(
      data.configured
        ? {
            enabled: data.enabled,
            discountType: data.discountType || "percentage",
            discountValue: String(data.discountValue ?? data.percentage),
            start: data.start.slice(0, 16),
            end: data.end.slice(0, 16),
          }
        : blank(),
    );
  }
  function create() {
    if (pending.current) return;
    setEditingId(null);
    setProduct(null);
    setCode("");
    setSearchResults(null);
    setForm(blank());
    setError("");
    setEditorOpen(true);
  }
  function closeEditor(event) {
    if (pending.current) {
      event?.preventDefault();
      return;
    }
    setEditorOpen(false);
    setError("");
  }
  async function lookup(id = Number(code), editing = false) {
    if (pending.current) return;
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Nhập mã sản phẩm (ID) là số nguyên dương.");
      return;
    }
    pending.current = true;
    if (editing) setEditingId(id);
    setEditorOpen(true);
    setCode(String(id));
    setProduct(null);
    setBusy(true);
    setError("");
    try {
      show(await productSalesApi.get(id));
      setSearchResults(null);
    } catch (failure) {
      setProduct(null);
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function searchProducts(event) {
    event.preventDefault();
    const query = code.trim();
    if (!query || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setProduct(null);
    try {
      setSearchResults(await productSalesApi.search(query));
    } catch (failure) {
      setSearchResults(null);
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    if (!product || pending.current) return;
    const value = Number(form.discountValue);
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (form.discountType === "percentage"
        ? value > 100 ||
          Math.abs(value * 100 - Math.round(value * 100)) > 0.00001
        : !Number.isSafeInteger(value) || value > 9999999999)
    ) {
      setError(
        form.discountType === "percentage"
          ? "Mức giảm phải từ 0,01 đến 100%, tối đa 2 chữ số thập phân."
          : "Số tiền giảm phải là số đồng nguyên từ 1 đến 9.999.999.999.",
      );
      return;
    }
    if (!form.start || !form.end || form.end <= form.start) {
      setError("Thời gian kết thúc phải sau bắt đầu.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const saved = await productSalesApi.save(product.productId, {
        ...form,
        discountType: form.discountType,
        discountValue: value,
      });
      show(saved);
      setItems((rows) => [
        ...rows.filter((row) => row.productId !== saved.productId),
        saved,
      ]);
      notify("Đã lưu lịch sale cho mã sản phẩm #" + saved.productId + ".");
      setEditorOpen(false);
      void reloadCatalog();
      void reloadCart();
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  if (demoMode)
    return (
      <Notice>
        Sale theo mã sản phẩm dùng dữ liệu backend. Chuyển sang chế độ kết nối
        API để quản lý lịch sale.
      </Notice>
    );

  return (
    <>
      <Heading
        title="Sale theo mã sản phẩm"
        eyebrow="QUẢN TRỊ / KHUYẾN MÃI"
        sub="Giảm trực tiếp từ giá gốc theo thời gian, áp dụng cho tất cả phiên bản của mã sản phẩm."
        action={
          <Button disabled={busy} onClick={create}>
            Tạo lịch sale mới
          </Button>
        }
      />
      {!editorOpen && error && <Notice tone="danger">{error}</Notice>}
      <PromotionListFilters kind="sale" model={listFilters} />

      {editorOpen && (
        <Modal
          title={
            editingId
              ? `Chỉnh sửa lịch sale #${editingId}`
              : "Tạo lịch sale mới"
          }
          className="promotion-editor product-sale-modal"
          onClose={closeEditor}
        >
          <div className="promotion-management">
            {error && <Notice tone="danger">{error}</Notice>}
            <div className="stack section product-sale-editor">
              <div className="stack">
                {!editingId && (
                  <Panel title="Chọn sản phẩm áp dụng">
                    <form
                      className="product-sale-search-form"
                      onSubmit={searchProducts}
                    >
                      <div className="row gap8">
                        <Field
                          label="ID, tên sản phẩm hoặc thương hiệu"
                          type="text"
                          maxLength={100}
                          disabled={busy}
                          value={code}
                          placeholder="VD: 200, Laptop hoặc ASUS"
                          onChange={(event) => {
                            setCode(event.target.value);
                            setProduct(null);
                            setSearchResults(null);
                            setError("");
                          }}
                        />
                        <Button
                          tone="secondary"
                          type="submit"
                          disabled={busy || !code.trim()}
                        >
                          {busy ? "Đang xử lý…" : "Tìm sản phẩm"}
                        </Button>
                      </div>
                    </form>
                    <p className="small muted section">
                      Tìm bằng ID, tên sản phẩm hoặc thương hiệu rồi chọn sản
                      phẩm muốn áp dụng. Lịch sale áp dụng cho tất cả SKU của
                      sản phẩm đã chọn.
                    </p>
                    {searchResults !== null && (
                      <div
                        className="section"
                        role="region"
                        aria-label="Kết quả tìm sản phẩm"
                      >
                        {!searchResults.length ? (
                          <Notice>
                            Không tìm thấy sản phẩm phù hợp. Thử ID, tên sản
                            phẩm hoặc thương hiệu khác.
                          </Notice>
                        ) : (
                          <>
                            <p className="small muted" role="status">
                              Tìm thấy {searchResults.length} sản phẩm
                              {searchResults.length === 50
                                ? " · Hiển thị tối đa 50 kết quả, hãy nhập từ khóa cụ thể hơn."
                                : "."}
                            </p>
                            {searchResults.map((result) => (
                              <div
                                className="product-sale-search-result"
                                key={result.productId}
                              >
                                <div>
                                  <strong>
                                    #{result.productId} · {result.productName}
                                  </strong>
                                  <span className="promotion-description">
                                    Thương hiệu: {result.brand || "Chưa có"} ·{" "}
                                    {result.variantCount} SKU
                                  </span>
                                </div>
                                <Button
                                  tone="secondary"
                                  disabled={busy || !result.variantCount}
                                  aria-label={`Chọn sản phẩm #${result.productId}`}
                                  onClick={() => lookup(result.productId)}
                                >
                                  {result.variantCount
                                    ? "Chọn sản phẩm"
                                    : "Chưa có SKU"}
                                </Button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </Panel>
                )}
                {editingId && busy && !product && (
                  <Notice>Đang tải lịch sale…</Notice>
                )}
                {product && (
                  <form onSubmit={save} className="stack">
                    <Panel
                      title={`#${product.productId} · ${product.productName}`}
                    >
                      <div className="two-col">
                        <Field label="Loại giảm giá sale">
                          {(id) => (
                            <select
                              id={id}
                              className="input"
                              disabled={busy}
                              value={form.discountType}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  discountType: event.target.value,
                                  discountValue:
                                    event.target.value === "percentage"
                                      ? "2"
                                      : "10000",
                                }))
                              }
                            >
                              <option value="percentage">Phần trăm</option>
                              <option value="fixed_amount">
                                Số tiền cố định
                              </option>
                            </select>
                          )}
                        </Field>
                        <Field
                          label={
                            form.discountType === "percentage"
                              ? "Phần trăm giảm (%)"
                              : "Số tiền giảm (₫)"
                          }
                          type="number"
                          min={
                            form.discountType === "percentage" ? "0.01" : "1"
                          }
                          max={
                            form.discountType === "percentage"
                              ? "100"
                              : "9999999999"
                          }
                          step={
                            form.discountType === "percentage" ? "0.01" : "1"
                          }
                          required
                          disabled={busy}
                          value={form.discountValue}
                          onChange={(event) =>
                            set("discountValue", event.target.value)
                          }
                        />
                        <Field
                          label="Bắt đầu (UTC+07)"
                          type="datetime-local"
                          required
                          disabled={busy}
                          value={form.start}
                          onChange={(event) => set("start", event.target.value)}
                        />
                        <Field
                          label="Kết thúc (UTC+07)"
                          type="datetime-local"
                          required
                          disabled={busy}
                          value={form.end}
                          onChange={(event) => set("end", event.target.value)}
                        />
                      </div>
                      <label className="filter-option section">
                        <input
                          type="checkbox"
                          checked={form.enabled}
                          disabled={busy}
                          onChange={(event) =>
                            set("enabled", event.target.checked)
                          }
                        />
                        Kích hoạt lịch sale
                      </label>
                      <p className="small muted section">
                        {form.discountType === "percentage"
                          ? "Giá sale = giá gốc × (1 − % giảm / 100), làm tròn đến đồng."
                          : "Giá sale = giá gốc − số tiền giảm, áp dụng cho mỗi SKU và không thấp hơn 0đ."}{" "}
                        Hết giờ hoặc tắt lịch sẽ trở lại giá bán thường đã lưu.
                        Đơn đã tạo giữ giá đã chốt. Nếu giá bán thường đã thấp
                        hơn giá sale, hệ thống giữ mức giá thấp hơn.
                      </p>
                      <Button
                        type="submit"
                        disabled={busy || !product.variants.length}
                      >
                        {busy ? "Đang xử lý…" : "Lưu lịch sale"}
                      </Button>
                    </Panel>
                    <Panel title="Xem trước giá các phiên bản">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="section">
                          <strong>
                            #{variant.id} ·{" "}
                            {variant.name || "Phiên bản tiêu chuẩn"}
                          </strong>
                          <KV label="Giá gốc tính sale">
                            {money(variant.basePrice)}
                          </KV>
                          <KV label="Giá sale dự kiến" total>
                            {money(
                              Math.min(
                                variant.regularPrice,
                                form.discountType === "fixed_amount"
                                  ? Math.max(
                                      0,
                                      variant.basePrice -
                                        (Number(form.discountValue) || 0),
                                    )
                                  : Math.round(
                                      variant.basePrice *
                                        (1 -
                                          (Number(form.discountValue) || 0) /
                                            100),
                                    ),
                              ),
                            )}
                          </KV>
                          <KV label="Giá bán thường sau sale">
                            {money(variant.regularPrice)}
                          </KV>
                        </div>
                      ))}
                      {!product.variants.length && (
                        <Notice>
                          Sản phẩm chưa có phiên bản để áp dụng sale.
                        </Notice>
                      )}
                    </Panel>
                  </form>
                )}
              </div>
            </div>
            <div className="row section">
              <Button tone="secondary" disabled={busy} onClick={closeEditor}>
                Hủy
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <section
        className="promotion-list section"
        aria-labelledby="product-sale-list-title"
      >
        <div className="promotion-list-header">
          <h2 id="product-sale-list-title">
            Lịch sale đã tạo ({items.length})
          </h2>
          <div className="promotion-list-tools">
            <span>
              Hiển thị <strong>{listFilters.filtered.length}</strong> /{" "}
              {items.length} lịch sale
            </span>
          </div>
        </div>
        <div className="promotion-table-scroll">
          <table className="promotion-table product-sale-table">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Sản phẩm & phạm vi</th>
                <th scope="col">Loại giảm giá</th>
                <th scope="col">Giá trị giảm</th>
                <th scope="col">Thời gian (UTC+07)</th>
                <th scope="col">Phiên bản áp dụng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="promotion-empty">
                    Đang tải lịch sale…
                  </td>
                </tr>
              ) : !listFilters.filtered.length ? (
                <tr>
                  <td colSpan={8} className="promotion-empty">
                    {items.length
                      ? "Không có lịch sale phù hợp với tìm kiếm và bộ lọc."
                      : "Chưa có sản phẩm được lên lịch sale."}
                  </td>
                </tr>
              ) : (
                listFilters.filtered.map((sale) => {
                  const status = saleStatus(sale, listFilters.now);
                  return (
                    <tr key={sale.productId}>
                      <td className="promotion-id">#{sale.productId}</td>
                      <td>
                        <strong className="promotion-code">
                          {sale.productName}
                        </strong>
                        <span className="promotion-description">
                          Tất cả SKU của sản phẩm #{sale.productId}
                        </span>
                      </td>
                      <td>
                        <span className="promotion-type">
                          {sale.discountType === "fixed_amount"
                            ? "Số tiền cố định"
                            : "Phần trăm"}
                        </span>
                      </td>
                      <td>
                        <strong className="promotion-value">
                          {sale.discountType === "fixed_amount"
                            ? money(sale.discountValue)
                            : `${sale.discountValue ?? sale.percentage}%`}
                        </strong>
                      </td>
                      <td className="promotion-dates">
                        <span>Từ {displaySaleDate(sale.start)}</span>
                        <span>Đến {displaySaleDate(sale.end)}</span>
                      </td>
                      <td>
                        <span className="promotion-count">
                          {sale.variants.length} SKU
                        </span>
                      </td>
                      <td>
                        <span
                          className={`promotion-status promotion-status-${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="promotion-actions">
                        <Button
                          tone="secondary"
                          disabled={busy}
                          aria-label={`Chỉnh sale #${sale.productId}`}
                          onClick={() => lookup(sale.productId, true)}
                        >
                          Chỉnh sửa
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
