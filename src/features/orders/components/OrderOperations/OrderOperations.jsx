import { dateTime, money } from "@/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants";
import { OrderLines } from "@/features/products";
import {
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";
import { Field } from "@/components/form";
import { useOrderOperations } from "../../hooks/useOrderOperations";
import "./OrderOperations.scss";

export function OrderOperations({ handover = false }) {
  const {
    data,
    setParams,
    search,
    setSearch,
    status,
    setStatus,
    confirm,
    setConfirm,
    navigate,
    filtered,
    selected,
    serials,
    setSerials,
    checked,
    setChecked,
    update,
    count,
    finish,
  } = useOrderOperations();
  return (
    <>
      <Heading
        title={handover ? "Bàn giao đơn hàng" : "Xử lý đơn hàng"}
        sub="Đối chiếu đơn, thu tiền và chuẩn bị bàn giao tại cửa hàng."
        eyebrow="VẬN HÀNH / ĐƠN HÀNG"
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tra cứu đơn hàng"
          placeholder="Mã đơn, số điện thoại hoặc tên khách"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Lọc trạng thái đơn"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="order-picker">
        {filtered.map((o) => (
          <button
            key={o.id}
            className={"chip " + (o.id === selected?.id ? "active" : "")}
            onClick={() => {
              setParams({ id: o.id });
              setChecked(false);
            }}
          >
            {o.id} · {ORDER_STATUS[o.status]}
          </button>
        ))}
      </div>
      {!filtered.length && <Empty title="Không tìm thấy đơn phù hợp" />}
      {selected && (
        <div className="split section">
          <div className="stack">
            <Panel
              title={selected.id}
              action={
                <Badge tone="info">{ORDER_STATUS[selected.status]}</Badge>
              }
            >
              <p className="small muted">
                Đặt ngày {dateTime(selected.createdAt)}
              </p>
              <div className="section">
                <Steps
                  labels={Object.values(ORDER_STATUS).slice(0, 5)}
                  current={Object.keys(ORDER_STATUS).indexOf(selected.status)}
                />
              </div>
            </Panel>
            <Panel title="Hàng trong đơn">
              <OrderLines lines={selected.lines} products={data.products} />
            </Panel>
            <Panel title="Thông tin nhận hàng">
              <div className="two-col">
                <KV label="Người nhận">{selected.pickupName}</KV>
                <KV label="Điện thoại">{selected.pickupPhone}</KV>
              </div>
              <p className="small muted section">
                {selected.note || "Không có ghi chú."}
              </p>
            </Panel>
            {handover && (
              <Panel title={"Serial từng thiết bị · " + count + " thiết bị"}>
                <Notice>
                  Nhập serial thực tế, duy nhất cho mỗi thiết bị. Thẻ bảo hành
                  được tạo khi xác nhận bàn giao.
                </Notice>
                <div className="stack section">
                  {selected.lines
                    .flatMap((l) =>
                      Array.from({ length: l.quantity }, (_, i) => ({
                        line: l,
                        index: i,
                      })),
                    )
                    .map((u, i) => (
                      <Field
                        key={i}
                        label={u.line.name + " · Thiết bị " + (u.index + 1)}
                        value={serials[selected.id + "-" + i] || ""}
                        onChange={(e) =>
                          setSerials({
                            ...serials,
                            [selected.id + "-" + i]: e.target.value,
                          })
                        }
                      />
                    ))}
                </div>
                <label className="filter-option section">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  Đã đối chiếu người nhận, serial và bàn giao đủ hàng.
                </label>
              </Panel>
            )}
          </div>
          <aside className="stack">
            <Panel title="Thanh toán" className="summary">
              <Badge
                tone={selected.payment === "SUCCESS" ? "success" : "warning"}
              >
                {PAYMENT_STATUS[selected.payment]}
              </Badge>
              <p className="small muted section">Cần thanh toán đủ</p>
              <div className="price">{money(selected.final)}</div>
              <div className="divider" />
              <KV label="Tiền hàng">{money(selected.total)}</KV>
              <KV label={"Giảm giá " + (selected.promotion || "")}>
                {money(selected.discount)}
              </KV>
              <KV label="Thành tiền">{money(selected.final)}</KV>
              {selected.payment !== "SUCCESS" &&
                !["canceled", "completed"].includes(selected.status) && (
                  <>
                    <Button className="full" onClick={() => setConfirm(true)}>
                      Xác nhận đã thu đủ
                    </Button>
                    <p className="tiny muted section">
                      Demo: chỉ xác nhận sau khi đối chiếu khoản thu.
                    </p>
                  </>
                )}
            </Panel>
            <Panel title="Bước tiếp theo" className="summary">
              {["pending", "confirmed", "preparing"].includes(
                selected.status,
              ) && (
                <Button className="full" onClick={() => update("advance")}>
                  {selected.status === "pending"
                    ? "Xác nhận đơn"
                    : selected.status === "confirmed"
                      ? "Bắt đầu chuẩn bị"
                      : "Đánh dấu sẵn sàng nhận"}
                </Button>
              )}
              {handover ? (
                <Button
                  className="full"
                  disabled={
                    selected.status !== "ready_for_pickup" ||
                    selected.payment !== "SUCCESS" ||
                    !checked
                  }
                  onClick={finish}
                >
                  Hoàn tất bàn giao
                </Button>
              ) : (
                <Button
                  className="full"
                  disabled={
                    selected.status !== "ready_for_pickup" ||
                    selected.payment !== "SUCCESS"
                  }
                  onClick={() =>
                    navigate("/van-hanh/ban-giao?id=" + selected.id)
                  }
                >
                  Tiếp tục bàn giao →
                </Button>
              )}
              {selected.status === "completed" && (
                <Notice tone="success">
                  Đã bàn giao và kích hoạt bảo hành.
                </Notice>
              )}
            </Panel>
          </aside>
        </div>
      )}
      {confirm && (
        <Modal
          title="Xác nhận đã nhận đủ tiền?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Đơn {selected.id} · {money(selected.final)}. Thao tác cập nhật khoản
            thu trong dữ liệu demo.
          </p>
          <div className="row section">
            <Button tone="secondary" onClick={() => setConfirm(false)}>
              Quay lại
            </Button>
            <Button onClick={() => update("pay")}>Đã thu đủ tiền</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default OrderOperations;
