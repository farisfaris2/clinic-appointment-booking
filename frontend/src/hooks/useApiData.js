/* =====================================================================
   useApiData(loader) — load data from the API with loading/error state.

     const loadDoctors = useCallback(() => doctorsApi.list(), []);
     const { data, loading, error, reload } = useApiData(loadDoctors);

   - `loader` must be wrapped in useCallback (otherwise it would reload
     on every render).
   - `reload()` fetches again, e.g. after booking or cancelling. While
     reloading, the old `data` stays on screen so the page doesn't flash.
   ===================================================================== */
import { useCallback, useEffect, useState } from 'react';

export function useApiData(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false; // stops a slow old request overwriting a newer one

    loader()
      .then((data) => {
        if (!ignore) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState((prev) => ({ data: prev.data, loading: false, error }));
      });

    return () => {
      ignore = true;
    };
  }, [loader, reloadCount]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    setReloadCount((count) => count + 1);
  }, []);

  return { ...state, reload };
}
