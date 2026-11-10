import { useState, useEffect } from "react";
import { Button, Modal } from "@/components/ui";
import { Field } from "@/components/form";
import { shippingApi } from "../api/shippingApi";
import { useStore } from "@/store";

export function EditShippingAddressModal({ order, onClose, onSuccess }) {
  const { notify } = useStore();
  const [busy, setBusy] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [pickupName, setPickupName] = useState(order?.pickupName || "");
  const [pickupPhone, setPickupPhone] = useState(order?.pickupPhone || "");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  // Load provinces on mount
  useEffect(() => {
    shippingApi
      .getProvinces()
      .then((data) => setProvinces(data || []))
      .catch((err) => console.error("Lỗi tải tỉnh thành:", err));
  }, []);

  // When province changes, load districts
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict("");
      setWards([]);
      setSelectedWard("");
      return;
    }
    shippingApi
      .getDistricts(Number(selectedProvince))
      .then((data) => {
        setDistricts(data || []);
        setSelectedDistrict("");
        setWards([]);
        setSelectedWard("");
      })
      .catch((err) => console.error("Lỗi tải quận huyện:", err));
  }, [selectedProvince]);

  // When district changes, load wards
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }
    shippingApi
      .getWards(Number(selectedDistrict))
      .then((data) => {
        setWards(data || []);
        setSelectedWard("");
      })
      .catch((err) => console.error("Lỗi tải phường xã:", err));
  }, [selectedDistrict]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail.trim()) {
      notify("Vui lòng điền đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và địa chỉ chi tiết.", { tone: "warning" });
      return;
    }

    const prov = provinces.find((p) => String(p.id) === String(selectedProvince));
    const dist = districts.find((d) => String(d.id) === String(selectedDistrict));
    const ward = wards.find((w) => String(w.code) === String(selectedWard));

    const fullAddress = `${addressDetail.trim()}, ${ward?.name || ""}, ${dist?.name || ""}, ${prov?.name || ""}`;

    setBusy(true);
    try {
      await shippingApi.updateAddress(order.id, {
        pickupName: pickupName.trim() || undefined,
        pickupPhone: pickupPhone.trim() || undefined,
        shippingAddress: fullAddress,
        toProvinceId: Number(selectedProvince),
        toDistrictId: Number(selectedDistrict),
        toWardCode: String(selectedWard),
      });
      notify("Cập nhật địa chỉ nhận hàng thành công!", { tone: "success" });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Cập nhật địa chỉ thất bại";
      notify(msg, { tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Cập nhật địa chỉ giao hàng GHN"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="small muted">
        Đơn hàng: <strong>{order?.id}</strong>. Cập nhật thông tin nhận hàng trước khi tạo vận đơn GHN.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="two-col section">
          <Field label="Họ tên người nhận">
            {(id) => (
              <input
                id={id}
                className="input"
                type="text"
                required
                disabled={busy}
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
              />
            )}
          </Field>
          <Field label="Số điện thoại">
            {(id) => (
              <input
                id={id}
                className="input"
                type="tel"
                required
                disabled={busy}
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="section">
          <Field label="Tỉnh / Thành phố">
            {(id) => (
              <select
                id={id}
                className="input"
                required
                disabled={busy}
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="two-col section">
          <Field label="Quận / Huyện">
            {(id) => (
              <select
                id={id}
                className="input"
                required
                disabled={busy || !selectedProvince}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">-- Chọn Quận / Huyện --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Phường / Xã">
            {(id) => (
              <select
                id={id}
                className="input"
                required
                disabled={busy || !selectedDistrict}
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              >
                <option value="">-- Chọn Phường / Xã --</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="section">
          <Field label="Địa chỉ cụ thể (Số nhà, đường...)">
            {(id) => (
              <input
                id={id}
                className="input"
                type="text"
                required
                disabled={busy}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="Ví dụ: 123 Đường 27/4..."
              />
            )}
          </Field>
        </div>

        <div className="row section" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button tone="secondary" type="button" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" tone="primary" disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu địa chỉ mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
