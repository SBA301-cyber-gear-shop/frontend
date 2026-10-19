import { money } from "@/utils";
import { categories } from "@/features/products";
import {
  Badge,
  Button,
  Heading,
  Icon,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { Field, Quantity, Select } from "@/components/form";
import { usePcBuilder } from "../../hooks/usePcBuilder";
import "./PcBuilder.scss";

export function PcBuilder() {
  const {
    data,
    commit,
    notify,
    navigate,
    budget,
    setBudget,
    purpose,
    setPurpose,
    scope,
    setScope,
    ramGb,
    setRamGb,
    request,
    setRequest,
    busy,
    error,
    replace,
    setReplace,
    saved,
    setSaved,
    check,
    total,
    change,
    suggest,
  } = usePcBuilder();
  return (
    <>
      <Heading
        title="Cấu hình của bạn. Lựa chọn có cơ sở."
        sub="Tư vấn theo ngân sách, kiểm tra lại từng linh kiện trước khi mua."
        action={<Badge>Bản nháp trên thiết bị này</Badge>}
      />
      <div className="builder-toolbar">
        <div className="three-col">
          <Field
            label="Ngân sách tối đa (₫)"
            type="number"
            min="1000000"
            step="500000"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setSaved(false);
            }}
          />
          <Select
            label="Nhu cầu chính"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            options={[
              { value: "gaming", label: "Lập trình & chơi game" },
              { value: "creative", label: "Thiết kế & sáng tạo" },
              { value: "work", label: "Học tập & làm việc" },
            ]}
          />
          <Select
            label="Dung lượng RAM mong muốn"
            value={ramGb}
            onChange={(e) => setRamGb(e.target.value)}
            options={[
              { value: 16, label: "16GB" },
              { value: 32, label: "32GB" },
              { value: 64, label: "64GB" },
            ]}
          />
        </div>
        <div className="row section">
          <input
            className="input flex"
            aria-label="Yêu cầu bổ sung"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
          <Button onClick={suggest} disabled={busy}>
            <Icon name="spark" />
            {busy ? "Đang tìm cấu hình…" : "Đề xuất cấu hình"}
          </Button>
        </div>
        <div className="section">
          <Select
            label="Phạm vi ngân sách"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            options={[
              { value: "tower", label: "Chỉ thùng máy" },
              { value: "full", label: "Cả màn hình & thiết bị ngoại vi" },
            ]}
          />
        </div>
        <p className="tiny muted section">
          Chế độ demo: gợi ý theo ngân sách, nhu cầu và RAM đã chọn. Yêu cầu tự
          do được lưu làm ghi chú, chưa được phân tích bởi AI thật. Thông số
          tương thích là dữ liệu minh họa.
        </p>
      </div>
      {error && (
        <div className="section-title">
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
      <div className="split">
        <div className="stack">
          <section className="panel">
            <div className="pad between">
              <div>
                <div className="eyebrow">ĐỀ XUẤT THEO NHU CẦU</div>
                <h2>PC DDR5 · RAM {check.capacity}GB</h2>
                <p className="small muted">
                  {data.build.length} nhóm linh kiện ·{" "}
                  {data.build.reduce((s, l) => s + l.quantity, 0)} sản phẩm
                </p>
              </div>
              <Badge tone={check.valid ? "success" : "warning"}>
                {check.valid ? "Đã kiểm tra demo" : "Cần kiểm tra thêm"}
              </Badge>
            </div>
            <div className="table-wrap">
              <table className="builder-table">
                <thead>
                  <tr>
                    <th>Linh kiện</th>
                    <th>Sản phẩm & phiên bản</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.build.map((l) => {
                    const p = data.products.find((p) => p.id === l.id);
                    return (
                      <tr key={l.id}>
                        <td>
                          <span className="kind">
                            {p?.category.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong>{p?.name || "Sản phẩm không còn"}</strong>
                          <small>{p?.variant}</small>
                          <button
                            className="text-button tiny"
                            onClick={() => setReplace(l.id)}
                          >
                            Thay linh kiện
                          </button>
                        </td>
                        <td>
                          {p?.category === "ram" || p?.category === "ssd" ? (
                            <Quantity
                              value={l.quantity}
                              max={Math.max(p.stock, l.quantity)}
                              label={"Số lượng " + p.category}
                              onChange={(q) =>
                                change(
                                  data.build.map((x) =>
                                    x.id === l.id ? { ...x, quantity: q } : x,
                                  ),
                                )
                              }
                            />
                          ) : (
                            l.quantity
                          )}
                        </td>
                        <td className="nowrap">
                          <b>{money((p?.price || 0) * l.quantity)}</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <Panel title="Vì sao cấu hình này phù hợp?">
            <p className="muted small">
              Tổng RAM {check.capacity}GB cho nhu cầu đa nhiệm. Giá linh kiện
              hiện tại là {money(total)}.{" "}
              {total <= budget
                ? "Còn " + money(budget - total) + " trong ngân sách."
                : "Cần giảm " +
                  money(total - budget) +
                  " để nằm trong ngân sách."}{" "}
              Hiệu năng thực tế phụ thuộc phần mềm và thiết lập sử dụng.
            </p>
            <div className="section">
              <Notice tone="neutral">
                Bản nháp chưa giữ hàng. Mỗi lần thay linh kiện hoặc số lượng đều
                được kiểm tra lại.
              </Notice>
            </div>
          </Panel>
        </div>
        <aside className="stack">
          <Panel title="Tổng giá cấu hình" className="summary">
            <div className="price">{money(total)}</div>
            <KV label="Ngân sách tối đa">{money(Number(budget))}</KV>
            <KV label="Còn trong ngân sách">{money(Number(budget) - total)}</KV>
            <div className="divider" />
            <Button
              className="full"
              disabled={!check.valid || scope !== "tower"}
              onClick={() => {
                commit((d) => ({ ...d, budget: Number(budget) }));
                navigate("/thanh-toan?source=build");
              }}
            >
              Mua cấu hình này →
            </Button>
            <Button
              className="full"
              tone="secondary"
              onClick={() => {
                commit((d) => ({
                  ...d,
                  budget: Number(budget),
                  buildNote: request,
                }));
                setSaved(true);
                notify("Đã lưu bản nháp trên thiết bị.");
              }}
            >
              {saved ? "✓ Đã lưu bản nháp" : "Lưu bản nháp"}
            </Button>
            <p className="tiny muted section">
              Chưa áp dụng voucher. Chưa hỗ trợ lưu cấu hình xuyên thiết bị.
            </p>
          </Panel>
          <Panel
            title="Kiểm tra cấu hình"
            action={
              <Badge tone={check.valid ? "success" : "warning"}>
                {check.checks.filter((c) => c.status === "pass").length} /{" "}
                {check.checks.length}
              </Badge>
            }
          >
            <div className="check-list">
              {check.checks.map((c) => (
                <div key={c.label}>
                  <span className={c.status === "pass" ? "tick" : "warn"}>
                    {c.status === "pass"
                      ? "✓"
                      : c.status === "fail"
                        ? "×"
                        : "?"}
                  </span>
                  <div>
                    <b>{c.label}</b>
                    <small className="muted block">{c.detail}</small>
                    {c.status === "unknown" && (
                      <small className="red">
                        Chưa đủ thông số để xác minh.
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
      {replace && (
        <Modal
          title={
            "Thay " +
            categories.find(
              (c) =>
                c.id === data.products.find((p) => p.id === replace)?.category,
            )?.name
          }
          onClose={() => setReplace(null)}
        >
          <div className="stack section">
            {data.products
              .filter(
                (p) =>
                  p.category ===
                    data.products.find((x) => x.id === replace)?.category &&
                  p.status === "active",
              )
              .map((p) => (
                <button
                  className={
                    "selection " + (p.id === replace ? "selected" : "")
                  }
                  key={p.id}
                  onClick={() => {
                    change(
                      data.build.map((l) =>
                        l.id === replace ? { ...l, id: p.id } : l,
                      ),
                    );
                    setReplace(null);
                  }}
                >
                  <div>
                    <b>{p.name}</b>
                    <p className="small muted">{p.variant}</p>
                    <span className="price small">{money(p.price)}</span>
                  </div>
                  <Badge>{p.stock} còn lại</Badge>
                </button>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
