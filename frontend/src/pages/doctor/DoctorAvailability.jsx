/* =====================================================================
   Availability  (Figma: "Availability - Doctor")
   The doctor describes their normal working week — days, hours, break
   and visit length. "Save Availability" turns that into real time slots
   for the coming weeks. This page is the full CRUD for time slots:

   - READ    the form opens pre-filled from the doctor's existing slots
   - UPDATE  free slots that no longer fit are MOVED to a new time
             that is needed                     → PUT    /api/slots/:id
   - CREATE  extra slots that are still needed  → POST   /api/slots
   - DELETE  leftover free slots                → DELETE /api/slots/:id
   Moving or removing slots asks for confirmation first (brief requirement).

   Booked visits are never touched: they stay, and new slots that would
   overlap them are skipped. (The backend stores individual slots, not
   a weekly pattern, which is why the pattern is rebuilt from the slots.)
   ===================================================================== */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { appointmentsApi, slotsApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import DoctorProfileGate from '../../components/routing/DoctorProfileGate';
import Modal from '../../components/ui/Modal';
import PageState from '../../components/ui/PageState';
import { addDays, dateKeyToDate, localToIso, minutesBetween, toTimeInputValue, todayKey } from '../../utils/datetime';
import { DEFAULT_VISIT_TYPE, DURATION_OPTIONS } from '../../utils/format';

// JavaScript numbers weekdays 0 (Sunday) … 6 (Saturday).
const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const WEEKS_OPTIONS = [1, 2, 3, 4];

const DEFAULT_FORM = {
  days: [],
  workFrom: '09:00',
  workTo: '17:00',
  hasBreak: true,
  breakFrom: '12:00',
  breakTo: '13:00',
  duration: 30,
  weeks: 2,
};

/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */

/** "09:30" → 570 minutes after midnight, and back. */
const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Same start AND end = the same slot. */
const slotKey = (startAt, endAt) => `${startAt}|${endAt}`;

/** True if two time ranges overlap. */
const overlaps = (a, b) => a.startAt < b.end_at && a.endAt > b.start_at;

/** Returns an error message, or '' if the form makes sense. */
function validate(form) {
  if (form.days.length === 0) return 'Choose at least one working day.';
  if (toMinutes(form.workTo) <= toMinutes(form.workFrom)) return 'Working hours must end after they start.';
  if (toMinutes(form.workTo) - toMinutes(form.workFrom) < form.duration)
    return 'The working day is shorter than one visit.';
  if (form.hasBreak && toMinutes(form.breakTo) <= toMinutes(form.breakFrom)) return 'The break must end after it starts.';
  return '';
}

/**
 * Weekly pattern → list of { startAt, endAt } (UTC strings) from today
 * for `weeks` weeks, skipping the break and times already in the past.
 */
function buildSlots(form) {
  const slots = [];
  const dayEnd = toMinutes(form.workTo);
  const breakStart = toMinutes(form.breakFrom);
  const breakEnd = toMinutes(form.breakTo);

  for (let i = 0; i < form.weeks * 7; i += 1) {
    const day = addDays(todayKey(), i);
    if (!form.days.includes(dateKeyToDate(day).getDay())) continue;

    let start = toMinutes(form.workFrom);
    while (start + form.duration <= dayEnd) {
      const overlapsBreak = form.hasBreak && start < breakEnd && start + form.duration > breakStart;
      if (overlapsBreak) {
        start = breakEnd; // jump to the end of the break
        continue;
      }
      const startAt = localToIso(day, toTime(start));
      const endAt = localToIso(day, toTime(start + form.duration));
      if (Date.parse(startAt) > Date.now()) slots.push({ startAt, endAt });
      start += form.duration;
    }
  }
  return slots;
}

/**
 * The reverse of buildSlots: look at the doctor's upcoming slots and
 * work out the weekly pattern, so the form opens with their real hours.
 */
function patternFromSlots(slots) {
  const upcoming = slots.filter((slot) => Date.parse(slot.start_at) > Date.now());
  if (upcoming.length === 0) return DEFAULT_FORM;

  const days = [...new Set(upcoming.map((slot) => new Date(slot.start_at).getDay()))];
  const starts = upcoming.map((slot) => toTimeInputValue(slot.start_at)).sort();
  const ends = upcoming.map((slot) => toTimeInputValue(slot.end_at)).sort();

  // Most common slot length = visit duration.
  const counts = {};
  upcoming.forEach((slot) => {
    const minutes = minutesBetween(slot.start_at, slot.end_at);
    counts[minutes] = (counts[minutes] ?? 0) + 1;
  });
  const duration = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

  // Break = the gap inside the first working day that has one.
  const sorted = [...upcoming].sort((a, b) => a.start_at.localeCompare(b.start_at));
  let breakFrom = null;
  let breakTo = null;
  for (let i = 1; i < sorted.length && !breakFrom; i += 1) {
    const sameDay = sorted[i].start_at.slice(0, 10) === sorted[i - 1].start_at.slice(0, 10);
    if (sameDay && sorted[i].start_at > sorted[i - 1].end_at) {
      breakFrom = toTimeInputValue(sorted[i - 1].end_at);
      breakTo = toTimeInputValue(sorted[i].start_at);
    }
  }

  return {
    ...DEFAULT_FORM,
    days,
    workFrom: starts[0],
    workTo: ends[ends.length - 1],
    duration: DURATION_OPTIONS.includes(duration) ? duration : DEFAULT_FORM.duration,
    hasBreak: Boolean(breakFrom),
    breakFrom: breakFrom ?? DEFAULT_FORM.breakFrom,
    breakTo: breakTo ?? DEFAULT_FORM.breakTo,
  };
}

/**
 * Compare the new schedule with what exists and decide what to do.
 * Only slots inside the chosen period are considered.
 * Returns { toMove: [{ slot, target }], toCreate, toDelete, keptBooked }.
 */
function planChanges(form, existingSlots, slotsWithHistory) {
  const windowEnd = Date.parse(localToIso(addDays(todayKey(), form.weeks * 7), '00:00'));
  const inWindow = existingSlots.filter(
    (slot) => Date.parse(slot.start_at) > Date.now() && Date.parse(slot.start_at) < windowEnd,
  );

  const wanted = buildSlots(form);
  const wantedKeys = new Set(wanted.map((slot) => slotKey(slot.startAt, slot.endAt)));

  // Free slots that are not part of the new schedule.
  const unwanted = inWindow.filter((slot) => slot.available && !wantedKeys.has(slotKey(slot.start_at, slot.end_at)));
  const unwantedIds = new Set(unwanted.map((slot) => slot.id));
  const kept = inWindow.filter((slot) => !unwantedIds.has(slot.id));

  // New times still needed: wanted, not existing, not clashing with a kept slot.
  const needed = wanted.filter((slot) => !kept.some((existing) => overlaps(slot, existing)));

  // UPDATE: move unwanted slots onto needed times, oldest first. Slots with
  // booking history go first, because the server won't let us delete them.
  const movable = [...unwanted].sort(
    (a, b) => Number(slotsWithHistory.has(b.id)) - Number(slotsWithHistory.has(a.id)) || a.start_at.localeCompare(b.start_at),
  );
  const pairs = Math.min(movable.length, needed.length);
  const toMove = movable.slice(0, pairs).map((slot, index) => ({ slot, target: needed[index] }));

  // CREATE whatever is still needed; DELETE leftovers that have no history.
  const toCreate = needed.slice(pairs);
  const toDelete = movable.slice(pairs).filter((slot) => !slotsWithHistory.has(slot.id));

  const keptBooked = kept.filter((slot) => !slot.available).length;
  return { toMove, toCreate, toDelete, keptBooked };
}

/* ---------------------------------------------------------------------
   Page
   --------------------------------------------------------------------- */
export default function DoctorAvailability() {
  return <DoctorProfileGate>{(profile) => <AvailabilityLoader profile={profile} />}</DoctorProfileGate>;
}

/** Loads the doctor's slots + appointments, then shows the form. */
function AvailabilityLoader({ profile }) {
  const loadSlots = useCallback(() => slotsApi.list(profile.id), [profile.id]);
  const slots = useApiData(loadSlots);
  const appointments = useApiData(appointmentsApi.list);

  if ((slots.loading && !slots.data) || (appointments.loading && !appointments.data)) {
    return <PageState status="loading" />;
  }
  if (slots.error || appointments.error) {
    const error = slots.error || appointments.error;
    return <PageState status="error" message={error.message} onRetry={slots.reload} />;
  }

  // Slots that have (or had) a booking can't be deleted by the server.
  const slotsWithHistory = new Set(appointments.data.map((appt) => appt.slot_id));

  return (
    <AvailabilityForm
      profile={profile}
      slots={slots.data}
      slotsWithHistory={slotsWithHistory}
      onSaved={() => {
        slots.reload();
        appointments.reload();
      }}
    />
  );
}

function AvailabilityForm({ profile, slots, slotsWithHistory, onSaved }) {
  // Pre-filled once from the existing slots (useState ignores later changes).
  const [form, setForm] = useState(() => patternFromSlots(slots));
  const [plan, setPlan] = useState(null); // shown in the confirmation dialog
  const [progress, setProgress] = useState(null); // { done, total } while saving
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const addDay = (value) => value !== '' && set('days', [...form.days, Number(value)]);
  const removeDay = (value) => set('days', form.days.filter((d) => d !== value));

  const problem = validate(form);
  const preview = useMemo(
    () => (problem ? null : planChanges(form, slots, slotsWithHistory)),
    [form, problem, slots, slotsWithHistory],
  );
  const saving = progress !== null;

  /** Step 1: check the form; ask for confirmation if existing slots change. */
  function handleSaveClick() {
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setResult(null);
    if (preview.toMove.length > 0 || preview.toDelete.length > 0) setPlan(preview);
    else applyPlan(preview);
  }

  /** Step 2: send the requests one by one and count the results. */
  async function applyPlan({ toMove, toCreate: plannedCreates, toDelete: plannedDeletes, keptBooked }) {
    setPlan(null);
    // Copies, because failed moves may add to these lists below.
    const toCreate = [...plannedCreates];
    const toDelete = [...plannedDeletes];
    const summary = { moved: 0, created: 0, removed: 0, keptBooked, failed: 0, firstError: '' };
    const total = toMove.length + toDelete.length + toCreate.length;
    let done = 0;
    setProgress({ done, total });
    const tick = () => setProgress({ done: (done += 1), total });
    const fail = (err) => {
      summary.failed += 1;
      summary.firstError ||= err.message;
    };

    // UPDATE (PUT). A move can briefly clash with a neighbouring slot that
    // hasn't moved yet (409), so failed moves are retried after the others.
    let pending = toMove;
    for (let round = 0; round < 3 && pending.length > 0; round += 1) {
      const retry = [];
      for (const move of pending) {
        try {
          await slotsApi.update(move.slot.id, move.target);
          summary.moved += 1;
          tick();
        } catch (err) {
          if (err.status === 409) retry.push(move);
          else {
            fail(err);
            tick();
          }
        }
      }
      pending = retry;
    }
    // Moves that still clash: fall back to delete + create where allowed.
    for (const move of pending) {
      if (slotsWithHistory.has(move.slot.id)) fail(new Error('A slot with booking history could not be moved'));
      else {
        toDelete.push(move.slot);
        toCreate.push(move.target);
      }
      tick();
    }

    // DELETE, then CREATE.
    for (const slot of toDelete) {
      try {
        await slotsApi.remove(slot.id);
        summary.removed += 1;
      } catch (err) {
        fail(err);
      }
      tick();
    }
    for (const slot of toCreate) {
      try {
        await slotsApi.create({ doctorId: profile.id, ...slot });
        summary.created += 1;
      } catch (err) {
        fail(err);
      }
      tick();
    }

    setProgress(null);
    setResult(summary);
    onSaved();
  }

  const remainingDays = WEEKDAYS.filter((d) => !form.days.includes(d.value));
  const chosenDays = WEEKDAYS.filter((d) => form.days.includes(d.value)); // keep week order

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Availability</h1>
        <button type="button" className="btn btn--primary" onClick={handleSaveClick} disabled={saving}>
          {saving ? `Saving ${Math.min(progress.done, progress.total)}/${progress.total}…` : 'Save Availability'}
        </button>
      </div>

      {/* ---------- Feedback ---------- */}
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {result && (
        <p className={`alert ${result.failed ? 'alert--warning' : 'alert--success'}`} role="status">
          Saved. {result.moved} moved, {result.created} added, {result.removed} removed
          {result.keptBooked > 0 && `, ${result.keptBooked} booked kept`}
          {result.failed > 0 && `, ${result.failed} failed (${result.firstError})`}.{' '}
          <Link to="/doctor/calendar" className="link">View calendar</Link>
        </p>
      )}

      <div className="availability">
        {/* ---------- Working days ---------- */}
        <section className="availability__section">
          <h2 className="availability__heading">Working hours</h2>
          <p className="availability__hint">Please, choose the days of the week during which you are generally available</p>
          <select className="select" value="" onChange={(e) => addDay(e.target.value)} disabled={remainingDays.length === 0}
            aria-label="Add a working day">
            <option value="">{remainingDays.length ? 'Add a day' : 'All days added'}</option>
            {remainingDays.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          {chosenDays.length > 0 && (
            <div className="chip-list">
              {chosenDays.map((d) => (
                <span key={d.value} className="chip">
                  {d.label}
                  <button type="button" className="chip__remove" onClick={() => removeDay(d.value)}
                    aria-label={`Remove ${d.label}`}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ---------- Working hours ---------- */}
        <section className="availability__section">
          <p className="availability__hint">Please, choose the hours of the work day during which you are generally available</p>
          <div className="time-range">
            <label>From
              <input type="time" className="input input--compact" step={300} value={form.workFrom}
                onChange={(e) => set('workFrom', e.target.value)} />
            </label>
            <label>To
              <input type="time" className="input input--compact" step={300} value={form.workTo}
                onChange={(e) => set('workTo', e.target.value)} />
            </label>
          </div>
          <div className="time-range">
            <label>Publish for
              <select className="select" value={form.weeks} onChange={(e) => set('weeks', Number(e.target.value))}>
                {WEEKS_OPTIONS.map((w) => <option key={w} value={w}>the next {w} week{w > 1 ? 's' : ''}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* ---------- Visit duration ---------- */}
        <section className="availability__section">
          <p className="availability__hint">Please, enter the general duration for a patient’s visit</p>
          <div className="time-range">
            {/* Only one visit type exists in the backend for now (Figma: several, for the final). */}
            <select className="select" disabled aria-label="Visit type">
              <option>{DEFAULT_VISIT_TYPE}</option>
            </select>
            <select className="select select--narrow" value={form.duration}
              onChange={(e) => set('duration', Number(e.target.value))} aria-label="Visit duration">
              {DURATION_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        </section>

        {/* ---------- Break ---------- */}
        <section className="availability__section">
          <p className="availability__hint">Please, choose the hours of the work day during which you are unavailable/on a break</p>
          <div className="time-range">
            <label>From
              <input type="time" className="input input--compact" step={300} value={form.breakFrom}
                disabled={!form.hasBreak} onChange={(e) => set('breakFrom', e.target.value)} />
            </label>
            <label>To
              <input type="time" className="input input--compact" step={300} value={form.breakTo}
                disabled={!form.hasBreak} onChange={(e) => set('breakTo', e.target.value)} />
            </label>
            <label>
              <input type="checkbox" checked={!form.hasBreak} onChange={(e) => set('hasBreak', !e.target.checked)} />
              No break
            </label>
          </div>
        </section>
      </div>

      {/* Live preview so the doctor knows what "Save" will do. */}
      <p className="page-hint availability__summary" aria-live="polite">
        {problem
          ? problem
          : preview.toMove.length + preview.toCreate.length + preview.toDelete.length === 0
            ? 'Your published slots already match this schedule.'
            : `Saving will move ${preview.toMove.length}, add ${preview.toCreate.length} and remove ${preview.toDelete.length} free time slot(s) over the next ${form.weeks} week(s).`}
      </p>

      {/* ---------- Confirm before deleting (brief: delete asks for confirmation) ---------- */}
      {plan && (
        <Modal
          title="Update your availability?"
          onClose={() => setPlan(null)}
          actions={
            <>
              <button type="button" className="btn btn--secondary" onClick={() => setPlan(null)}>Back</button>
              <button type="button" className="btn btn--primary" onClick={() => applyPlan(plan)}>Save</button>
            </>
          }
        >
          <p>
            Your free time slots will change: <strong>{plan.toMove.length}</strong> moved to a new time,{' '}
            <strong>{plan.toCreate.length}</strong> added and <strong>{plan.toDelete.length}</strong> removed.
            Booked visits are not affected.
          </p>
        </Modal>
      )}
    </>
  );
}