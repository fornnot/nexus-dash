import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
} as const;

export const Icon = {
  home: (p: P) => (
    <svg {...base} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  fx: (p: P) => (
    <svg {...base} {...p}>
      <path d="M4 19 9 5l5 14" />
      <path d="M6.2 14h5.6" />
      <path d="M15 9.5c1-1.7 4.5-1.7 5 0 .6 2-5 2.6-5 5 0 1.8 3.6 2 5 .5" />
    </svg>
  ),
  utilities: (p: P) => (
    <svg {...base} {...p}>
      <path d="M14.5 6.5a4 4 0 0 1 5 5L9 22l-5 1 1-5z" />
      <path d="m13 8 3 3" />
    </svg>
  ),
  feed: (p: P) => (
    <svg {...base} {...p}>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  ),
  search: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  refresh: (p: P) => (
    <svg {...base} {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  ),
  wifi: (p: P) => (
    <svg {...base} {...p}>
      <path d="M2 8.5a15 15 0 0 1 20 0" />
      <path d="M5.5 12a10 10 0 0 1 13 0" />
      <path d="M9 15.5a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  wifiOff: (p: P) => (
    <svg {...base} {...p}>
      <path d="M2 2l20 20" />
      <path d="M8.5 16.5a5 5 0 0 1 6.4-.5" />
      <path d="M5.5 12a10 10 0 0 1 3-2" />
      <path d="M2 8.5a15 15 0 0 1 5-3.3" />
      <path d="M12 5c2.4 0 4.7.8 6.6 2.2" />
      <path d="M18.5 10.7a10 10 0 0 1 1.5 1.3" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  copy: (p: P) => (
    <svg {...base} {...p}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  check: (p: P) => (
    <svg {...base} {...p}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  ),
  trash: (p: P) => (
    <svg {...base} {...p}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
    </svg>
  ),
  download: (p: P) => (
    <svg {...base} {...p}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  ),
  swap: (p: P) => (
    <svg {...base} {...p}>
      <path d="M4 8h14l-3.5-3.5" />
      <path d="M20 16H6l3.5 3.5" />
    </svg>
  ),
  file: (p: P) => (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  image: (p: P) => (
    <svg {...base} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 19 5.5-5.5 3 3L17 13l3 3" />
    </svg>
  ),
  text: (p: P) => (
    <svg {...base} {...p}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h13" />
    </svg>
  ),
  pdf: (p: P) => (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 15h1.5a1.2 1.2 0 0 0 0-2.4H8V17" />
      <path d="M13 17v-4.4h1a1.6 1.6 0 0 1 1.6 1.6v1.2A1.6 1.6 0 0 1 14 17z" />
    </svg>
  ),
  install: (p: P) => (
    <svg {...base} {...p}>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M12 7v7" />
      <path d="m9 11 3 3 3-3" />
    </svg>
  ),
  arrow: (p: P) => (
    <svg {...base} {...p}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  sun: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  live: (p: P) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10" />
    </svg>
  ),
} satisfies Record<string, (p: P) => JSX.Element>;
