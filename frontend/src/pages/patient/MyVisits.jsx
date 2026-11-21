/* =====================================================================
   My Visits  (Figma: "My Visits - Patient", both states)
   GET /api/appointments returns only THIS patient's visits (server-side).

   Click a row to select it, then:
   - Reschedule → pick another free time  (PUT /api/appointments/:id)
   - Cancel Appointment → confirm          (DELETE /api/appointments/:id)
   Both are allowed only 24h+ before the visit. The button is disabled
   here for clarity, and the server enforces the same rule.
   ===================================================================== */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, doctorsApi, slotsApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import { usePagination } from '../../hooks/usePagination';
import { FilterMenu, SelectField, SortToggle } from '../../components/ui/Toolbar';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableState } from '../../components/ui/PageState';
import {
  CANCELLATION_WINDOW_HOURS,
  doctorLocation,
  doctorTitle,
  indexById,
  visitTypeLabel,
} from '../../utils/format';
import { formatDate, formatDateKey, formatTime, hoursUntil, isoToDateKey } from '../../utils/datetime';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'booked', label: 'Upcoming' },
  { value: 'done', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All visits' },
];

/** True if the visit is booked and far enough away to change. */
const canChange = (visit) =>
  visit?.status === 'booked' && hoursUntil(visit.start_at) >= CANCELLATION_WINDOW_HOURS;

