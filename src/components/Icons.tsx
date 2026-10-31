type P = { size?: number; className?: string };

const s = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

export const ChevronRight = ({ size, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDown = ({ size, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M3.5 6 8 10.5 12.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronUp = ({ size, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M3.5 10 8 5.5 12.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Close = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Search = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M10.2 10.2 13.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Play = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M4 2.6 12.8 8 4 13.4V2.6Z" fill="currentColor" />
  </svg>
);

export const Stop = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <rect x="3.5" y="3.5" width="9" height="9" fill="currentColor" />
  </svg>
);

export const ArrowLeft = ({ size = 16, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M13 8H3.5m0 0 3.6-3.6M3.5 8l3.6 3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowRight = ({ size = 16, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M3 8h9.5m0 0-3.6-3.6M12.5 8l-3.6 3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Refresh = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M13 8a5 5 0 1 1-1.6-3.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M13.4 2.6v3.2h-3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Account = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <circle cx="8" cy="5.4" r="2.6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3.2 13.2c.4-2.5 2.4-4 4.8-4s4.4 1.5 4.8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Collapse = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M8 2.5v11M3 8H2m12 0h-1M4.5 8 7 5.5M4.5 8 7 10.5M11.5 8 9 5.5M11.5 8 9 10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

export const ShowAll = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <rect x="2.5" y="3.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M2.5 6.5h11M5.5 3.5v9" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const PanelRight = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M10 3v10" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const PanelBottom = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M2 10h12" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const Folder = ({ size = 14, className, open }: P & { open?: boolean }) => (
  <svg {...s(size)} className={className}>
    {open ? (
      <path d="M1.8 12.5V4.2c0-.5.3-.8.8-.8h3.1l1.2 1.4h6.5c.5 0 .8.3.8.8v.9H4.4l-1.6 6h9.4l1.4-5.1" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    ) : (
      <path d="M1.8 12.3V4.2c0-.5.3-.8.8-.8h3.1l1.2 1.4h6.5c.5 0 .8.3.8.8v6.7c0 .5-.3.8-.8.8H2.6c-.5 0-.8-.3-.8-.8Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    )}
  </svg>
);

export const Solution = ({ size = 16, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M2 4.2 7.2 2l6.8 2.2v7.6L7.2 14 2 11.8V4.2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    <path d="M7.2 2v12M2 4.2l5.2 2.6L14 4.4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

export const ErrorIcon = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <circle cx="8" cy="8" r="6" fill="currentColor" />
    <path d="M5.6 5.6l4.8 4.8m0-4.8-4.8 4.8" stroke="#1f1f1f" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const WarningIcon = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M8 2.4 14.4 13.6H1.6L8 2.4Z" fill="currentColor" />
    <path d="M8 6v4M8 11.6v.6" stroke="#1f1f1f" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const InfoIcon = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <circle cx="8" cy="8" r="6" fill="currentColor" />
    <path d="M8 7.2v4M8 4.9v.7" stroke="#1f1f1f" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const GitBranch = ({ size = 13, className }: P) => (
  <svg {...s(size)} className={className}>
    <circle cx="4.5" cy="3.6" r="1.7" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="4.5" cy="12.4" r="1.7" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="11.5" cy="6.4" r="1.7" stroke="currentColor" strokeWidth="1.1" />
    <path d="M4.5 5.3v5.4M11.5 8.1c0 2-2.4 1.8-4.2 2.2" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const Bell = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M8 2.4a4.1 4.1 0 0 0-4.1 4.1v3L2.6 11.6h10.8L12.1 9.5v-3A4.1 4.1 0 0 0 8 2.4Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M6.6 12.8a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const Sparkle = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M8 1.8 9.5 6 13.8 7.4 9.5 8.9 8 13.2 6.5 8.9 2.2 7.4 6.5 6 8 1.8Z" fill="currentColor" />
    <path d="M12.6 10.6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" fill="currentColor" opacity=".8" />
  </svg>
);

export const Pin = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M9.6 2.2 13.8 6.4l-1.6.5-3 3-.2 2.4-1.3 1.3-2.5-2.5-2.7 2.7-.7-.7 2.7-2.7L2.5 8.9 3.8 7.6l2.4-.2 3-3 .4-1.6Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

export const WindowMin = ({ size = 10, className }: P) => (
  <svg {...s(size)} viewBox="0 0 10 10" className={className}>
    <path d="M1.5 5h7" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const WindowMax = ({ size = 10, className }: P) => (
  <svg {...s(size)} viewBox="0 0 10 10" className={className}>
    <rect x="1.6" y="1.6" width="6.8" height="6.8" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export const WindowClose = ({ size = 10, className }: P) => (
  <svg {...s(size)} viewBox="0 0 10 10" className={className}>
    <path d="M1.8 1.8l6.4 6.4m0-6.4L1.8 8.2" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const Properties = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <rect x="2.4" y="2.6" width="11.2" height="10.8" rx="1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M2.4 6.2h11.2M6.2 6.2v7.2" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

export const Send = ({ size = 14, className }: P) => (
  <svg {...s(size)} className={className}>
    <path d="M2 8h9M8 4.5 11.8 8 8 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
