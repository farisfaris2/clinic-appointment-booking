/* =====================================================================
   My Appointments  (Figma: "My Appointments - Doctor")
   GET /api/appointments → only visits booked on THIS doctor's slots.

   - "Mark Complete" checkbox → PATCH  /api/appointments/:id/done
   - Select a row → "Cancel Appointment" → confirm → DELETE /api/appointments/:id
     (same pattern as the patient's My Visits page)

   NOTE: cancelling as a doctor needs a small backend change (Faris):
   the cancel route currently allows only patients and admins. Until
   then, the server answers 403 and the message is shown in the dialog.
   ===================================================================== */
import { useMemo, useState } from 'react';
import { appointmentsApi, doctorsApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import { usePagination } from '../../hooks/usePagination';
import { FilterMenu, SelectField, SortToggle } from '../../components/ui/Toolbar';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableState } from '../../components/ui/PageState';
import { doctorLocation, indexById, visitTypeLabel } from '../../utils/format';
import { formatDate, formatTime, isFuture } from '../../utils/datetime';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Booked & completed' },
  { value: 'booked', label: 'Booked' },
  { value: 'done', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

function matchesStatus(appointment, filter) {
  if (filter === 'all') return true;
  if (filter === 'active') return appointment.status !== 'cancelled';
  return appointment.status === filter;
}

/** A doctor can cancel a visit that is still booked and hasn't started. */
const canCancel = (appt) => appt?.status === 'booked' && isFuture(appt.start_at);

export default function DoctorAppointments() {
  const appointments = useApiData(appointmentsApi.list);
  const doctors = useApiData(doctorsApi.list); // for the room/clinic column

  const [status, setStatus] = useState('active');
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  // dialog: null | { type: 'complete' | 'cancel', appt }
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doctorsById = useMemo(() => indexById(doctors.data ?? []), [doctors.data]);

  const filtered = useMemo(
    () =>
      (appointments.data ?? [])
        .filter((a) => matchesStatus(a, status))
        .sort((a, b) => (newestFirst ? -1 : 1) * a.start_at.localeCompare(b.start_at)),
    [appointments.data, status, newestFirst],
  );

  const { pageItems, page, totalPages, setPage } = usePagination(filtered, PAGE_SIZE);
  const selected = filtered.find((a) => a.id === selectedId) ?? null;

  const toggleRow = (id) => setSelectedId((current) => (current === id ? null : id));

  /** Runs the request for the open dialog, then refreshes the list. */
  async function confirmDialog() {
    setBusy(true);
    setError('');
    try {
      if (dialog.type === 'complete') await appointmentsApi.markDone(dialog.appt.id);
      else await appointmentsApi.cancel(dialog.appt.id);
      setDialog(null);
      setSelectedId(null);
      appointments.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function closeDialog() {
    setDialog(null);
    setError('');
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__group">
          <FilterMenu activeCount={status !== 'active' ? 1 : 0}>
            <SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
              options={STATUS_OPTIONS} />
          </FilterMenu>
          <SortToggle label={newestFirst ? 'Date Descending' : 'Date Ascending'}
            onToggle={() => setNewestFirst((value) => !value)} />
        </div>
      </div>

      <h1 className="page-title page-header">My Appointments</h1>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Visit Type</th>
              <th>Date/Time</th>
              <th>Patient’s Name</th>
              <th>Clinic</th>
              <th>Mark Complete</th>
            </tr>
          </thead>
          <tbody>
            {appointments.loading && !appointments.data ? (
              <TableState colSpan={5} status="loading" />
            ) : appointments.error ? (
              <TableState colSpan={5} status="error" message={appointments.error.message}
                onRetry={appointments.reload} />
            ) : filtered.length === 0 ? (
              <TableState colSpan={5} status="empty" title="No appointments here"
                message="When patients book your free slots, they’ll appear in this list." />
            ) : (
              pageItems.map((appt) => {
                const isSelected = appt.id === selectedId;
                return (
                  <tr
                    key={appt.id}
                    className={`table__row--selectable ${isSelected ? 'table__row--selected' : ''}`}
                    onClick={() => toggleRow(appt.id)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleRow(appt.id);
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <td>{visitTypeLabel(appt)}</td>
                    <td>
                      {formatDate(appt.start_at)}
                      <br />
                      <span className="time-pill">{formatTime(appt.start_at)}</span>
                    </td>
                    <td>{appt.patient_name}</td>
                    <td>{doctorLocation(doctorsById[appt.doctor_id])}</td>
                    {/* Clicks on the checkbox must not also select the row. */}
                    <td onClick={(event) => event.stopPropagation()}>
                      {appt.status === 'cancelled' ? (
                        <StatusBadge status="cancelled" />
                      ) : (
                        // Checked (green) = completed. Completing can't be
                        // undone, so clicking a done visit does nothing.
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={appt.status === 'done'}
                          aria-readonly={appt.status === 'done'}
                          onChange={() => appt.status === 'booked' && setDialog({ type: 'complete', appt })}
                          aria-label={`Mark visit with ${appt.patient_name} on ${formatDate(appt.start_at)} as complete`}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="actions-row">
        <button type="button" className="btn btn--danger-soft" disabled={!canCancel(selected)}
          onClick={() => setDialog({ type: 'cancel', appt: selected })}>
          Cancel Appointment
        </button>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {dialog && (
        <Modal
          title={dialog.type === 'complete' ? 'Mark visit as complete?' : 'Cancel Appointment?'}
          onClose={closeDialog}
          busy={busy}
          actions={
            <>
              <button type="button" className="btn btn--secondary" onClick={closeDialog} disabled={busy}>
                {dialog.type === 'complete' ? 'Back' : 'Keep Visit'}
              </button>
              {dialog.type === 'complete' ? (
                <button type="button" className="btn btn--primary" onClick={confirmDialog} disabled={busy}>
                  {busy ? 'Saving…' : 'Mark Complete'}
                </button>
              ) : (
                <button type="button" className="btn btn--danger" onClick={confirmDialog} disabled={busy}>
                  {busy ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              )}
            </>
          }
        >
          <p>
            Visit with <strong>{dialog.appt.patient_name}</strong> on <strong>{formatDate(dialog.appt.start_at)}</strong>{' '}
            at <strong>{formatTime(dialog.appt.start_at)}</strong>.{' '}
            {dialog.type === 'complete'
              ? 'This can’t be undone.'
              : 'The patient’s visit will be cancelled and the time becomes free again.'}
          </p>
          {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}
