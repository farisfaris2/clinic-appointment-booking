/* =====================================================================
   format.js — small helpers for turning API records into display text,
   plus app-wide constants. Keeping them here means every page shows
   doctors, rooms and statuses the same way.
   ===================================================================== */

/** Visit lengths (minutes) a doctor can choose for their time slots. */
export const DURATION_OPTIONS = [15, 20, 30, 45, 60];

/** Patients can't cancel or reschedule within this many hours of a visit. */
export const CANCELLATION_WINDOW_HOURS = 24;

/**
 * The backend has no "visit type" yet, so every appointment is a
 * consultation. When a visit_type column is added, the helper below
 * will start showing the real value automatically.
 */
export const DEFAULT_VISIT_TYPE = 'Consultation in the clinic';

export function visitTypeLabel(appointment) {
  return appointment.visit_type || DEFAULT_VISIT_TYPE;
}

/** "Maya Beridze" → "Dr. Maya Beridze" (doesn't double up an existing "Dr"). */
export function doctorTitle(name) {
  if (!name) return 'Doctor';
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

/**
 * Where the visit happens. The backend currently stores only a room
 * number; if a `clinic` field is added later it will be shown instead.
 */
export function doctorLocation(doctor) {
  if (!doctor) return '—';
  if (doctor.clinic) return doctor.clinic;
  if (doctor.room) return `Room ${doctor.room}`;
  return '—';
}

/** First letter of the user's name for the avatar circle. */
export function initialOf(name) {
  return (name?.trim()?.[0] || '?').toUpperCase();
}

/** Human labels + CSS badge modifier for appointment statuses. */
export const STATUS_LABELS = {
  booked: 'Booked',
  done: 'Completed',
  cancelled: 'Cancelled',
};

/** Build a lookup object { id: record } from an array. */
export function indexById(list = []) {
  return Object.fromEntries(list.map((item) => [item.id, item]));
}
