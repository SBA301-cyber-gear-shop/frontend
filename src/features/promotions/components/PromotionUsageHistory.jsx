import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import { money, formatShortOrderCode } from "@/utils";
import { Button, Modal, Notice } from "@/components/ui";
import { Field } from "@/components/form";
import { promotionsApi } from "../api/promotionsApi";

const normalizedStatus = (value) =>
  ({ APPLIED: "RESERVED", CANCELED: "REVOKED" })[value] || value;
const statuses = {
  RESERVED: { label: "Đang giữ", tone: "upcoming" },
  USED: { label: "Đã dùng", tone: "success" },
  REVOKED: { label: "Đã hủy", tone: "neutral" },
};
function orderDate(value) {
  if (!value) return "—";
  const date = new Date(
    value + (/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? "" : "+07:00"),
  );
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("vi-VN", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function PromotionUsageHistory({ voucher, onClose }) {
  const { data, demoMode } = useStore();
  const [params, setParams] = useState({
    page: 0,
    size: 20,
    status: "ALL",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [resource, setResource] = useState(null);
  const key = JSON.stringify([voucher.id, params]);

  useEffect(() => {
    if (demoMode) return;
    const abort = new AbortController();
    promotionsApi.history(voucher.id, params, abort.signal).then(
      (value) => {
        if (!abort.signal.aborted) setResource({ key, value, error: "" });
      },
      (failure) => {
        if (!abort.signal.aborted)
          setResource({
            key,
            value: null,
            error: failure.message || "Không tải được lịch sử sử dụng voucher.",
          });
      },
    );
    return () => abort.abort();
  }, [voucher.id, params, key, demoMode]);

  const demoRows = demoMode
    ? (data.usages || [])
        .filter((usage) => usage.code === voucher.code)
        .map((usage, index) => {
          const customer = data.users.find((user) => user.id === usage.userId);
          const order = data.orders.find((item) => item.id === usage.orderId);
          return {
            id: usage.id || index + 1,
            userId: usage.userId,
            customerName: customer?.name,
            customerEmail: customer?.email,
            orderId: usage.orderId,
            orderCode: order?.id,
            orderCreatedAt: order?.createdAt,
            discountAmount: usage.discountAmount ?? order?.discount ?? 0,
            status: usage.status,
          };
        })
        .filter(
          (row) =>
            (params.status === "ALL" ||
              normalizedStatus(row.status) === params.status) &&
            [row.customerName, row.customerEmail, row.orderCode].some((value) =>
              (value || "").toLowerCase().includes(params.search.toLowerCase()),
            ),
        )
    : [];
  const current = resource?.key === key ? resource : null;
  const loading = !demoMode && !current;
  const error = current?.error || "";
  const result = demoMode
    ? {
        totalElements: demoRows.length,
        totalPages: Math.ceil(demoRows.length / params.size),
        items: demoRows.slice(
          params.page * params.size,
          (params.page + 1) * params.size,
        ),
      }
    : current?.value;
  const rows = result?.items || [];
  const total = result?.totalElements || 0;

  return (
    <Modal
      title={`Lịch sử sử dụng voucher ${voucher.code}`}
      className="promotion-usage-modal"
      onClose={onClose}
    >
      <div className="promotion-management">
        <p className="small muted">{voucher.name}</p>
        <form
          className="promotion-usage-filters section"
          onSubmit={(event) => {
            event.preventDefault();
            setParams((value) => ({
              ...value,
              page: 0,
              search: searchInput.trim(),
            }));
          }}
        >
          <Field
            label="Khách hàng hoặc mã đơn"
            value={searchInput}
            maxLength={100}
            placeholder="Tên khách, email hoặc mã đơn hàng"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Field label="Trạng thái lượt dùng">
            {(id) => (
              <select
                id={id}
                className="input"
                value={params.status}
                onChange={(event) =>
                  setParams((value) => ({
                    ...value,
                    page: 0,
                    status: event.target.value,
                  }))
                }
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="RESERVED">Đang giữ</option>
                <option value="USED">Đã dùng</option>
                <option value="REVOKED">Đã hủy</option>
              </select>
            )}
          </Field>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        {loading ? (
          <Notice>Đang tải lịch sử sử dụng…</Notice>
        ) : error ? (
          <div className="stack">
            <Notice tone="danger">{error}</Notice>
          </div>
        ) : (
          <>
            <p className="small muted section" role="status">
              {total
                ? `Hiển thị ${params.page * params.size + 1}–${params.page * params.size + rows.length} / ${total} lượt sử dụng`
                : "Không có lượt sử dụng"}
            </p>
            <div className="promotion-table-scroll">
              <table className="promotion-table promotion-usage-table">
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Khách hàng</th>
                    <th scope="col">Đơn hàng</th>
                    <th scope="col">Tiền giảm</th>
                    <th scope="col">Ngày đặt đơn (UTC+07)</th>
                    <th scope="col">Trạng thái lượt dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const status = statuses[normalizedStatus(row.status)] || {
                      label: "Chưa xác định",
                      tone: "neutral",
                    };
                    return (
                      <tr key={row.id}>
                        <td className="promotion-id">#{row.id}</td>
                        <td>
                          <strong>
                            {row.customerName || `Khách hàng #${row.userId}`}
                          </strong>
                          <span className="promotion-description">
                            {row.customerEmail || "Không có email"}
                          </span>
                        </td>
                        <td>
                          {row.orderCode ? (
                            <Link
                              className="promotion-history-order"
                              title={row.orderCode}
                              to={`/van-hanh/don-hang?id=${encodeURIComponent(row.orderCode)}`}
                            >
                              {formatShortOrderCode(row.orderCode)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <strong className="promotion-value">
                            {money(row.discountAmount)}
                          </strong>
                        </td>
                        <td>{orderDate(row.orderCreatedAt)}</td>
                        <td>
                          <span
                            className={`promotion-status promotion-status-${status.tone}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="promotion-empty">
                        {params.search || params.status !== "ALL"
                          ? "Không có lượt sử dụng phù hợp."
                          : "Voucher chưa có lượt sử dụng."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="promotion-usage-footer section">
          <span className="small muted">
            Trang {params.page + 1} / {Math.max(1, result?.totalPages || 0)}
          </span>
          <div className="row gap8">
            <Button
              tone="secondary"
              disabled={loading || !!error || params.page === 0}
              onClick={() =>
                setParams((value) => ({ ...value, page: value.page - 1 }))
              }
            >
              Trang trước
            </Button>
            <Button
              tone="secondary"
              disabled={
                loading ||
                !!error ||
                params.page + 1 >= (result?.totalPages || 0)
              }
              onClick={() =>
                setParams((value) => ({ ...value, page: value.page + 1 }))
              }
            >
              Trang sau
            </Button>
            <Button tone="secondary" onClick={onClose}>
              Đóng lịch sử
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
