interface CategoryHardwareIconProps {
  name?: string;
  slug?: string;
  size?: number;
  className?: string;
}

/**
 * Hiển thị icon phần cứng máy tính SVG đồng bộ với TechZone Pro design system.
 */
export function CategoryHardwareIcon({
  name = "",
  slug = "",
  size = 16,
  className = "",
}: CategoryHardwareIconProps) {
  const s = `${name} ${slug}`.toLowerCase();

  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: `cat-hw-icon ${className}`.trim(),
    "aria-hidden": true,
  };

  // CPU
  if (s.includes("cpu") || s.includes("vi xử lý") || s.includes("vi-xu-ly") || s.includes("processor")) {
    return (
      <svg {...props}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3M19 9h3m-3 6h3" />
      </svg>
    );
  }

  // Mainboard
  if (s.includes("mainboard") || s.includes("bo mạch") || s.includes("bo-mach") || s.includes("motherboard")) {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="5" height="5" rx="1" />
        <path d="M7 16h3m4-9h3m-3 4h3m-7 5v2m4-2v2m-8-7h1" />
      </svg>
    );
  }

  // RAM
  if (s.includes("ram") || s.includes("bộ nhớ") || s.includes("bo-nho") || s.includes("memory")) {
    return (
      <svg {...props}>
        <rect x="2" y="8" width="20" height="9" rx="1.5" />
        <path d="M6 17v2m4-2v2m4-2v2m4-2v2M6 8V6m4 2V6m4 2V6m4 2V6M6 11h2m4 0h2m4 0h2" />
      </svg>
    );
  }

  // GPU
  if (s.includes("gpu") || s.includes("đồ họa") || s.includes("do-hoa") || s.includes("card") || s.includes("vga")) {
    return (
      <svg {...props}>
        <rect x="2" y="5" width="20" height="13" rx="2" />
        <circle cx="8" cy="11.5" r="3" />
        <circle cx="16" cy="11.5" r="3" />
        <path d="M6 18v2m12-2v2M2 9h2m-2 5h2" />
      </svg>
    );
  }

  // SSD / Storage
  if (s.includes("ssd") || s.includes("ổ cứng") || s.includes("o-cung") || s.includes("storage") || s.includes("hdd")) {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="7" cy="8" r="1.5" />
        <circle cx="17" cy="8" r="1.5" />
        <path d="M7 16h10m-10-3h6" />
      </svg>
    );
  }

  // PSU
  if (s.includes("psu") || s.includes("nguồn") || s.includes("nguon") || s.includes("power")) {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="12" r="4" />
        <path d="m11 9 3 3-2 1 2 2M3 8h1m16 0h1m-1 8h1" />
      </svg>
    );
  }

  // Case
  if (s.includes("case") || s.includes("vỏ") || s.includes("vo") || s.includes("chassis")) {
    return (
      <svg {...props}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="6.5" r="1" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <rect x="8" y="13" width="8" height="5" rx="1" />
      </svg>
    );
  }

  // Cooler / Fan
  if (s.includes("cooler") || s.includes("tản nhiệt") || s.includes("tan-nhiet") || s.includes("fan")) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 3a9 9 0 0 1 3 6l-3 3m-9 0a9 9 0 0 1 6-3l3 3m0 9a9 9 0 0 1-3-6l3-3m9 0a9 9 0 0 1-6 3l-3-3" />
      </svg>
    );
  }

  // Monitor
  if (s.includes("monitor") || s.includes("màn hình") || s.includes("man-hinh")) {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </svg>
    );
  }

  // Default Hardware Chip
  return (
    <svg {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
    </svg>
  );
}

