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
  { id: "keyboard", name: "Bàn phím" },
  { id: "mouse", name: "Chuột" },
  { id: "laptop", name: "Laptop" },
];
// Laptop chỉ có trong dữ liệu demo; bàn phím và chuột chỉ có trong dữ liệu thật.
export const categories = demoMode
  ? allCategories.filter((c) => !["keyboard", "mouse"].includes(c.id))
  : allCategories.filter((c) => c.id !== "laptop");
