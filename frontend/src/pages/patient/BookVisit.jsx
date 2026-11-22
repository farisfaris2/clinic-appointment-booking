/* =====================================================================
   Book Now  (Figma: "Book Now - Patient", both states)
   1. "Find the doctor for you" card: choose specialist / date / doctor.
   2. Find → table of matching doctors with their free time pills.
   3. Pick a time → Book → "Confirm Booking" → "Booked successfully!"

   Data: GET /api/doctors, /api/specialties, /api/slots
   Booking: POST /api/appointments { slot_id }
   The server refuses a slot that is already taken (409), so two patients
   can never book the same time — we show that message if it happens.

   Figma also has a "Language for visit" dropdown. The backend has no
   language data yet, so that filter is left out for now.
   ===================================================================== */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appointmentsApi, doctorsApi, slotsApi, specialtiesApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import Modal from '../../components/ui/Modal';
import PageState, { TableState } from '../../components/ui/PageState';
import { SelectField } from '../../components/ui/Toolbar';
import { doctorLocation, doctorTitle, indexById } from '../../utils/format';
import {
  formatDate,
  formatDateKey,
  formatDuration,
  formatTime,
  isFuture,
  isoToDateKey,
  minutesBetween,
} from '../../utils/datetime';

const EMPTY_FILTERS = { specialtyId: '', date: '', doctorId: '' };

/** Does a slot match the chosen filters? (empty filter = match all) */
function matches(slot, doctor, filters) {
  if (filters.specialtyId && String(doctor?.specialty_id) !== filters.specialtyId) return false;
  if (filters.doctorId && String(slot.doctor_id) !== filters.doctorId) return false;
  if (filters.date && isoToDateKey(slot.start_at) !== filters.date) return false;
  return true;
}

