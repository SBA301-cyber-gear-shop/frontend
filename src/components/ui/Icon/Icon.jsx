export function Icon({ name = "grid", ...props }) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    cart: <path d="M2 3h3l3 13h10l3-9H6M9 21h.1M18 21h.1" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    chip: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    mail: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    lock: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    bag: (
      <>
        <rect x="4" y="7" width="16" height="15" rx="2" />
        <path d="M8 8V5a4 4 0 0 1 8 0v3" />
      </>
    ),
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />,
    pin: (
      <>
        <path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 0 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    copy: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
      </>
    ),
    plus: (
      <>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    message: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
