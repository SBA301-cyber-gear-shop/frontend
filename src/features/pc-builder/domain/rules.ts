import { money } from "@/utils";
import type { BuildPart, CompatibilityStatus, RuleCheck } from "../types/pcBuilder.types";

/**
 * Kiểm tra tương thích CHỈ cho demo mode (API mode dùng check của backend, DD 10.4).
 * Đọc thông số theo tên chuẩn trong DB; thiếu thông số thì "unknown", không đoán giá trị mặc định.
 */
export function evaluateHardwareRules(
  parts: BuildPart[],
  budget: number,
): RuleCheck[] {
  const getPart = (role: string) => parts.find((p) => p.role === role);
  const text = (role: string, spec: string) => getPart(role)?.specs?.[spec] || null;
  const num = (role: string, spec: string) => {
    const value = Number.parseFloat(text(role, spec) ?? "");
    return Number.isFinite(value) ? value : null;
  };
  const rules: RuleCheck[] = [];
  const push = (
    id: string,
    title: string,
    ok: boolean | null,
    pass: string,
    fail: string,
    missing: string,
  ) => {
    const status: CompatibilityStatus = ok === null ? "unknown" : ok ? "pass" : "fail";
    rules.push({ id, title, status, detail: ok === null ? missing : ok ? pass : fail });
  };

  // 1. Linh kiện cốt lõi
  const requiredRoles = ["cpu", "mainboard", "ram", "gpu", "ssd", "psu", "case", "cooler"];
  const presentCount = requiredRoles.filter((r) => getPart(r)).length;
  push(
    "core-components",
    "Linh kiện cốt lõi",
    presentCount === requiredRoles.length,
    `Đã chọn đủ ${presentCount} nhóm linh kiện cần thiết`,
    `Thiếu ${requiredRoles.length - presentCount} nhóm linh kiện`,
    "",
  );

  // 2. Socket CPU ↔ Bo mạch chủ
  const cpuSocket = text("cpu", "Socket");
  const mbSocket = text("mainboard", "Socket");
  push(
    "socket-match",
    "Socket CPU ↔ Bo mạch chủ",
    cpuSocket && mbSocket ? cpuSocket === mbSocket : null,
    `${cpuSocket} == ${mbSocket} (Khớp tuyệt đối)`,
    `Xung đột: CPU ${cpuSocket} ≠ Mainboard ${mbSocket}`,
    "Thiếu thông số Socket của CPU hoặc bo mạch chủ",
  );

  // 3. Chuẩn bộ nhớ RAM
  const ramType = text("ram", "Memory_Type");
  const mbRamType = text("mainboard", "Memory_Type");
  push(
    "ram-standard",
    "Chuẩn bộ nhớ RAM",
    ramType && mbRamType ? ramType === mbRamType : null,
    `${ramType} == ${mbRamType} (Khớp chuẩn mainboard)`,
    `Xung đột: RAM ${ramType} ≠ Khe Mainboard ${mbRamType}`,
    "Thiếu thông số Memory_Type của RAM hoặc bo mạch chủ",
  );

  // 4. Số khe cắm RAM: số thanh = số kit × Modules_Count
  const ram = getPart("ram");
  const modules = num("ram", "Modules_Count");
  const sticks = ram && modules !== null ? ram.quantity * modules : null;
  const mbRamSlots = num("mainboard", "RAM_Slots");
  push(
    "ram-slots",
    "Số khe cắm RAM",
    sticks !== null && mbRamSlots !== null ? sticks <= mbRamSlots : null,
    `${sticks} thanh RAM / ${mbRamSlots} khe cắm (Còn ${Math.max(0, (mbRamSlots ?? 0) - (sticks ?? 0))} khe trống)`,
    `Quá số khe: Chọn ${sticks} thanh nhưng bo mạch chỉ có ${mbRamSlots} khe`,
    "Thiếu thông số Modules_Count của RAM hoặc RAM_Slots của bo mạch chủ",
  );

  // 5. Kích thước Card đồ họa (VGA)
  const gpuLen = num("gpu", "Length_MM");
  const caseVga = num("case", "Max_GPU_Length_MM");
  push(
    "vga-clearance",
    "Kích thước Card đồ họa (VGA)",
    gpuLen !== null && caseVga !== null ? gpuLen <= caseVga : null,
    `Dài ${gpuLen}mm ≤ Giới hạn vỏ case ${caseVga}mm`,
    `Quá dài: Card dài ${gpuLen}mm vượt quá vỏ case (${caseVga}mm)`,
    "Thiếu thông số Length_MM của VGA hoặc Max_GPU_Length_MM của vỏ case",
  );

  // 6. Chiều cao Tản nhiệt CPU
  const coolerHeight = num("cooler", "Height_MM");
  const caseCooler = num("case", "Max_Cooler_Height_MM");
  push(
    "cooler-clearance",
    "Chiều cao Tản nhiệt CPU",
    coolerHeight !== null && caseCooler !== null ? coolerHeight <= caseCooler : null,
    `Cao ${coolerHeight}mm ≤ Giới hạn vỏ case ${caseCooler}mm`,
    `Quá cao: Tản nhiệt ${coolerHeight}mm cấn nắp kính case (${caseCooler}mm)`,
    "Thiếu thông số Height_MM của tản hoặc Max_Cooler_Height_MM của vỏ case",
  );

  // 7. Công suất Nguồn (PSU)
  // shortcut: ước lượng demo (TDP CPU + TDP GPU × số card + 100 W) × 1,25; backend dùng PsuSizer
  const psuWatt = num("psu", "Wattage");
  const cpuTdp = num("cpu", "TDP_Power");
  const gpuTdp = num("gpu", "TDP_Power");
  const gpuQty = getPart("gpu")?.quantity ?? 1;
  const required =
    cpuTdp !== null && gpuTdp !== null ? Math.ceil((cpuTdp + gpuTdp * gpuQty + 100) * 1.25) : null;
  push(
    "psu-capacity",
    "Công suất Nguồn (PSU)",
    psuWatt !== null && required !== null ? psuWatt >= required : null,
    `Nguồn ${psuWatt}W ≥ Tải an toàn ${required}W`,
    `Thiếu công suất: Nguồn ${psuWatt}W không đủ an toàn cho dàn máy (cần tối thiểu ${required}W)`,
    "Thiếu thông số Wattage của nguồn hoặc TDP_Power của CPU/VGA",
  );

  // 8. Ngân sách dự chi
  const grandTotal = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  push(
    "budget-check",
    "Ngân sách dự chi",
    grandTotal <= budget,
    `${money(grandTotal)} ≤ ${money(budget)} (Trong hạn mức)`,
    `Vượt ngân sách: ${money(grandTotal)} > ${money(budget)} (Cần giảm ${money(grandTotal - budget)})`,
    "",
  );

  return rules;
}
