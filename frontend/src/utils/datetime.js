/* =====================================================================
   datetime.js — every date/time conversion in one place.

   The backend stores times in UTC ("2026-12-01T05:00:00.000Z").
   We always SHOW them in the user's local time (Tbilisi, UTC+4) and
   convert local times back to UTC when sending them.

   "Date key" below means a local calendar day as text: "2026-12-01".
   It's handy for grouping slots by day and for <input type="date">.
   ===================================================================== */

const HOUR = 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');

/** Date → "2026-12-01" in local time. */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** UTC ISO string from the API → local "2026-12-01". */
export function isoToDateKey(iso) {
  return toDateKey(new Date(iso));
}

/** Today's date key. */
export function todayKey() {
  return toDateKey(new Date());
}

/** "2026-12-01" + 3 → "2026-12-04" (handles month ends). */
export function addDays(dateKey, days) {
  const date = dateKeyToDate(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** "2026-12-01" → Date at local midnight. */
export function dateKeyToDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Local day + "09:30" → UTC ISO string the backend expects. */
export function localToIso(dateKey, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = dateKeyToDate(dateKey);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** "2026-12-01T05:00:00.000Z" → "01-12-2026" (format used in Figma tables). */
export function formatDate(iso) {
  const [y, m, d] = isoToDateKey(iso).split('-');
  return `${d}-${m}-${y}`;
}

/** "2026-12-01" → "01-12-2026". */
export function formatDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-');
  return `${d}-${m}-${y}`;
}

/** ISO → "09:00 AM". */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** ISO → "09:00" (24h, for <input type="time">). */
export function toTimeInputValue(iso) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "2026-12-01" → { weekday: "Tue", day: "1", month: "Dec" } for the day strip. */
export function dayParts(dateKey) {
  const date = dateKeyToDate(dateKey);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

/** "2026-12-01" → "Tuesday, 1 December". */
export function formatLongDay(dateKey) {
  return dateKeyToDate(dateKey).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Weekday name for an ISO time, e.g. "Monday". */
export function weekdayName(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

/** Minutes between two ISO strings. */
export function minutesBetween(startIso, endIso) {
  return Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000);
}

/** 30 → "30 minutes", 60 → "1 hour", 90 → "1 h 30 min". */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h} h ${m} min`;
}

/** How many hours until an ISO time (negative if it's in the past). */
export function hoursUntil(iso) {
  return (Date.parse(iso) - Date.now()) / HOUR;
}

/** True if the ISO time is later than now. */
export function isFuture(iso) {
  return Date.parse(iso) > Date.now();
}

/** "2026-11-20 10:15:00" (SQLite) or ISO → "20 Nov 2026". */
export function formatJoinDate(value) {
  if (!value) return null;
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
