/* =====================================================================
   Calendar  (Figma: "Calendar" link in the doctor header / home card)
   A read-only planning view of the doctor's daily schedule:
   pick a day → see every time slot as Free / Booked / Completed,
   with the patient's name. (Brief: "Doctors see their daily schedule".)

   Changing hours happens on Availability; cancelling and completing
   visits happens on My Appointments.

   Data: GET /api/slots?doctor_id=<my profile id>  +  GET /api/appointments
   ===================================================================== */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentsApi, slotsApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import DoctorProfileGate from '../../components/routing/DoctorProfileGate';
import { TableState } from '../../components/ui/PageState';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  addDays,
  dayParts,
  formatDuration,
  formatLongDay,
  formatTime,
  isFuture,
  isoToDateKey,
  minutesBetween,
  todayKey,
} from '../../utils/datetime';

const DAYS_SHOWN = 14;

export default function DoctorCalendar() {
  return <DoctorProfileGate>{(profile) => <CalendarView profile={profile} />}</DoctorProfileGate>;
}

function CalendarView({ profile }) {
  const loadSlots = useCallback(() => slotsApi.list(profile.id), [profile.id]);
  const slots = useApiData(loadSlots);
  const appointments = useApiData(appointmentsApi.list);

  const [firstDay, setFirstDay] = useState(todayKey());
  const [selectedDay, setSelectedDay] = useState(todayKey());

  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(firstDay, i));

  // slot id → the appointment currently on it (cancelled ones free the slot).
  const appointmentBySlot = useMemo(() => {
    const map = {};
    (appointments.data ?? []).forEach((appt) => {
      if (appt.status !== 'cancelled') map[appt.slot_id] = appt;
    });
    return map;
  }, [appointments.data]);

  // Which days have at least one slot (for the dot under the date).
  const daysWithSlots = useMemo(
    () => new Set((slots.data ?? []).map((slot) => isoToDateKey(slot.start_at))),
    [slots.data],
  );

  const daySlots = (slots.data ?? [])
    .filter((slot) => isoToDateKey(slot.start_at) === selectedDay)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  const bookedCount = daySlots.filter((slot) => appointmentBySlot[slot.id]).length;

  function shiftWeek(direction) {
    const nextFirst = addDays(firstDay, direction * 7);
    setFirstDay(nextFirst);
    setSelectedDay(nextFirst);
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <Link to="/doctor/availability" className="btn btn--secondary">Manage availability</Link>
      </div>

      {/* ---------- Day picker ---------- */}
      <div className="toolbar">
        <div className="toolbar__group">
          <button type="button" className="pagination__button" onClick={() => shiftWeek(-1)} aria-label="Previous week">
            <ChevronLeft size={20} />
          </button>
          <span>{formatLongDay(selectedDay)}</span>
          <button type="button" className="pagination__button" onClick={() => shiftWeek(1)} aria-label="Next week">
            <ChevronRight size={20} />
          </button>
        </div>
        {daySlots.length > 0 && (
          <span className="page-hint">
            {bookedCount} booked · {daySlots.length - bookedCount} free
          </span>
        )}
      </div>

      <div className="day-strip" role="group" aria-label="Choose a day">
        {days.map((day) => {
          const { weekday, day: dayNumber, month } = dayParts(day);
          return (
            <button key={day} type="button" className="day-strip__day" aria-pressed={day === selectedDay}
              onClick={() => setSelectedDay(day)}>
              {weekday}
              <strong>{dayNumber}</strong>
              {month}
              {/* Dot = this day has slots (invisible placeholder otherwise, so heights match). */}
              <span className={`day-strip__dot ${daysWithSlots.has(day) ? '' : 'day-strip__dot--none'}`} />
            </button>
          );
        })}
      </div>

      {/* ---------- That day's schedule ---------- */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Patient’s Name</th>
            </tr>
          </thead>
          <tbody>
            {slots.loading && !slots.data ? (
              <TableState colSpan={4} status="loading" />
            ) : slots.error ? (
              <TableState colSpan={4} status="error" message={slots.error.message} onRetry={slots.reload} />
            ) : daySlots.length === 0 ? (
              <TableState colSpan={4} status="empty" title="No working hours on this day"
                message="Set your weekly hours on the Availability page." />
            ) : (
              daySlots.map((slot) => {
                const appt = appointmentBySlot[slot.id];
                return (
                  <tr key={slot.id}>
                    <td><span className="time-pill">{formatTime(slot.start_at)}</span></td>
                    <td>{formatDuration(minutesBetween(slot.start_at, slot.end_at))}</td>
                    <td>
                      {appt ? (
                        <StatusBadge status={appt.status} />
                      ) : (
                        <span className="badge badge--free">{isFuture(slot.start_at) ? 'Free' : 'Not booked'}</span>
                      )}
                    </td>
                    <td>{appt?.patient_name ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
