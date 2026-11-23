const paths = {
  home: `<path d="M3.5 10.8 12 3.6l8.5 7.2"/><path d="M5.5 9.6V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.6"/><path d="M9.5 21v-5.5h5V21"/>`,
  book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v18H6.5A2.5 2.5 0 0 0 4 23.5v-18Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v18h4.5a2.5 2.5 0 0 1 2.5 2.5v-18Z"/>`,
  bookOpen: `<path d="M2.5 5.5h6A3.5 3.5 0 0 1 12 9v11a3.5 3.5 0 0 0-3.5-3.5h-6z"/><path d="M21.5 5.5h-6A3.5 3.5 0 0 0 12 9v11a3.5 3.5 0 0 1 3.5-3.5h6z"/>`,
  pen: `<path d="m14.5 5.5 4 4"/><path d="M4 20l1-5L16.7 3.3a1.8 1.8 0 0 1 2.6 0l1.4 1.4a1.8 1.8 0 0 1 0 2.6L9 19l-5 1Z"/><path d="m5 15 4 4"/>`,
  mic: `<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>`,
  micOff: `<path d="M9 9v1.5a3 3 0 0 0 4.6 2.6"/><path d="M15 11.5V5.5a3 3 0 0 0-5.6-1.5"/><path d="M5.5 11a6.5 6.5 0 0 0 10 5.6"/><path d="M18.5 11a6.5 6.5 0 0 1-.6 2.7"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/><path d="m3 3 18 18"/>`,
  grammar: `<path d="M4 5.5h16"/><path d="M12 5.5V21"/><path d="M8 21h8"/><path d="M4 12h5"/><path d="M15 12h5"/>`,
  headphones: `<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 17.5V13Z"/><path d="M20 13h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 0 1.5-1.5V13Z"/>`,
  leaf: `<path d="M20.5 3.5C12 3.5 6 7.6 6 14a5.5 5.5 0 0 0 5.5 5.5C18 19.5 20.5 12 20.5 3.5Z"/><path d="M4 21c2.5-3.5 5.3-6.4 9-9"/>`,
  flame: `<path d="M12 2.8s5.8 4.4 5.8 10.1a5.8 5.8 0 1 1-11.6 0c0-2.1 1-4.1 2.3-5.7.4 2.2 1.4 3.3 2.4 3.6.6-3.4 1.1-5.9 1.1-8Z"/><path d="M12 20.2c-1.8 0-3.1-1.3-3.1-3.1 0-1.7 1.2-3.2 3.1-4.8 1.9 1.6 3.1 3.1 3.1 4.8 0 1.8-1.3 3.1-3.1 3.1Z"/>`,
  bookmark: `<path d="M6.5 3.5h11a1 1 0 0 1 1 1v17L12 17l-6.5 4.5v-17a1 1 0 0 1 1-1Z"/>`,
  rotate: `<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5.5H9"/>`,
  settings: `<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>`,
  arrowRight: `<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>`,
  arrowLeft: `<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>`,
  arrowUpRight: `<path d="M7 17 17 7"/><path d="M8 7h9v9"/>`,
  chevronRight: `<path d="m9 5 7 7-7 7"/>`,
  chevronDown: `<path d="m5 9 7 7 7-7"/>`,
  chevronLeft: `<path d="m15 5-7 7 7 7"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
  sparkles: `<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m5.5 14 .6 1.6 1.6.6-1.6.6L5.5 18l-.6-1.6-1.6-.6 1.6-.6.6-1.6Z"/>`,
  check: `<path d="m4 12.5 5 5L20 6.5"/>`,
  checkCircle: `<circle cx="12" cy="12" r="9"/><path d="m8 12.2 2.7 2.7 5.3-5.4"/>`,
  x: `<path d="m5 5 14 14"/><path d="M19 5 5 19"/>`,
  play: `<path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none"/>`,
  pause: `<path d="M8 5h3v14H8zM15 5h3v14h-3z" fill="currentColor" stroke="none"/>`,
  stop: `<rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" stroke="none"/>`,
  volume: `<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>`,
  volumeOff: `<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"/><path d="m16 9 5 5"/><path d="m21 9-5 5"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  trash: `<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>`,
  search: `<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>`,
  filter: `<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>`,
  lock: `<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1"/>`,
  eye: `<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/>`,
  eyeOff: `<path d="m3 3 18 18"/><path d="M10.5 6.2A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.7 3.3"/><path d="M6 8.2C3.8 9.8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>`,
  logout: `<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M14 8l4 4-4 4"/><path d="M9 12h9"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
  users: `<path d="M16 21a6.5 6.5 0 0 0-13 0"/><circle cx="9.5" cy="8" r="3.7"/><path d="M17 4.8a3.7 3.7 0 0 1 0 6.9"/><path d="M18.5 15a6.5 6.5 0 0 1 4 6"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>`,
  award: `<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1 7 4.5-2.6 4.5 2.6-1-7"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  more: `<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.1"/>`,
  alert: `<path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.5M12 17v.1"/>`,
  gear: `<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2M12 19.5v2M4.3 4.3l1.4 1.4M18.3 18.3l1.4 1.4M2.5 12h2M19.5 12h2M4.3 19.7l1.4-1.4M18.3 5.7l1.4-1.4"/>`,
  send: `<path d="m21 3-7.2 18-3.6-7.2L3 10.2 21 3Z"/><path d="m10.2 13.8 4.3-4.3"/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`,
  external: `<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>`,
  quote: `<path d="M9 6H5.5A2.5 2.5 0 0 0 3 8.5V13h5V9H5.5"/><path d="M20 6h-3.5A2.5 2.5 0 0 0 14 8.5V13h5V9h-2.5"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  moon: `<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/>`,
  library: `<path d="M4 4h4v16H4zM10 4h4v16h-4zM17 4l3 16-4 .7L13 5z"/>`,
  refresh: `<path d="M20.5 11A8.5 8.5 0 0 0 6 5.6L3.5 8"/><path d="M3.5 3.5V8H8"/><path d="M3.5 13A8.5 8.5 0 0 0 18 18.4l2.5-2.4"/><path d="M20.5 20.5V16H16"/>`,
  headphones2: `<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="2"/><rect x="17" y="14" width="4" height="7" rx="2"/>`,
  feather: `<path d="M20.2 3.8c-2.4-2.4-6.3-1.9-9 .8L4 11.8V20h8.2l7.2-7.2c2.7-2.7 3.2-6.6.8-9Z"/><path d="M4 20 14 10M12 6.5h4M9 10.5h5"/>`,
  waves: `<path d="M3 8c2 0 2-1.5 4-1.5S9 8 11 8s2-1.5 4-1.5S17 8 19 8s2-1.5 2-1.5"/><path d="M3 13c2 0 2-1.5 4-1.5S9 13 11 13s2-1.5 4-1.5S17 13 19 13s2-1.5 2-1.5"/><path d="M3 18c2 0 2-1.5 4-1.5S9 18 11 18s2-1.5 4-1.5S17 18 19 18s2-1.5 2-1.5"/>`,
  image: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 18 5.5-5.5 3.5 3.5 3-3L20 18"/>`,
  cursor: `<path d="M4.5 3.8 19 11l-6.1 2.3L10 19.5 4.5 3.8Z"/>`,
  cornerDown: `<path d="M5 4v7a4 4 0 0 0 4 4h10"/><path d="m15 11 4 4-4 4"/>`,
  shield: `<path d="M12 2.7 4.5 5.8v5.4c0 4.6 3.2 8 7.5 9.9 4.3-1.9 7.5-5.3 7.5-9.9V5.8L12 2.7Z"/><path d="m8.6 11.6 2.3 2.3 4.5-4.6"/>`,
  dot: `<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>`
};

