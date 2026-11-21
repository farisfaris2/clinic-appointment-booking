/* =====================================================================
   endpoints.js — one function per backend route.
   Pages import these instead of writing URLs themselves, so if a route
   changes on the backend there is only one line to update here.

   Routes come from:
   - Elister's auth API   (server/routes/auth.js, documented in API.md)
   - Faris's clinic API   (server/routes/clinic.js)
   ===================================================================== */
import { request } from './client';

/* ---------- Authentication (Elister) ---------- */
export const authApi = {
  /** Returns { user } if the cookie is valid, otherwise throws 401. */
  me: () => request('/api/auth/me'),

  /** body: { email, password } → { message, user } and sets the cookie. */
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  /** body: { full_name, email, password } → { message, user }. Always creates a patient. */
  register: (fullName, email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { full_name: fullName, email, password },
    }),

  /** Clears the cookie. */
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

/* ---------- Doctors & specialties (Faris) — public, no login needed ---------- */
export const doctorsApi = {
  /** → [{ id, user_id, name, email, specialty_id, specialty, bio, room }] */
  list: () => request('/api/doctors'),
};

export const specialtiesApi = {
  /** → [{ id, name }] */
  list: () => request('/api/specialties'),
};

/* ---------- Time slots (Faris) ---------- */
export const slotsApi = {
  /**
   * → [{ id, doctor_id, doctor_name, start_at, end_at, available }]
   * `available` is 1 when nobody has an active booking on the slot.
   * Pass a doctor profile id to get only that doctor's slots.
   */
  list: (doctorId) => request(doctorId ? `/api/slots?doctor_id=${doctorId}` : '/api/slots'),

  /** Doctor only. Times must be UTC ISO strings: "2026-11-27T09:00:00.000Z". */
  create: ({ doctorId, startAt, endAt }) =>
    request('/api/slots', {
      method: 'POST',
      body: { doctor_id: doctorId, start_at: startAt, end_at: endAt },
    }),

  /** Doctor only. Cannot edit a slot that is already booked. */
  update: (slotId, { startAt, endAt }) =>
    request(`/api/slots/${slotId}`, {
      method: 'PUT',
      body: { start_at: startAt, end_at: endAt },
    }),

  /** Doctor only. Server refuses if the slot was ever booked (keeps history). */
  remove: (slotId) => request(`/api/slots/${slotId}`, { method: 'DELETE' }),
};

/* ---------- Appointments (Faris) ---------- */
export const appointmentsApi = {
  /**
   * The server filters by role: a patient gets their own visits,
   * a doctor gets the visits booked on their slots.
   * → [{ id, slot_id, patient_id, patient_name, status, notes, created_at,
   *      cancelled_at, doctor_id, start_at, end_at, doctor_name }]
   * status is "booked" | "done" | "cancelled".
   */
  list: () => request('/api/appointments'),

  /** Patient only. Fails with 409 if someone else booked the slot first. */
  book: (slotId, notes = '') =>
    request('/api/appointments', { method: 'POST', body: { slot_id: slotId, notes } }),

  /** Patient only. Move a visit to another slot (both must be 24h+ away). */
  reschedule: (appointmentId, slotId, notes = '') =>
    request(`/api/appointments/${appointmentId}`, {
      method: 'PUT',
      body: { slot_id: slotId, notes },
    }),

  /**
   * Soft-cancels (status → "cancelled"). Patients: own visits, 24h+ ahead.
   * Doctors: own visits — needs Faris to allow the doctor role on this route.
   */
  cancel: (appointmentId) => request(`/api/appointments/${appointmentId}`, { method: 'DELETE' }),

  /** Doctor only. status → "done". */
  markDone: (appointmentId) =>
    request(`/api/appointments/${appointmentId}/done`, { method: 'PATCH' }),
};
