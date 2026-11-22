/* =====================================================================
   Patient Home  (Figma: "Home Page - Patient")
   Three navigation cards + the value-proposition section.
   ===================================================================== */
import { NavCard, HomeIntro } from '../../components/ui/HomeSections';
import { ClinicPinIcon, DocumentPlusIcon, StethoscopeIcon } from '../../components/icons/BrandIcons';

export default function PatientHome() {
  return (
    <>
      <section className="card-grid home-cards" aria-label="Quick links">
        <NavCard to="/patient/doctors" icon={<StethoscopeIcon />} label="See the list of healthcare providers" />
        <NavCard to="/patient/visits" icon={<ClinicPinIcon />} label="See your upcoming visits" />
        <NavCard to="/patient/book" icon={<DocumentPlusIcon />} label="Book a new visit today" />
      </section>

      <HomeIntro
        title="Looking for accessible quality healthcare?"
        lines={[
          'CareBook helps you book and manage your appointments online.',
          'Search for the service you desire, check available time slots, book with ease.',
          'Book your doctor’s visits with CareBook today.',
        ]}
      />
    </>
  );
}
