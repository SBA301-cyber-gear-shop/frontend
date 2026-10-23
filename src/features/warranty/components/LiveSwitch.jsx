import { WarrantyIntake as DemoWarrantyIntake } from "./WarrantyIntake";
import { TechnicianWorkbench as DemoTechnicianWorkbench } from "./TechnicianWorkbench";
import { CustomerWarranty as DemoCustomerWarranty } from "./CustomerWarranty";
import { ApiWarrantyIntake } from "./ApiWarrantyIntake";
import { ApiTechnicianWorkbench } from "./ApiTechnicianWorkbench";
import { ApiCustomerWarranty } from "./ApiCustomerWarranty";
import { demoMode } from "@/utils";

// Dùng cùng chế độ dữ liệu với giỏ hàng và đơn hàng để không trộn API thật với đơn demo.
const live = () => !demoMode;

export function WarrantyIntake() {
  return live() ? <ApiWarrantyIntake /> : <DemoWarrantyIntake />;
}
export function TechnicianWorkbench() {
  return live() ? <ApiTechnicianWorkbench /> : <DemoTechnicianWorkbench />;
}
export function CustomerWarranty() {
  return live() ? <ApiCustomerWarranty /> : <DemoCustomerWarranty />;
}
