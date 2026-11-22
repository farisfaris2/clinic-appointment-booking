/* =====================================================================
   Doctor Availability / Profile  (Figma: "Doctors availability- Patient")
   Two-column table about one doctor + round "Book Now" button.

   Data:
   - GET /api/doctors          → name, specialty, room, bio
   - GET /api/slots?doctor_id= → the doctor's published time slots
   The backend doesn't store working days/hours, so we WORK THEM OUT
   from the doctor's upcoming free slots — it's real data, just derived.
   Rows for fields the backend doesn't have yet (languages, break, visit
   types) appear automatically once those columns are added.
   ===================================================================== */
import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { doctorsApi, slotsApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import PageState from '../../components/ui/PageState';
import { BookCalendarIcon } from '../../components/icons/BrandIcons';
import { doctorLocation, doctorTitle } from '../../utils/format';
import {
  formatDate,
  formatDuration,
  formatTime,
  isFuture,
  minutesBetween,
  toTimeInputValue,
  weekdayName,
} from '../../utils/datetime';

const WEEK_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Summarise a doctor's upcoming free slots into readable facts. */
function summariseSlots(slots) {
  const upcoming = slots.filter((slot) => slot.available && isFuture(slot.start_at));
  if (upcoming.length === 0) return null;

  // Unique weekdays, in calendar order.
  const days = [...new Set(upcoming.map((slot) => weekdayName(slot.start_at)))].sort(
    (a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b),
  );

  // Earliest start and latest end time of day ("09:00" strings sort correctly).
  const firstSlot = upcoming.reduce((a, b) => (toTimeInputValue(a.start_at) <= toTimeInputValue(b.start_at) ? a : b));
  const lastSlot = upcoming.reduce((a, b) => (toTimeInputValue(a.end_at) >= toTimeInputValue(b.end_at) ? a : b));

  // Most common slot length = typical visit duration.
  const counts = {};
  upcoming.forEach((slot) => {
    const minutes = minutesBetween(slot.start_at, slot.end_at);
    counts[minutes] = (counts[minutes] ?? 0) + 1;
  });
  const typicalMinutes = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

  const next = upcoming.reduce((a, b) => (a.start_at <= b.start_at ? a : b));

  return {
    days: days.join(', '),
    hours: `${formatTime(firstSlot.start_at)} – ${formatTime(lastSlot.end_at)}`,
    duration: formatDuration(typicalMinutes),
    next: `${formatDate(next.start_at)}, ${formatTime(next.start_at)}`,
    count: upcoming.length,
  };
}

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const doctors = useApiData(doctorsApi.list);
  const loadSlots = useCallback(() => slotsApi.list(doctorId), [doctorId]);
  const slots = useApiData(loadSlots);

  if (doctors.loading && !doctors.data) return <PageState status="loading" />;
  if (doctors.error) return <PageState status="error" message={doctors.error.message} onRetry={doctors.reload} />;

  const doctor = doctors.data.find((d) => String(d.id) === doctorId);
  if (!doctor) {
    return (
      <PageState status="empty" title="Doctor not found">
        <Link to="/patient/doctors" className="link">Back to all doctors</Link>
      </PageState>
    );
  }

  const summary = slots.data ? summariseSlots(slots.data) : null;
  const noHours = slots.loading ? 'Loading…' : 'No open times published yet';

  // [label, value] pairs. Rows with no value are skipped.
  const rows = [
    ['Specialty', doctor.specialty],
    ['Clinic', doctorLocation(doctor)],
    ['Working Languages', doctor.languages],
    ['Working Days', summary?.days ?? noHours],
    ['Working Hours', summary?.hours ?? noHours],
    ['Break', doctor.break_time],
    ['Visit Types Offered', doctor.visit_types],
    ['Visit Duration', summary?.duration ?? noHours],
    ['Next Available', summary?.next ?? noHours],
    ['About', doctor.bio],
  ].filter(([, value]) => Boolean(value));

  return (
    <>
      <div className="page-header">
        <button type="button" className="back-title" onClick={() => navigate('/patient/doctors')}>
          <ChevronLeft size={28} />
          {doctorTitle(doctor.name)}
        </button>
      </div>

      <div className="doctor-profile">
        <table className="spec-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Link to={`/patient/book?doctorId=${doctor.id}`} className="book-circle">
          <BookCalendarIcon size={36} />
          Book Now
        </Link>
      </div>

      {slots.error && (
        <p className="form-message form-message--error" role="alert">
          Couldn’t load this doctor’s times: {slots.error.message}
        </p>
      )}
    </>
  );
}
