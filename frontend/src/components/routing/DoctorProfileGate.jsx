/* =====================================================================
   DoctorProfileGate — wraps doctor pages that need the doctor's
   profile id. Shows loading/error states, or a clear message if this
   doctor account has no doctor_profiles row yet (a seeding problem),
   then renders children(profile).

     <DoctorProfileGate>{(profile) => <MyPage profile={profile} />}</DoctorProfileGate>
   ===================================================================== */
import { useMyDoctorProfile } from '../../hooks/useMyDoctorProfile';
import PageState from '../ui/PageState';

export default function DoctorProfileGate({ children }) {
  const { profile, loading, error } = useMyDoctorProfile();

  if (loading) return <PageState status="loading" />;
  if (error) return <PageState status="error" message={error.message} />;
  if (!profile) {
    return (
      <PageState
        status="empty"
        title="Your doctor profile isn’t set up yet"
        message="This account has the doctor role but no specialty/profile in the database. Ask the team to run the seed script."
      />
    );
  }
  return children(profile);
}
