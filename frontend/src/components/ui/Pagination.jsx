/* =====================================================================
   Pagination — "‹ 1/4 ›" under grids and tables.
   Hidden automatically when everything fits on one page.
   ===================================================================== */
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      <span aria-live="polite">
        {page}/{totalPages}
      </span>
      <button
        type="button"
        className="pagination__button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