export default function BookVisit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorFromUrl = searchParams.get('doctorId') ?? '';

  const doctors = useApiData(doctorsApi.list);
  const specialties = useApiData(specialtiesApi.list);
  const slots = useApiData(slotsApi.list);

  // `draft` = what's selected in the dropdowns; `applied` = last "Find".
  // Coming from a doctor's page (?doctorId=3) searches straight away.
  const initial = { ...EMPTY_FILTERS, doctorId: doctorFromUrl };
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(doctorFromUrl ? initial : null);

  const [selected, setSelected] = useState(null); // { slot, doctor }
  const [step, setStep] = useState(null); // null | 'confirm' | 'success'
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const doctorsById = useMemo(() => indexById(doctors.data ?? []), [doctors.data]);

  // Only slots that are free and still in the future can be booked.
  const freeSlots = useMemo(
    () => (slots.data ?? []).filter((slot) => slot.available && isFuture(slot.start_at)),
    [slots.data],
  );

  /* ---------- Dropdown options (they narrow each other down) ---------- */
  const specialtyOptions = (specialties.data ?? []).map((s) => ({ value: String(s.id), label: s.name }));

  const doctorOptions = (doctors.data ?? [])
    .filter((d) => !draft.specialtyId || String(d.specialty_id) === draft.specialtyId)
    .map((d) => ({ value: String(d.id), label: doctorTitle(d.name) }));

  const dateOptions = [
    ...new Set(
      freeSlots
        .filter((slot) => matches(slot, doctorsById[slot.doctor_id], { ...draft, date: '' }))
        .map((slot) => isoToDateKey(slot.start_at)),
    ),
  ]
    .sort()
    .map((key) => ({ value: key, label: formatDateKey(key) }));

  /* ---------- Results: one row per doctor per day ---------- */
  const resultRows = useMemo(() => {
    if (!applied) return [];
    const groups = {};
    freeSlots
      .filter((slot) => matches(slot, doctorsById[slot.doctor_id], applied))
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .forEach((slot) => {
        const dateKey = isoToDateKey(slot.start_at);
        const key = `${slot.doctor_id}-${dateKey}`;
        groups[key] ??= { key, dateKey, doctor: doctorsById[slot.doctor_id], slots: [] };
        groups[key].slots.push(slot);
      });
    return Object.values(groups);
  }, [applied, freeSlots, doctorsById]);

  /* ---------- Handlers ---------- */
  const changeDraft = (field) => (value) => {
    const next = { ...draft, [field]: value };
    if (field === 'specialtyId') next.doctorId = ''; // doctor list changed
    setDraft(next);
  };

  function handleFind(event) {
    event.preventDefault();
    setApplied(draft);
    setSelected(null);
  }

  function handleClear() {
    setDraft(EMPTY_FILTERS);
    setApplied(null);
    setSelected(null);
    setSearchParams({}); // drop ?doctorId from the URL
  }

  async function handleConfirm() {
    setSubmitting(true);
    setBookingError('');
    try {
      await appointmentsApi.book(selected.slot.id);
      setStep('success');
      slots.reload(); // the booked time disappears from the list
    } catch (err) {
      setBookingError(err.message);
      if (err.status === 409) slots.reload(); // someone else took it — refresh
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (step === 'success') setSelected(null);
    setStep(null);
    setBookingError('');
  }

  const loadError = doctors.error || slots.error || specialties.error;
  const isLoading = !doctors.data || !slots.data;

  return (
    <>
      {/* ---------- Search card ---------- */}
      <form className="find-card" onSubmit={handleFind}>
        <h1 className="find-card__title">Find the doctor for you</h1>
        <div className="find-card__body">
          <div className="find-card__grid">
            <SelectField label="Specialist" value={draft.specialtyId} onChange={changeDraft('specialtyId')}
              placeholder="Any specialist" options={specialtyOptions} />
            <SelectField label="Date for visit" value={draft.date} onChange={changeDraft('date')}
              placeholder="Any date" options={dateOptions} />
            <SelectField label="Doctor" value={draft.doctorId} onChange={changeDraft('doctorId')}
              placeholder="Any doctor" options={doctorOptions} />
          </div>
          <div className="find-card__actions">
            <button type="submit" className="btn btn--primary" disabled={isLoading}>Find</button>
            <button type="button" className="btn btn--ghost" onClick={handleClear}>Clear</button>
          </div>
        </div>
      </form>

      {loadError && <PageState status="error" message={loadError.message} onRetry={slots.reload} />}

      {/* ---------- Results ---------- */}
      {applied && !loadError && (
        <section aria-label="Available times">
          <p className="page-hint">Select the time, then book</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Available time</th>
                  <th>Visit duration</th>
                  <th>Doctor/Specialist</th>
                  <th>Clinic</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableState colSpan={4} status="loading" />
                ) : resultRows.length === 0 ? (
                  <TableState colSpan={4} status="empty" title="No free times match your search"
                    message="Try another date, doctor or specialist." />
                ) : (
                  resultRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        {/* Show the day when the user didn't pick one. */}
                        {!applied.date && <span className="slot-group__date">{formatDateKey(row.dateKey)}</span>}
                        <div className="slot-list">
                          {row.slots.map((slot) => {
                            const isSelected = selected?.slot.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                className="slot-pill"
                                aria-pressed={isSelected}
                                onClick={() => setSelected(isSelected ? null : { slot, doctor: row.doctor })}
                              >
                                {formatTime(slot.start_at)}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td>{formatDuration(minutesBetween(row.slots[0].start_at, row.slots[0].end_at))}</td>
                      <td>
                        {doctorTitle(row.doctor?.name ?? row.slots[0].doctor_name)}
                        <span className="table__sub">{row.doctor?.specialty}</span>
                      </td>
                      <td>{doctorLocation(row.doctor)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="actions-row">
            <button type="button" className="btn btn--primary" disabled={!selected}
              onClick={() => setStep('confirm')}>
              Book
            </button>
          </div>
        </section>
      )}

      {/* ---------- Step 1: confirm ---------- */}
      {step === 'confirm' && selected && (
        <Modal
          title="Confirm Booking"
          onClose={closeModal}
          busy={submitting}
          actions={
            <>
              <button type="button" className="btn btn--secondary" onClick={closeModal} disabled={submitting}>
                Back
              </button>
              <button type="button" className="btn btn--primary" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Booking…' : 'Confirm'}
              </button>
            </>
          }
        >
          <p>
            Book a visit with <strong>{doctorTitle(selected.doctor?.name)}</strong> on{' '}
            <strong>{formatDate(selected.slot.start_at)}</strong> at{' '}
            <strong>{formatTime(selected.slot.start_at)}</strong>?
          </p>
          {bookingError && <p className="form-message form-message--error" role="alert">{bookingError}</p>}
        </Modal>
      )}

      {/* ---------- Step 2: success ---------- */}
      {step === 'success' && (
        <Modal
          title="Booked successfully!"
          tone="success"
          onClose={closeModal}
          actions={
            <>
              <button type="button" className="btn btn--secondary" onClick={closeModal}>Close</button>
              <Link to="/patient/visits" className="btn btn--primary">View My Visits</Link>
            </>
          }
        >
          <p>Your appointment has been added to your visits.</p>
        </Modal>
      )}
    </>
  );
}
