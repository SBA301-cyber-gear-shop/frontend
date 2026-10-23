import { totalOf } from "@/features/products";
import { defaultBuild } from "@/store/demo";

export function validateBuild(lines, products, budget) {
  const parts = lines.map((l) => ({
    ...products.find((p) => p.id === l.id),
    quantity: l.quantity,
  }));
  const by = (key) => parts.find((p) => p.category === key);
  const cpu = by("cpu"),
    main = by("mainboard"),
    ram = parts.filter((p) => p.category === "ram"),
    gpu = by("gpu"),
    psu = by("psu"),
    box = by("case"),
    cooler = by("cooler");
  const result = [];
  const add = (label, ok, detail, unknown = false) =>
    result.push({
      label,
      status: unknown ? "unknown" : ok ? "pass" : "fail",
      detail,
    });
  const required = [
    "cpu",
    "mainboard",
    "ram",
    "gpu",
    "ssd",
    "psu",
    "case",
    "cooler",
  ];
  const complete =
    required.every((k) => by(k)) &&
    parts.every(
      (p) =>
        p.id &&
        p.status === "active" &&
        Number.isInteger(p.quantity) &&
        p.quantity > 0 &&
        p.quantity <= p.stock,
    ) &&
    required
      .filter((k) => k !== "ram" && k !== "ssd")
      .every(
        (k) =>
          parts
            .filter((p) => p.category === k)
            .reduce((s, p) => s + p.quantity, 0) === 1,
      );
  add(
    "Thành phần & tồn kho",
    complete,
    complete
      ? "Đủ nhóm linh kiện và số lượng."
      : "Thiếu linh kiện, trùng linh kiện hoặc không đủ tồn kho.",
  );
  const cpuKnown =
    !!cpu?.tech?.socket &&
    !!main?.tech?.socket &&
    Array.isArray(main?.tech?.supportedCpu);
  add(
    "CPU ↔ bo mạch chủ",
    cpuKnown &&
      cpu.tech.socket === main.tech.socket &&
      main.tech.supportedCpu.includes(cpu.id),
    "Đối chiếu socket và danh sách CPU hỗ trợ trong dữ liệu demo.",
    !cpuKnown,
  );
  const ramCount = ram.reduce((s, p) => s + p.quantity, 0),
    capacity = ram.reduce(
      (s, p) => s + (p.tech?.capacity || 0) * p.quantity,
      0,
    );
  const ramKnown =
    !!main?.tech?.ramSlots &&
    !!main?.tech?.maxRam &&
    !!main?.tech?.memory &&
    ram.length > 0 &&
    ram.every((p) => p.tech?.memory && p.tech?.capacity && p.tech?.form);
  add(
    "RAM & số khe",
    ramKnown &&
      ram.every(
        (p) => p.tech.memory === main.tech.memory && p.tech.form === "DIMM",
      ) &&
      ramCount <= main.tech.ramSlots &&
      capacity <= main.tech.maxRam,
    ramCount +
      " thanh / " +
      (main?.tech?.ramSlots || "?") +
      " khe · " +
      capacity +
      "GB",
    !ramKnown,
  );
  const powerKnown =
    !!psu?.tech?.power &&
    !!cpu?.tech?.power &&
    !!gpu?.tech?.power &&
    gpu?.tech?.connectors != null &&
    psu?.tech?.gpuConnectors != null;
  add(
    "Nguồn & đầu nối",
    powerKnown &&
      psu.tech.power >= (cpu.tech.power + gpu.tech.power + 100) * 1.25 &&
      psu.tech.gpuConnectors >= gpu.tech.connectors,
    "Ước tính tải + dự phòng; cần xác nhận thực tế trước khi lắp.",
    !powerKnown,
  );
  const storage = parts.filter((p) => p.category === "ssd");
  add(
    "Ổ cứng & kết nối",
    !!main?.tech?.m2 &&
      storage.every((p) => p.tech?.interface === "M.2 NVMe") &&
      storage.reduce((s, p) => s + p.quantity, 0) <= main.tech.m2,
    "Kiểm tra số khe M.2 theo cấu hình demo.",
    !main?.tech?.m2 || storage.some((p) => !p.tech?.interface),
  );
  const sizeKnown =
    !!box?.tech?.gpuMax &&
    !!box?.tech?.coolerMax &&
    !!gpu?.tech?.length &&
    !!cooler?.tech?.height &&
    Array.isArray(box?.tech?.forms) &&
    !!main?.tech?.form &&
    Array.isArray(cooler?.tech?.sockets);
  add(
    "Kích thước lắp đặt",
    sizeKnown &&
      box.tech.gpuMax >= gpu.tech.length &&
      box.tech.coolerMax >= cooler.tech.height &&
      box.tech.forms.includes(main.tech.form) &&
      cooler.tech.sockets.includes(cpu?.tech?.socket),
    "Đối chiếu case, GPU và tản nhiệt.",
    !sizeKnown,
  );
  add(
    "Ngân sách",
    Number.isFinite(budget) && budget > 0 && totalOf(lines, products) <= budget,
    "Tổng " + money(totalOf(lines, products)) + " / " + money(budget),
  );
  return {
    checks: result,
    valid: result.every((r) => r.status === "pass"),
    capacity,
  };
}
export function suggestBuild(
  products,
  budget,
  purpose,
  ramGb = 32,
  scope = "tower",
) {
  if (!Number.isFinite(budget) || budget <= 0)
    throw new Error("Nhập ngân sách hợp lệ.");
  if (scope !== "tower")
    throw new Error(
      "Demo hiện hỗ trợ thùng máy; hãy mua màn hình riêng hoặc dùng API AI để tư vấn toàn bộ góc máy.",
    );
  const lines = structuredClone(defaultBuild).map((l) => ({
    ...l,
    id: l.id === "case1" ? "case2" : l.id,
  }));
  const ram = lines.find((l) => l.id === "ram16");
  ram.quantity = Math.ceil(ramGb / 16);
  if (purpose === "creative" && budget >= 26000000)
    lines.find((l) => l.id === "gpu1").id = "gpu2";
  if (totalOf(lines, products) > budget)
    lines.find((l) => l.id === "main1").id = "main2";
  const check = validateBuild(lines, products, budget);
  if (!check.valid)
    throw new Error(
      "Chưa tìm được cấu hình phù hợp trong dữ liệu demo. " +
        check.checks
          .filter((c) => c.status !== "pass")
          .map((c) => c.label)
          .join(", ") +
        ". Hãy điều chỉnh nhu cầu hoặc ngân sách.",
    );
  return lines;
}
import { money } from "@/utils";