export function icon(name, size = 20, className = "") {
  const content = paths[name] || paths.dot;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

export function logoMark(size = 42, className = "", light = false) {
  const tile = light ? "#F8FAFC" : "currentColor";
  const mark = light ? "#24506D" : "#FFFFFF";
  return `<svg class="brand-mark ${className}" width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <rect width="36" height="36" rx="9" fill="${tile}"/>
    <path d="M18.2 9.5v17M13.3 14.4l4.9-4.9M13.8 26.5h8.8" stroke="${mark}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function botanical(size = 160, className = "") {
  return `<svg class="botanical ${className}" width="${size}" height="${size}" viewBox="0 0 160 160" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">
    <path d="M26 140C47 100 61 67 72 23" stroke-linecap="round"/>
    <path d="M65 38c-12-4-18-12-19-24 12 2 20 9 23 21" />
    <path d="M59 58C45 54 36 45 34 31c14 2 23 11 27 24" />
    <path d="M51 81C36 77 26 67 24 51c15 3 25 13 30 27" />
    <path d="M78 32c1-13 8-22 20-25-2 13-9 22-21 27" />
    <path d="M73 57c5-14 14-21 28-21-5 14-15 22-29 23" />
    <path d="M66 82c8-13 19-18 32-15-8 13-19 19-33 17" />
    <path d="M58 108c11-11 23-14 35-8-11 11-23 14-36 9" />
    <path d="M47 132c-12 0-21-5-27-16 12-2 22 3 29 13" />
    <path d="M66 120c-3 13-11 21-24 25 1-13 10-23 23-27" />
  </svg>`;
}
