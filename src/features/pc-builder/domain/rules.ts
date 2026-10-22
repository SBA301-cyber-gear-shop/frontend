import { money } from "@/utils";
import type { BuildPart, RuleCheck } from "../types/pcBuilder.types";

export function evaluateHardwareRules(
  parts: BuildPart[],
  budget: number,
): RuleCheck[] {
  const getPart = (role: string) => parts.find((p) => p.role === role);

  const cpu = getPart("cpu");
  const mainboard = getPart("mainboard");
  const ram = getPart("ram");
  const gpu = getPart("gpu");
  const ssd = getPart("ssd");
  const psu = getPart("psu");
  const pcCase = getPart("case");
  const cooler = getPart("cooler");

  const rules: RuleCheck[] = [];

  // 1. Linh kiện cốt lõi
  const requiredRoles = [
    "cpu",
    "mainboard",
    "ram",
    "gpu",
    "ssd",
    "psu",
    "case",
    "cooler",
  ];
  const presentCount = requiredRoles.filter((r) => getPart(r)).length;
  const isCoreComplete = presentCount === requiredRoles.length;
  rules.push({
    id: "core-components",
    title: "Linh kiện cốt lõi",
    detail: isCoreComplete
      ? `Đã chọn đủ ${presentCount} nhóm linh kiện cần thiết`
      : `Thiếu ${requiredRoles.length - presentCount} nhóm linh kiện`,
    status: isCoreComplete ? "pass" : "fail",
  });

  // 2. Socket CPU ↔ Bo mạch chủ
  const cpuSocket = cpu?.specs?.["Socket"] || "LGA1700";
  const mbSocket = mainboard?.specs?.["Socket"] || "LGA1700";
  const isSocketMatch = cpuSocket === mbSocket;
  rules.push({
    id: "socket-match",
    title: "Socket CPU ↔ Bo mạch chủ",
    detail: isSocketMatch
      ? `${cpuSocket} == ${mbSocket} (Khớp tuyệt đối)`
      : `Xung đột: CPU ${cpuSocket} ≠ Mainboard ${mbSocket}`,
    status: isSocketMatch ? "pass" : "fail",
  });

  // 3. Chuẩn bộ nhớ RAM
  const ramType = ram?.specs?.["Chuẩn RAM"] || "DDR5";
  const mbRamType = mainboard?.specs?.["Chuẩn RAM"] || "DDR5";
  const isRamMatch = ramType === mbRamType;
  rules.push({
    id: "ram-standard",
    title: "Chuẩn bộ nhớ RAM",
    detail: isRamMatch
      ? `${ramType} == ${mbRamType} (Khớp chuẩn mainboard)`
      : `Xung đột: RAM ${ramType} ≠ Khe Mainboard ${mbRamType}`,
    status: isRamMatch ? "pass" : "fail",
  });

  // 4. Số khe cắm RAM
  const ramQty = ram?.quantity || 2;
  const mbRamSlots = Number(mainboard?.specs?.["Khe RAM"] || 4);
  const isSlotsOk = ramQty <= mbRamSlots;
  const emptySlots = Math.max(0, mbRamSlots - ramQty);
  rules.push({
    id: "ram-slots",
    title: "Số khe cắm RAM",
    detail: isSlotsOk
      ? `${ramQty} thanh RAM / ${mbRamSlots} khe cắm (Còn ${emptySlots} khe trống)`
      : `Quá số khe: Chọn ${ramQty} thanh nhưng bo mạch chỉ có ${mbRamSlots} khe`,
    status: isSlotsOk ? "pass" : "fail",
  });

  // 5. Kích thước Card đồ họa (VGA)
  const gpuLenStr = gpu?.specs?.["Chiều dài"] || "192mm";
  const caseVgaStr = pcCase?.specs?.["Max VGA"] || "330mm";
  const gpuLen = parseInt(gpuLenStr, 10) || 192;
  const caseVga = parseInt(caseVgaStr, 10) || 330;
  const isVgaFit = gpuLen <= caseVga;
  rules.push({
    id: "vga-clearance",
    title: "Kích thước Card đồ họa (VGA)",
    detail: isVgaFit
      ? `Dài ${gpuLen}mm ≤ Giới hạn vỏ case ${caseVga}mm`
      : `Quá dài: Card dài ${gpuLen}mm vượt quá vỏ case (${caseVga}mm)`,
    status: isVgaFit ? "pass" : "fail",
  });

  // 6. Chiều cao Tản nhiệt CPU
  const coolerHeightStr = cooler?.specs?.["Chiều cao"] || "150mm";
  const caseCoolerStr = pcCase?.specs?.["Max Tản CPU"] || "161mm";
  const coolerHeight = parseInt(coolerHeightStr, 10) || 150;
  const caseCooler = parseInt(caseCoolerStr, 10) || 161;
  const isCoolerFit = coolerHeight <= caseCooler;
  rules.push({
    id: "cooler-clearance",
    title: "Chiều cao Tản nhiệt CPU",
    detail: isCoolerFit
      ? `Cao ${coolerHeight}mm ≤ Giới hạn vỏ case ${caseCooler}mm`
      : `Quá cao: Tản nhiệt ${coolerHeight}mm cấn nắp kính case (${caseCooler}mm)`,
    status: isCoolerFit ? "pass" : "fail",
  });

  // 7. Công suất Nguồn (PSU)
  const psuWattStr = psu?.specs?.["Công suất"] || "650W";
  const psuWatt = parseInt(psuWattStr, 10) || 650;
  // Estimated system load: CPU 148W + GPU 115W + system base 140W = ~403W, safe target ~446W
  const estimatedSafeLoad = 446;
  const isPsuOk = psuWatt >= estimatedSafeLoad;
  const headroomPercent = Math.round(((psuWatt - estimatedSafeLoad) / estimatedSafeLoad) * 100);
  rules.push({
    id: "psu-capacity",
    title: "Công suất Nguồn (PSU)",
    detail: isPsuOk
      ? `Nguồn ${psuWatt}W ≥ Tải an toàn ${estimatedSafeLoad}W (Dư tải ${headroomPercent}%)`
      : `Thiếu công suất: Nguồn ${psuWatt}W không đủ an toàn cho dàn máy (cần tối thiểu ${estimatedSafeLoad}W)`,
    status: isPsuOk ? "pass" : "fail",
  });

  // 8. Ngân sách dự chi
  const grandTotal = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const isBudgetOk = grandTotal <= budget;
  rules.push({
    id: "budget-check",
    title: "Ngân sách dự chi",
    detail: isBudgetOk
      ? `${money(grandTotal)} ≤ ${money(budget)} (Trong hạn mức)`
      : `Vượt ngân sách: ${money(grandTotal)} > ${money(budget)} (Cần giảm ${money(grandTotal - budget)})`,
    status: isBudgetOk ? "pass" : "fail",
  });

  return rules;
}
