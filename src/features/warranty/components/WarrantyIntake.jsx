import { Link } from "react-router-dom";
import { TICKET_STATUS } from "../constants";
import {
  Art,
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Notice,
  Panel,
} from "@/components/ui";
import { Field } from "@/components/form";
import { useWarrantyIntake } from "../hooks/useWarrantyIntake";

export function WarrantyIntake() {
  const {
    data,
    search,
    setSearch,
    selectedId,
    setSelectedId,
    issue,
    setIssue,
    condition,
    setCondition,
    accessories,
    setAccessories,
    verified,
    setVerified,
    created,
    setCreated,
    card,
    product,
    existing,
    matches,
    submit,
  } = useWarrantyIntake();
  return (
    <>
      <Heading
        title="Tiếp nhận bảo hành"
        sub="Tra cứu đúng thiết bị và đối chiếu khách hàng tại quầy."
        eyebrow="VẬN HÀNH / BẢO HÀNH"
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tra cứu serial hoặc số điện thoại"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Serial, mã đơn hoặc số điện thoại"
        />
        <Button
          tone="dark"
          onClick={() => {
            setSelectedId(matches[0]?.id || "");
            setCreated(null);
            setVerified(false);
          }}
        >
          Tra cứu
        </Button>
      </div>
      <div className="order-picker">
        {matches.map((w) => (
          <button
            className={"chip " + (w.id === selectedId ? "active" : "")}
            key={w.id}
            onClick={() => {
              setSelectedId(w.id);
              setCreated(null);
              setVerified(false);
            }}
          >
            {w.serial}
          </button>
        ))}
      </div>
      {card ? (
        <div className="split section">
          <div className="stack">
            <Panel
              title="Thiết bị bảo hành"
              action={
                <Badge tone={card.status === "active" ? "success" : "warning"}>
                  {card.status === "active"
                    ? "Thẻ hoạt động"
                    : "Không hoạt động"}
                </Badge>
              }
            >
              <div className="row">
                <Art type={product?.category} className="small-art" />
                <div>
                  <h3>{product?.name}</h3>
                  <p className="muted">{product?.variant}</p>
                </div>
              </div>
              <div className="divider" />
              <KV label="Serial">{card.serial}</KV>
              <KV label="Đơn mua">{card.orderId}</KV>
              <KV label="Hết hạn">
                {new Date(card.end).toLocaleDateString("vi-VN")}
              </KV>
            </Panel>
            {existing ? (
              <Panel title="Thiết bị đã có yêu cầu đang xử lý">
                <Notice tone="warning">
                  Không tạo trùng ticket cho cùng lần tiếp nhận.
                </Notice>
                <KV label="Mã phiếu">{existing.id}</KV>
                <KV label="Trạng thái">{TICKET_STATUS[existing.status]}</KV>
                <p>{existing.issue}</p>
                <Link className="text-button section" to="/van-hanh/bao-hanh">
                  Tiếp tục tra cứu thiết bị khác
                </Link>
              </Panel>
            ) : (
              <Panel title="Thông tin tiếp nhận">
                <form onSubmit={submit}>
                  <Field label="Mô tả lỗi khách báo">
                    {(id) => (
                      <textarea
                        id={id}
                        className="input full"
                        required
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                      />
                    )}
                  </Field>
                  <div className="two-col section">
                    <Field
                      label="Tình trạng ngoại quan"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                    />
                    <Field
                      label="Phụ kiện nhận giữ"
                      value={accessories}
                      onChange={(e) => setAccessories(e.target.value)}
                      placeholder="Không có / ghi rõ phụ kiện"
                      required
                    />
                  </div>
                  <label className="filter-option section">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                    />
                    Đã đối chiếu serial và nhận thiết bị từ khách.
                  </label>
                  <Button type="submit" disabled={!verified}>
                    Tạo phiếu tiếp nhận
                  </Button>
                </form>
              </Panel>
            )}
          </div>
          <aside className="stack">
            <Panel title="Tóm tắt tiếp nhận">
              <KV label="Khách hàng">
                {data.orders.find((o) => o.id === card.orderId)?.pickupName ||
                  card.userId}
              </KV>
              <KV label="Serial">{card.serial}</KV>
              <p className="muted small section">
                Thẻ còn hạn là điều kiện tiếp nhận. Kỹ thuật viên xác định lỗi
                có thuộc phạm vi bảo hành.
              </p>
            </Panel>
            {created && (
              <Panel title="Biên nhận đã tạo">
                <p className="mono">{created}</p>
                <p className="section">{issue}</p>
                <KV label="Ngoại quan">{condition}</KV>
                <KV label="Phụ kiện">{accessories}</KV>
                <Button className="section" onClick={() => window.print()}>
                  In biên nhận
                </Button>
              </Panel>
            )}
          </aside>
        </div>
      ) : (
        <Empty
          title="Không tìm thấy thiết bị"
          description="Kiểm tra lại serial, mã đơn hoặc số điện thoại. Không liên kết nhầm thẻ bảo hành."
        />
      )}
    </>
  );
}
