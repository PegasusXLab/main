// T-159: the tab icon (src/app/icon.svg, T-158) next to the "Galleriverse" wordmark.
// Inline so it is crisp at any size and needs no extra request; keep it in sync with icon.svg.

export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="5" fill="#EFF0EE" />
      <polygon points="16,18 5,23.5 16,29 27,23.5" fill="#FFFFFF" />
      <polygon points="16,6 5,11.5 5,23.5 16,18" fill="#DCDEDB" />
      <polygon points="16,6 27,11.5 27,23.5 16,18" fill="#C4C7C3" />
      <polygon points="8,15 13,12.5 13,17 8,19.5" fill="#002FA7" />
      <polyline
        points="5,11.5 16,6 27,11.5"
        fill="none"
        stroke="#1E2022"
        strokeWidth="2.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