export default function MyVisits() {
  const visits = useApiData(appointmentsApi.list);
  const doctors = useApiData(doctorsApi.list); // for specialty + clinic columns

  const [status, setStatus] = useState('booked');
  const [specialtyId, setSpecialtyId] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [dialog, setDialog] = useState(null); // null | 'cancel' | 'reschedule'

  const doctorsById = useMemo(() => indexById(doctors.data ?? []), [doctors.data]);

  const specialtyOptions = useMemo(() => {
    const unique = new Map((doctors.data ?? []).map((d) => [String(d.specialty_id), d.specialty]));
    return [...unique].map(([value, label]) => ({ value, label }));
  }, [doctors.data]);

  const filtered = useMemo(
    () =>
      (visits.data ?? [])
        .filter((v) => status === 'all' || v.status === status)
        .filter((v) => !specialtyId || String(doctorsById[v.doctor_id]?.specialty_id) === specialtyId)
        .sort((a, b) => (newestFirst ? -1 : 1) * a.start_at.localeCompare(b.start_at)),
    [visits.data, status, specialtyId, newestFirst, doctorsById],
  );

  const { pageItems, page, totalPages, setPage } = usePagination(filtered, PAGE_SIZE);

  const selected = filtered.find((v) => v.id === selectedId) ?? null;
  const tooLate = selected?.status === 'booked' && !canChange(selected);

  const heading =
    status === 'booked'
      ? `${filtered.length} ${filtered.length === 1 ? 'Visit' : 'Visits'} Booked`
      : `${filtered.length} ${filtered.length === 1 ? 'Visit' : 'Visits'}`;

  // After a successful change: close the dialog, clear selection, refresh.
  function handleChanged() {
    setDialog(null);
    setSelectedId(null);
    visits.reload();
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__group">
          <FilterMenu activeCount={(status !== 'booked' ? 1 : 0) + (specialtyId ? 1 : 0)}>
            <SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
              options={STATUS_OPTIONS} />
            <SelectField label="Specialty" value={specialtyId} onChange={(v) => { setSpecialtyId(v); setPage(1); }}
              placeholder="All specialties" options={specialtyOptions} />
          </FilterMenu>
          <SortToggle label={newestFirst ? 'Date Descending' : 'Date Ascending'}
            onToggle={() => setNewestFirst((value) => !value)} />
        </div>
      </div>

      <h1 className="page-title page-header">{heading}</h1>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Visit Type</th>
              <th>Date/Time</th>
              <th>Doctor/Specialist</th>
              <th>Clinic</th>
            </tr>
          </thead>
          <tbody>
            {visits.loading && !visits.data ? (
              <TableState colSpan={4} status="loading" />
            ) : visits.error ? (
              <TableState colSpan={4} status="error" message={visits.error.message} onRetry={visits.reload} />
            ) : filtered.length === 0 ? (
              <TableState colSpan={4} status="empty" title="No visits here">
                <Link to="/patient/book" className="link">Book a visit</Link>
              </TableState>
            ) : (
              pageItems.map((visit) => {
                const doctor = doctorsById[visit.doctor_id];
                const isSelected = visit.id === selectedId;
                return (
                  <tr
                    key={visit.id}
                    className={`table__row--selectable ${isSelected ? 'table__row--selected' : ''}`}
                    onClick={() => setSelectedId(isSelected ? null : visit.id)}
                    // Keyboard users can Tab to a row and press Enter/Space.
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(isSelected ? null : visit.id);
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <td>
                      {visitTypeLabel(visit)}
                      {visit.status !== 'booked' && (
                        <span className="table__sub"><StatusBadge status={visit.status} /></span>
                      )}
                    </td>
                    <td>
                      {formatDate(visit.start_at)}
                      <br />
                      <span className="time-pill">{formatTime(visit.start_at)}</span>
                    </td>
                    <td>
                      {doctorTitle(visit.doctor_name)}
                      <span className="table__sub">{doctor?.specialty}</span>
                    </td>
                    <td>{doctorLocation(doctor)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="actions-row">
        {tooLate && (
          <p className="form-message form-message--error" role="alert">
            Visits can only be changed or cancelled at least {CANCELLATION_WINDOW_HOURS} hours in advance.
          </p>
        )}
        <button type="button" className="btn btn--secondary" disabled={!canChange(selected)}
          onClick={() => setDialog('reschedule')}>
          Reschedule
        </button>
        <button type="button" className="btn btn--danger-soft" disabled={!canChange(selected)}
          onClick={() => setDialog('cancel')}>
          Cancel Appointment
        </button>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {dialog === 'cancel' && selected && (
        <CancelDialog visit={selected} onClose={() => setDialog(null)} onDone={handleChanged} />
      )}
      {dialog === 'reschedule' && selected && (
        <RescheduleDialog visit={selected} onClose={() => setDialog(null)} onDone={handleChanged} />
      )}
    </>
  );
}

/* ---------------------------------------------------------------------
   "Cancel Appointment?" confirmation
   --------------------------------------------------------------------- */
function CancelDialog({ visit, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await appointmentsApi.cancel(visit.id);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Cancel Appointment?"
      onClose={onClose}
      busy={busy}
      actions={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>Keep Visit</button>
          <button type="button" className="btn btn--danger" onClick={confirm} disabled={busy}>
            {busy ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </>
      }
    >
      <p>
        Your visit with <strong>{doctorTitle(visit.doctor_name)}</strong> on{' '}
        <strong>{formatDate(visit.start_at)}</strong> at <strong>{formatTime(visit.start_at)}</strong> will be cancelled.
      </p>
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   Reschedule: choose another free time with the same doctor.
   Only times 24h+ away are offered (server rule for the new slot).
   --------------------------------------------------------------------- */
function RescheduleDialog({ visit, onClose, onDone }) {
  const loadSlots = useCallback(() => slotsApi.list(visit.doctor_id), [visit.doctor_id]);
  const slots = useApiData(loadSlots);
  const [slotId, setSlotId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Group eligible slots by day: { "2026-12-01": [slot, slot] }
  const byDay = useMemo(() => {
    const groups = {};
    (slots.data ?? [])
      .filter((s) => s.available && s.id !== visit.slot_id && hoursUntil(s.start_at) >= CANCELLATION_WINDOW_HOURS)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .forEach((s) => {
        (groups[isoToDateKey(s.start_at)] ??= []).push(s);
      });
    return groups;
  }, [slots.data, visit.slot_id]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await appointmentsApi.reschedule(visit.id, slotId, visit.notes);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      slots.reload();
    }
  }

  const days = Object.keys(byDay);

  return (
    <Modal
      title="Reschedule Visit"
      onClose={onClose}
      busy={busy}
      actions={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>Back</button>
          <button type="button" className="btn btn--primary" onClick={confirm} disabled={!slotId || busy}>
            {busy ? 'Saving…' : 'Confirm New Time'}
          </button>
        </>
      }
    >
      <p>
        Currently <strong>{formatDate(visit.start_at)}</strong> at <strong>{formatTime(visit.start_at)}</strong> with{' '}
        <strong>{doctorTitle(visit.doctor_name)}</strong>. Choose a new time:
      </p>

      <div className="modal__form">
        {slots.loading && !slots.data && <p>Loading times…</p>}
        {slots.error && <p className="form-message form-message--error">{slots.error.message}</p>}
        {slots.data && days.length === 0 && <p>This doctor has no other free times right now.</p>}
        {days.map((day) => (
          <div key={day}>
            <span className="slot-group__date">{formatDateKey(day)}</span>
            <div className="slot-list">
              {byDay[day].map((s) => (
                <button key={s.id} type="button" className="slot-pill" aria-pressed={slotId === s.id}
                  onClick={() => setSlotId(s.id)}>
                  {formatTime(s.start_at)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    </Modal>
  );
}
