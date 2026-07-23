// ==========================================================================
// Icon Library
// Raw SVG markup (stroke-based, currentColor) shared between the stepper
// badges and step content, so every icon stays visually consistent.
// ==========================================================================

const strokeIcon = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICONS = {
  mail: strokeIcon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>'),
  qr: strokeIcon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M21 14v7h-7"/><path d="M17.5 17.5h.01"/>'),
  calendar: strokeIcon(
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>'
  ),
  cart: strokeIcon(
    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'
  ),
  user: strokeIcon(
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>'
  ),
  globe: strokeIcon(
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>'
  ),
  chat: strokeIcon(
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>'
  ),
  image: strokeIcon(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'
  ),
  lightbulb: strokeIcon(
    '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.5.4.8 1.1.8 1.8v.5h6.4v-.5c0-.7.3-1.3.8-1.8A7 7 0 0 0 12 2Z"/>'
  ),
  smartphone: strokeIcon(
    '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>'
  ),
  alignLeft: strokeIcon('<path d="M21 6H3"/><path d="M15 12H3"/><path d="M17 18H3"/>'),
  alignRight: strokeIcon('<path d="M21 6H3"/><path d="M21 12H9"/><path d="M21 18H7"/>'),
  clock: strokeIcon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  bag: strokeIcon(
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'
  ),
  link: strokeIcon(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
  ),
  partyPopper: strokeIcon(
    '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-1.24-.62a2.9 2.9 0 0 0-3.51.75c-.55.65-1.5.75-2.16.22L14 13"/><path d="m11 8-.62-1.24a2.9 2.9 0 0 0-3.51-.75c-.65.55-1.5.75-2.16.22L4 6"/>'
  ),
  creditCard: strokeIcon(
    '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>'
  ),
  building: strokeIcon(
    '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>'
  ),
  pin: strokeIcon(
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  ),
  storefront: strokeIcon(
    '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M10 21v-4h4v4"/>'
  ),
  mic: strokeIcon(
    '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v4"/><path d="M9 22h6"/>'
  ),
  phone: strokeIcon(
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>'
  ),
  palette: strokeIcon(
    '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 1 0 0 20c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a4 4 0 0 0 4-4c0-6-4.5-11-8-11Z"/>'
  ),
  rocket: strokeIcon(
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'
  ),
  check: strokeIcon('<path d="M20 6 9 17l-5-5"/>'),
  sparkle: strokeIcon(
    '<path d="M12 2 13.8 9 21 12l-7.2 3L12 22l-1.8-7L3 12l7.2-3Z"/>'
  ),
  shield: strokeIcon(
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'
  ),
  chevronDown: strokeIcon('<path d="m6 9 6 6 6-6"/>'),
  chevronLeft: strokeIcon('<path d="m15 18-6-6 6-6"/>'),
  arrowRight: strokeIcon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  // Close (x) for removable rows; plus for "add another" affordances
  close: strokeIcon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  plus: strokeIcon('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  // Spinner arc, rotated via CSS (.is-verifying) for a loading state
  spinner: strokeIcon('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
  // Book/knowledge-base mark for the Knowledge Base wizard node
  book: strokeIcon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  // Pencil for "enter manually" affordances
  pencil: strokeIcon('<path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>'),
};
