import { demoMode } from "@/utils";

const allCategories = [
  { id: "cpu", name: "Bộ vi xử lý" },
  { id: "mainboard", name: "Bo mạch chủ" },
  { id: "ram", name: "Bộ nhớ RAM" },
  { id: "gpu", name: "Card đồ họa" },
  { id: "ssd", name: "Ổ cứng SSD" },
  { id: "psu", name: "Nguồn máy tính" },
  { id: "case", name: "Vỏ máy" },
  { id: "cooler", name: "Tản nhiệt" },
  { id: "monitor", name: "Màn hình" },
  { id: "laptop", name: "Laptop" },
];
// Màn hình và Laptop chỉ có trong dữ liệu demo; dữ liệu thật chỉ có 8 nhóm linh kiện PC.
export const categories = demoMode
  ? allCategories
  : allCategories.filter((c) => !["monitor", "laptop"].includes(c.id));
