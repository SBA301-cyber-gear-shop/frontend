import { useState } from "react";
import { useStore } from "@/store";
import { demoMode } from "@/utils";
import { authApi } from "../api/authApi";

export function useAccountProfile() {
  const { user, commit, signIn, notify } = useStore(),
    [name, setName] = useState(user.name),
    [phone, setPhone] = useState(user.phone || ""),
    [address, setAddress] = useState(user.address || ""),
    [saving, setSaving] = useState(false);
  async function save(e) {
    e.preventDefault();
    if (!name.trim() || !/^0\d{9}$/.test(phone))
      return notify("Kiểm tra họ tên và số điện thoại.", "danger");
    if (!demoMode) {
      setSaving(true);
      try {
        const saved = await authApi.updateProfile({
          fullName: name.trim(),
          phone,
          address,
        });
        signIn({
          ...user,
          name: saved.fullName,
          phone: saved.phone,
          address: saved.address,
        });
        notify("Đã lưu hồ sơ.");
      } catch (error) {
        notify(error.message, "danger");
      } finally {
        setSaving(false);
      }
      return;
    }
    const updated = { ...user, name: name.trim(), phone, address };
    commit((d) => ({
      ...d,
      users: d.users.some((u) => u.id === user.id)
        ? d.users.map((u) => (u.id === user.id ? { ...u, ...updated } : u))
        : [...d.users, updated],
    }));
    signIn(updated);
    notify("Đã lưu hồ sơ demo.");
  }
  return {
    user,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    saving,
    save,
  };
}
