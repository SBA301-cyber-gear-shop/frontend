import { money } from "@/utils";
import type { AiBuildInsight, BudgetFit, RequirementProfile } from "../types/pcBuilder.types";
import { itemReason } from "./ProfileEditor";

const ROLE_NAMES: Record<string, string> = {
  cpu: "CPU",
  mainboard: "bo mạch chủ",
  ram: "RAM",
  gpu: "card đồ họa",
  ssd: "SSD",
  psu: "nguồn",
  case: "vỏ máy",
  cooler: "tản nhiệt",
};
// Mã chỉ có ý nghĩa nội bộ: không hiện cho khách
const HIDDEN_WARNINGS = new Set(["OP_NORMALIZED"]);

/** Câu thân thiện cho reasonCode theo bảng DD 6.6; null khi không có gì để nói. */
export function reasonMessage(
  reasonCode: string | null | undefined,
  budgetFit: BudgetFit | null | undefined,
  totalPrice: number,
  profile?: RequirementProfile | null,
  relaxedItems: string[] = [],
): string | null {
  const leftover = money(budgetFit?.leftover ?? 0);
  switch (reasonCode) {
    case "NEEDS_SATURATED":
      return `Với nhu cầu "${profile?.summary || "của bạn"}", cấu hình ${money(totalPrice)} đã đáp ứng tối đa. Nâng cấp thêm không cải thiện trải nghiệm. Bạn còn dư ${leftover}.`;
    case "CATALOG_CEILING":
      return `Đây là cấu hình mạnh nhất cửa hàng đang có cho nhu cầu này. Còn dư ${leftover}, vui lòng liên hệ để báo giá máy trạm/server.`;
    case "MAX_PRICE_REACHED":
      return `Đây là cấu hình đắt nhất ráp được trong kho và ngân sách (${money(totalPrice)}), không phải cấu hình tối ưu cho nhu cầu. Bạn còn dư ${leftover}.`;
    case "REQUIREMENT_RELAXED": {
      const reasons = relaxedItems.map((id) => itemReason(profile, id));
      return `Ngân sách chưa đủ cho: ${reasons.join("; ") || "một số yêu cầu"}. Hệ thống đã đề xuất mức gần nhất.`;
    }
    default:
      if (!budgetFit) return null;
      return `Tổng giá đạt ${budgetFit.percent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% ngân sách, còn dư ${leftover}.`;
  }
}

/** "CODE:chi tiết" → câu tiếng Việt; null = không hiện. Mã lạ hiện câu chung, không lộ mã thô cho khách (B7). */
export function warningText(warning: string): string | null {
  const [code, ...rest] = warning.split(":");
  if (HIDDEN_WARNINGS.has(code)) return null;
  switch (code) {
    case "REQUIREMENT_RELAXED": {
      const change = rest.slice(1).join(":").replace("→", " → ");
      return change ? `Đã hạ yêu cầu để vừa ngân sách (${change})` : "Đã hạ yêu cầu để vừa ngân sách";
    }
    case "REQUIRED_ROLE_IMPLIED":
      return `Đã thêm ${ROLE_NAMES[rest[0]] ?? "linh kiện"} vì nhu cầu của bạn cần`;
    case "CONSTRAINT_UNSATISFIABLE":
      return "Yêu cầu vượt khoảng giá trị kho đang có";
    case "BRAND_NOT_AVAILABLE":
      return "Thương hiệu bạn muốn chưa có trong kho";
    case "PSU_HIGH_WATTAGE":
      return "Bộ máy cần nguồn trên 1600 W";
    default:
      return "Hệ thống đã tự điều chỉnh một mục trong hồ sơ nhu cầu";
  }
}

interface AiInsightPanelProps {
  insight: AiBuildInsight;
  reasonCode?: string | null;
  budgetFit?: BudgetFit | null;
  totalPrice?: number;
  profile?: RequirementProfile | null;
  relaxedItems?: string[];
  warnings?: string[];
}

export function AiInsightPanel({
  insight,
  reasonCode,
  budgetFit,
  totalPrice = 0,
  profile,
  relaxedItems = [],
  warnings = [],
}: AiInsightPanelProps) {
  const reason = reasonMessage(reasonCode, budgetFit, totalPrice, profile, relaxedItems);
  const shownWarnings = warnings.map(warningText).filter((text): text is string => Boolean(text));

  return (
    <div className="ai-insight-panel" id="aiInsightPanel">
      <div className="ai-header-row">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2.5"
        >
          <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
        </svg>
        <span className="ai-eyebrow">CHUYÊN GIA AI CYBERSHOP NHẬN XÉT</span>
      </div>
      <h2 className="ai-title" id="aiBuildTitle">
        {insight.title}
      </h2>
      <p className="ai-reasoning" id="aiBuildReasoning">
        {insight.reasoning}
      </p>
      <div className="ai-highlight-pill" id="aiBuildHighlight">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>
          <strong>Hiệu năng dự kiến:</strong> {insight.highlight}
        </span>
      </div>
      {reason && (
        <p className={`ai-reason-note ${reasonCode ? "has-code" : ""}`} id="aiReasonNote">
          {reason}
        </p>
      )}
      {shownWarnings.length > 0 && (
        <ul className="ai-warning-list" aria-label="Lưu ý từ hệ thống">
          {shownWarnings.map((text, index) => (
            <li key={`${index}-${text}`}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
