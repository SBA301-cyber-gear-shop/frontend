import { useState } from "react";
import { useStore } from "@/store";

export function useAccountProfile() {
  const { user, commit, signIn, notify } = useStore(),
    [name, setName] = useState(user.name),
    [phone, setPhone] = useState(user.phone || ""),
    [address, setAddress] = useState(user.address || "");
  function save(e) {
    e.preventDefault();
    if (!name.trim() || !/^0\d{9}$/.test(phone))
      return notify("Kiểm tra họ tên và số điện thoại.", "danger");
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
  return { user, name, setName, phone, setPhone, address, setAddress, save };
}
