import { LoginForm, AuthHelp, useAuthForm } from "@/features/auth";
import { AuthLayout } from "@/layouts";
export default function LoginPage() {
  const model = useAuthForm({ register: false });
  return (
    <AuthLayout overlay={<AuthHelp model={model} />}>
      <LoginForm model={model} />
    </AuthLayout>
  );
}
