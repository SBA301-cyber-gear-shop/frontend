import { WarrantyIntake as DemoWarrantyIntake } from "./WarrantyIntake";
import { TechnicianWorkbench as DemoTechnicianWorkbench } from "./TechnicianWorkbench";
import { CustomerWarranty as DemoCustomerWarranty } from "./CustomerWarranty";
import { ApiWarrantyIntake } from "./ApiWarrantyIntake";
import { ApiTechnicianWorkbench } from "./ApiTechnicianWorkbench";
import { ApiCustomerWarranty } from "./ApiCustomerWarranty";

// Đăng nhập thật (có token của BE) thì gọi API bảo hành; phiên demo không token thì dùng dữ liệu trên trình duyệt.
const live = () => Boolean(sessionStorage.getItem("techzone-token"));

export function WarrantyIntake() {
  return live() ? <ApiWarrantyIntake /> : <DemoWarrantyIntake />;
}
export function TechnicianWorkbench() {
  return live() ? <ApiTechnicianWorkbench /> : <DemoTechnicianWorkbench />;
}
export function CustomerWarranty() {
  return live() ? <ApiCustomerWarranty /> : <DemoCustomerWarranty />;
}
