import { RegisterForm, AuthHelp, useAuthForm } from "@/features/auth";
import { AuthLayout } from "@/layouts";
export default function RegisterPage() {
  const model = useAuthForm({ register: true });
  return (
    <AuthLayout overlay={<AuthHelp model={model} />}>
      <RegisterForm model={model} />
    </AuthLayout>
  );
}
