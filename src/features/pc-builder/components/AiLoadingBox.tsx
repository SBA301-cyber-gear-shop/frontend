import type { LoadingStep } from "../hooks/usePcBuilder";

const STAR_PATH =
  "M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z";

function PegtopDefs() {
  return (
    <defs>
      <filter id="ai-shine">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <mask id="ai-mask">
        <path d={STAR_PATH} fill="white" />
      </mask>
      <radialGradient
        id="ai-gradient-1"
        cx="50"
        cy="66"
        fx="50"
        fy="66"
        r="30"
        gradientTransform="translate(0 35) scale(1 0.5)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="black" stopOpacity="0.3" />
        <stop offset="50%" stopColor="black" stopOpacity="0.1" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id="ai-gradient-2"
        cx="55"
        cy="20"
        fx="55"
        fy="20"
        r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id="ai-gradient-3"
        cx="85"
        cy="50"
        fx="85"
        fy="50"
        xlinkHref="#ai-gradient-2"
        href="#ai-gradient-2"
      />
      <radialGradient
        id="ai-gradient-4"
        cx="50"
        cy="58"
        fx="50"
        fy="58"
        r="60"
        gradientTransform="translate(0 47) scale(1 0.2)"
        xlinkHref="#ai-gradient-3"
        href="#ai-gradient-3"
      />
      <linearGradient
        id="ai-gradient-5"
        x1="50"
        y1="90"
        x2="50"
        y2="10"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="black" stopOpacity="0.2" />
        <stop offset="40%" stopColor="black" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function PegtopSvg({ id, hasDefs = false }: { id: string; hasDefs?: boolean }) {
  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      {hasDefs && <PegtopDefs />}
      <g>
        <path d={STAR_PATH} fill="currentColor" />
        <path d={STAR_PATH} fill="url(#ai-gradient-1)" />
        <path
          d={STAR_PATH}
          fill="none"
          stroke="white"
          opacity="0.3"
          strokeWidth="3"
          filter="url(#ai-shine)"
          mask="url(#ai-mask)"
        />
        <path d={STAR_PATH} fill="url(#ai-gradient-2)" />
        <path d={STAR_PATH} fill="url(#ai-gradient-3)" />
        <path d={STAR_PATH} fill="url(#ai-gradient-4)" />
        <path d={STAR_PATH} fill="url(#ai-gradient-5)" />
      </g>
    </svg>
  );
}

const STEP_TEXT: Record<LoadingStep, { title: string; desc: string }> = {
  analyze: {
    title: "AI đang đọc nhu cầu và thẩm định ngân sách...",
    desc: "Chuẩn hóa mô tả của bạn thành mục đích sử dụng và kiểm tra ngân sách tối thiểu.",
  },
  build: {
    title: "Đang chọn linh kiện & kiểm tra tương thích...",
    desc: "Chia ngân sách, chọn linh kiện còn hàng, kiểm tra luật phần cứng rồi viết lời tư vấn.",
  },
  load: {
    title: "Đang nạp cấu hình từ giỏ hàng...",
    desc: "Kiểm tra lại giá, tồn kho và tương thích với dữ liệu mới nhất.",
  },
};

export function AiLoadingBox({ step = "analyze" }: { step?: LoadingStep }) {
  const text = STEP_TEXT[step];
  return (
    <div className="ai-loading-box" id="aiLoadingBox">
      {/* From Uiverse.io by andrew-manzyk - Crystal Stream Pegtop Loader */}
      <div className="ai-loader-container">
        <div className="loader">
          <PegtopSvg id="pegtopone" hasDefs />
          <PegtopSvg id="pegtoptwo" />
          <PegtopSvg id="pegtopthree" />
        </div>
      </div>

      <h3 className="ai-loading-title">{text.title}</h3>
      <p className="ai-loading-desc">{text.desc}</p>
    </div>
  );
}
