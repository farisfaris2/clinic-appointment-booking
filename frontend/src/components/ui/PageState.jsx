/* =====================================================================
   PageState — what to show instead of content while loading, when a
   request failed, or when there is nothing to show yet.

     <PageState status="loading" />
     <PageState status="error" message={error.message} onRetry={reload} />
     <PageState status="empty" title="No visits yet" message="Book one…" />
   ===================================================================== */
const DEFAULT_TITLES = {
  loading: 'Loading…',
  error: 'Something went wrong',
  empty: 'Nothing here yet',
};

export default function PageState({ status, title, message, onRetry, children }) {
  return (
    <div
      className={`state state--${status}`}
      // Screen readers announce errors immediately, other states politely.
      role={status === 'error' ? 'alert' : 'status'}
    >
      <p className="state__title">{title ?? DEFAULT_TITLES[status]}</p>
      {message && <p>{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
      {children}
    </div>
  );
}

/**
 * Same idea inside a <table>: one row stretched across all columns.
 * Pass the number of columns as `colSpan`.
 */
export function TableState({ colSpan, ...props }) {
  return (
    <tr>
      <td colSpan={colSpan} className="table__message">
        <PageState {...props} />
      </td>
    </tr>
  );
}
