/* =====================================================================
   useMyDoctorProfile() — for logged-in doctors.

   The backend has two ids for a doctor:
     - users.id            → who is logged in (from /api/auth/me)
     - doctor_profiles.id  → what slots and appointments point to
   There is no "/api/doctors/me" route yet, so we load the public doctor
   list and find the profile whose user_id matches the logged-in user.

   Returns { profile, loading, error }. `profile` is null if an account
   has the doctor role but no doctor_profiles row (needs seeding).
   ===================================================================== */
import { doctorsApi } from '../api/endpoints';
import { useApiData } from './useApiData';
import { useAuth } from './useAuth';

export function useMyDoctorProfile() {
  const { user } = useAuth();
  const { data: doctors, loading, error } = useApiData(doctorsApi.list);

  const profile = doctors?.find((doctor) => doctor.user_id === user?.id) ?? null;

  return { profile, loading, error };
}
