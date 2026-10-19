import { Modal, Button } from "@/components/ui";
import "./AuthHelp.scss";

export function AuthHelp({ model: { help, setHelp } }) {
  return (
    <>
      {help && (
        <Modal title="Hỗ trợ tài khoản" onClose={() => setHelp(false)}>
          <p>
            Nếu bạn quên mật khẩu hoặc gặp sự cố khi đăng nhập vào hệ thống, vui
            lòng liên hệ với bộ phận chăm sóc khách hàng hoặc quản trị viên:
          </p>
          <ul
            style={{ paddingLeft: "20px", margin: "12px 0", color: "#475569" }}
          >
            <li>
              Hotline: <strong>1900 6868</strong> (8:00 - 21:00)
            </li>
            <li>
              Email: <strong>support@techzone.pro</strong>
            </li>
          </ul>
          <Button onClick={() => setHelp(false)}>Đã hiểu</Button>
        </Modal>
      )}
    </>
  );
}

export default AuthHelp;
