/* =====================================================================
   usePagination(items, pageSize) — split a list into pages.

     const { pageItems, page, totalPages, setPage } = usePagination(list, 6);

   If the list shrinks (e.g. after filtering) the page number is clamped,
   so you never end up on an empty "page 3 of 1".
   ===================================================================== */
import { useState } from 'react';

export function usePagination(items, pageSize) {
  const [requestedPage, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    page,
    totalPages,
    setPage,
    pageItems: items.slice(start, start + pageSize),
  };
}
