import { useStore } from "@/store";
export function useSession() {
  const { user, signOut } = useStore();
  return { user, signOut, isAuthenticated: Boolean(user) };
}
