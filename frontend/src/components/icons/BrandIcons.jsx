// Shared props for every outline icon below.
const outline = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/** Calendar with a plus — the CareBook logo mark (header & footer). */
export function CareBookLogo({ size = 63 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" {...outline} strokeWidth="3.5">
      <rect x="8" y="13" width="48" height="43" rx="6" />
      <path d="M8 24H56" />
      <path d="M21 8V17M43 8V17" />
      <path d="M32 32V46M25 39H39" />
    </svg>
  );
}

/** Phone with a plus — next to the footer contact details (79×79). */
export function PhonePlusIcon({ size = 79 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...outline} strokeWidth="1.1">
      {/* handset (same shape as lucide's "phone" icon) */}
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      {/* plus in the top-right corner */}
      <path d="M17.5 2.5v7M14 6h7" />
    </svg>
  );
}
/** Stethoscope — doctor cards and "See the list of healthcare providers". */
export function StethoscopeIcon({ size = 65 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" {...outline} strokeWidth="2">
      <path d="M18 14v12a10 10 0 0 0 20 0V14" />
      <path d="M15 14h6M35 14h6" />
      <path d="M28 36v8a9 9 0 0 0 18 0v-7" />
      <circle cx="46" cy="34" r="3.5" />
    </svg>
  );
}

/** Map pin with a cross — "See your upcoming visits" / "See when you're booked". */
export function ClinicPinIcon({ size = 65 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" {...outline} strokeWidth="2">
      <path d="M32.5 54S16 39.5 16 26.5a16.5 16.5 0 1 1 33 0C49 39.5 32.5 54 32.5 54z" />
      <path d="M32.5 20v13M26 26.5h13" />
    </svg>
  );
}

/** Document with a plus — "Book a new visit today". */
export function DocumentPlusIcon({ size = 65 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" {...outline} strokeWidth="2">
      <path d="M38 14H20a4 4 0 0 0-4 4v29a4 4 0 0 0 4 4h14" />
      <path d="M38 14l10 10v10" />
      <path d="M23 27h16M23 34h12M23 41h8" />
      <path d="M46 40v12M40 46h12" />
    </svg>
  );
}

/** Calendar page — doctor "Check the calendar" card (Figma: calendar_month). */
export function CalendarMonthIcon({ size = 65 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" {...outline} strokeWidth="2">
      <rect x="12" y="15" width="41" height="38" rx="4" />
      <path d="M12 25h41M23 10v9M42 10v9" />
      <path d="M20 33h4M30.5 33h4M41 33h4M20 42h4M30.5 42h4" />
    </svg>
  );
}

/** Calendar with a tick — doctor "Manage your availability" card (Figma: event_available). */
export function EventAvailableIcon({ size = 65 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 65 65" {...outline} strokeWidth="2">
      <rect x="12" y="15" width="41" height="38" rx="4" />
      <path d="M12 25h41M23 10v9M42 10v9" />
      <path d="M25 39l5 5 10-10" />
    </svg>
  );
}

/** Small calendar used inside the round "Book Now" button. */
export function BookCalendarIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...outline} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="15" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
