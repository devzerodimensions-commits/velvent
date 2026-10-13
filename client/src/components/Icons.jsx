/* Line icons drawn to one spec: 24px grid, 1.5 stroke, round caps. */
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};
const Svg = ({ children, size = 20, ...rest }) => (
  <svg {...base} width={size} height={size} {...rest}>{children}</svg>
);

export const Search = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const User = (p) => <Svg {...p}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Svg>;
export const Heart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </Svg>
);
export const Bag = (p) => (
  <Svg {...p}><path d="M5 7h14l1 13H4L5 7Z" /><path d="M9 7V5.5a3 3 0 0 1 6 0V7" /></Svg>
);
export const Menu = (p) => <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>;
export const Close = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const ChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronLeft = (p) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const ChevronRight = (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const Plus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Minus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const Check = (p) => <Svg {...p}><path d="m5 13 4 4L19 7" /></Svg>;
export const Trash = (p) => (
  <Svg {...p}><path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></Svg>
);
export const Truck = (p) => (
  <Svg {...p}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
  </Svg>
);
export const Shield = (p) => (
  <Svg {...p}><path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6l7-2.5Z" /><path d="m9.3 12 1.9 1.9 3.6-3.6" /></Svg>
);
export const Refresh = (p) => (
  <Svg {...p}><path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" /><path d="M20 20v-4.5h-4.5" /></Svg>
);
export const Rupee = (p) => (
  <Svg {...p}><path d="M7 5h10M7 9h10M7 19l7-7c2.5-.3 3.5-1.8 3.5-3.5" /><path d="M7 9c4.5 0 7 1 7 3.5" /></Svg>
);
export const Star = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.3-4.6-2.6-4.6 2.6.9-5.3-3.8-3.7 5.2-.7L12 4Z" />
  </Svg>
);
export const Filter = (p) => <Svg {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Svg>;
export const Grid = (p) => (
  <Svg {...p}><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></Svg>
);
export const Box = (p) => (
  <Svg {...p}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></Svg>
);
export const Tag = (p) => (
  <Svg {...p}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="7.5" r="1.3" /></Svg>
);
export const Chart = (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
export const Mail = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" /><path d="m3 7 9 6 9-6" /></Svg>;
export const Phone = (p) => (
  <Svg {...p}><path d="M5 4h4l1.5 4-2 1.5a12 12 0 0 0 6 6L16 13.5l4 1.5v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4Z" /></Svg>
);
export const Clock = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const Pin = (p) => (
  <Svg {...p}><path d="M12 21s6.5-5.7 6.5-10.3a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.3" /></Svg>
);
export const Logout = (p) => (
  <Svg {...p}><path d="M14 20H6V4h8" /><path d="M11 12h10M18 9l3 3-3 3" /></Svg>
);
export const Ruler = (p) => (
  <Svg {...p}><rect x="2.5" y="8" width="19" height="8" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></Svg>
);
export const Upload = (p) => (
  <Svg {...p}><path d="M12 16V4M8.5 7.5 12 4l3.5 3.5" /><path d="M4 16v3h16v-3" /></Svg>
);
export const Whatsapp = (p) => (
  <Svg {...p}>
    <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z" />
    <path d="M9 9.5c.3 2.4 2.1 4.2 4.5 4.5.5.1 1-.3 1-.8v-.6l-1.6-.6-.7.7a5 5 0 0 1-1.9-1.9l.7-.7L10.4 8h-.6c-.5 0-.9.5-.8 1Z" />
  </Svg>
);
export const Instagram = (p) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.4" /><circle cx="17" cy="7" r=".9" fill="currentColor" /></Svg>
);
export const Facebook = (p) => (
  <Svg {...p}><path d="M14.5 8.5h2.3V5.2h-2.4c-2.3 0-3.6 1.4-3.6 3.7v1.6H8.5v3.3h2.3V21h3.4v-7.2h2.4l.4-3.3h-2.8V9.4c0-.6.2-.9.9-.9Z" /></Svg>
);
