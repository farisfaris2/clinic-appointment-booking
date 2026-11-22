/* =====================================================================
   Toolbar pieces used above lists and tables (Figma: "Filter by",
   "Order by A-Z", "Search").

     <div className="toolbar">
       <div className="toolbar__group">
         <FilterMenu> …<select>s… </FilterMenu>
         <SortToggle label="A-Z" onToggle={…} />
       </div>
       <SearchField value={q} onChange={setQ} />
     </div>
   ===================================================================== */
import { useCallback, useRef, useState } from 'react';
import { Funnel, Search } from 'lucide-react';
import { useDismiss } from '../../hooks/useDismiss';

/** "Filter by" button that opens a small white panel with filter fields. */
export function FilterMenu({ children, activeCount = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        type="button"
        className="filter-button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Funnel size={16} />
        Filter by{activeCount > 0 && ` (${activeCount})`}
      </button>
      {open && <div className="popover">{children}</div>}
    </div>
  );
}

/** "Order by [A-Z]" — clicking the pill flips the order. */
export function SortToggle({ label, onToggle }) {
  return (
    <div className="sort-control">
      <span>Order by</span>
      <button type="button" className="sort-control__pill" onClick={onToggle}>
        {label}
      </button>
    </div>
  );
}

/** Search box with a magnifier icon. */
export function SearchField({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="search-field">
      <span className="visually-hidden">{placeholder}</span>
      <Search size={18} className="search-field__icon" />
      <input
        type="search"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** A labelled <select> for use inside FilterMenu or forms. */
export function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
