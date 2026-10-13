import { CustomerOrders } from "@/features/orders";
import { AccountLayout } from "@/layouts";
export default function OrdersPage() {
  return (
    <AccountLayout>
      <CustomerOrders />
    </AccountLayout>
  );
}
