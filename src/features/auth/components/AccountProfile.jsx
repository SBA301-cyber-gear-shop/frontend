import { Button, Empty, Heading, Notice, Panel } from "@/components/ui";
import { Field } from "@/components/form";
import { useAccountProfile } from "../hooks/useAccountProfile";
import { demoMode } from "@/utils";

export function AccountProfile() {
  const {
    user,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    saving,
    save,
  } = useAccountProfile();
  return (
    <>
      <Heading
        title="Hồ sơ & tài khoản"
        sub="Quản lý thông tin liên hệ của bạn."
      />
      <div className="stack">
        <Panel title="Thông tin cá nhân">
          <form onSubmit={save}>
            <div className="two-col">
              <Field
                label="Họ tên"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
              <Field label="Email" value={user.email} readOnly />
            </div>
            <div className="two-col section">
              <Field
                label="Số điện thoại"
                type="tel"
                value={phone}
                required
                onChange={(e) => setPhone(e.target.value)}
              />
              <Field
                label="Địa chỉ liên hệ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit" className="section" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </form>
        </Panel>
        <Panel title="Phương thức thanh toán">
          <Empty
            title="Chưa có phương thức đã lưu"
            description="Bạn vẫn có thể thanh toán tại cửa hàng. Việc lưu phương thức thanh toán cần tích hợp token từ cổng thanh toán."
          />
        </Panel>
        {demoMode && (
          <Notice tone="neutral">
            Dữ liệu demo lưu tại trình duyệt. Không nhập thông tin thẻ hoặc dữ liệu nhạy cảm thật.
          </Notice>
        )}
      </div>
    </>
  );
}
