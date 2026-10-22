import type { AiBuildInsight } from "../types/pcBuilder.types";

interface AiInsightPanelProps {
  insight: AiBuildInsight;
}

export function AiInsightPanel({ insight }: AiInsightPanelProps) {
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
    </div>
  );
}
