/* =====================================================================
   Doctor Home  (Figma: "Home Page - Doctor")
   Same layout as the patient home, with doctor actions and copy.
   ===================================================================== */
import { NavCard, HomeIntro } from '../../components/ui/HomeSections';
import { CalendarMonthIcon, ClinicPinIcon, EventAvailableIcon } from '../../components/icons/BrandIcons';

export default function DoctorHome() {
  return (
    <>
      <section className="card-grid home-cards" aria-label="Quick links">
        <NavCard to="/doctor/calendar" icon={<CalendarMonthIcon />} label="Check the calendar" />
        <NavCard to="/doctor/appointments" icon={<ClinicPinIcon />} label="See when you’re booked" />
        <NavCard to="/doctor/availability" icon={<EventAvailableIcon />} label="Manage your availability" />
      </section>

      <HomeIntro
        title="Looking for a way to reach more patients?"
        lines={[
          'CareBook helps you reach your patients according to your availability.',
          'Update your availability in your calendar, help those in need.',
          'Use CareBook to treat patients today.',
        ]}
      />
    </>
  );
}
