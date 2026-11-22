/* =====================================================================
   Our Doctors  (Figma: "Doctors - Patient")
   GET /api/doctors + GET /api/specialties
   Filter by specialty, sort A-Z / Z-A, search by name, 6 per page.
   ===================================================================== */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi, specialtiesApi } from '../../api/endpoints';
import { useApiData } from '../../hooks/useApiData';
import { usePagination } from '../../hooks/usePagination';
import { FilterMenu, SearchField, SelectField, SortToggle } from '../../components/ui/Toolbar';
import Pagination from '../../components/ui/Pagination';
import PageState from '../../components/ui/PageState';
import { StethoscopeIcon } from '../../components/icons/BrandIcons';
import { doctorLocation, doctorTitle } from '../../utils/format';

const PAGE_SIZE = 6; // 3×2 grid in Figma

export default function DoctorsList() {
  const doctors = useApiData(doctorsApi.list);
  const specialties = useApiData(specialtiesApi.list);

  const [specialtyId, setSpecialtyId] = useState('');
  const [ascending, setAscending] = useState(true);
  const [search, setSearch] = useState('');

  // Apply filter → search → sort. useMemo re-runs only when inputs change.
  const visibleDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (doctors.data ?? [])
      .filter((doctor) => !specialtyId || String(doctor.specialty_id) === specialtyId)
      .filter((doctor) => doctor.name.toLowerCase().includes(query))
      .sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name));
  }, [doctors.data, specialtyId, search, ascending]);

  const { pageItems, page, totalPages, setPage } = usePagination(visibleDoctors, PAGE_SIZE);

  // Changing a filter jumps back to page 1.
  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__group">
          <FilterMenu activeCount={specialtyId ? 1 : 0}>
            <SelectField
              label="Specialty"
              value={specialtyId}
              onChange={withPageReset(setSpecialtyId)}
              placeholder="All specialties"
              options={(specialties.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
            />
          </FilterMenu>
          <SortToggle label={ascending ? 'A-Z' : 'Z-A'} onToggle={() => setAscending((value) => !value)} />
        </div>
        <SearchField value={search} onChange={withPageReset(setSearch)} placeholder="Search doctors" />
      </div>

      <h1 className="page-title page-header">Our Doctors</h1>

      {doctors.loading && !doctors.data ? (
        <PageState status="loading" />
      ) : doctors.error ? (
        <PageState status="error" message={doctors.error.message} onRetry={doctors.reload} />
      ) : visibleDoctors.length === 0 ? (
        <PageState
          status="empty"
          title="No doctors found"
          message={doctors.data.length ? 'Try a different name or specialty.' : 'No doctors have been added yet.'}
        />
      ) : (
        <>
          <div className="card-grid">
            {pageItems.map((doctor) => (
              <Link key={doctor.id} to={`/patient/doctors/${doctor.id}`} className="card card--interactive doctor-card">
                <span className="card__icon">
                  <StethoscopeIcon />
                </span>
                <div>
                  <h2 className="doctor-card__name">{doctorTitle(doctor.name)}</h2>
                  <p className="doctor-card__meta">{doctor.specialty}</p>
                  <p className="doctor-card__meta">{doctorLocation(doctor)}</p>
                </div>
                <span className="doctor-card__link">View availability</span>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
