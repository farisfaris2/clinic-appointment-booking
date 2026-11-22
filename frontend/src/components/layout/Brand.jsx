/* =====================================================================
   Brand — CareBook logo icon + wordmark. Links to the given page.
   Colour comes from CSS (.brand is blue in the header, white in footer).
   ===================================================================== */
import { Link } from 'react-router-dom';
import { CareBookLogo } from '../icons/BrandIcons';

export default function Brand({ to = '/', logoSize = 63 }) {
  return (
    <Link to={to} className="brand" aria-label="CareBook home">
      <CareBookLogo size={logoSize} />
      <span className="brand__wordmark">CareBook</span>
    </Link>
  );
}
