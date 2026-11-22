/* =====================================================================
   useDismiss(ref, isOpen, onClose) — closes a dropdown/popover when the
   user clicks outside it or presses Escape. Used by the profile menu
   and the "Filter by" popovers.
   ===================================================================== */
import { useEffect } from 'react';

export function useDismiss(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointer(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, isOpen, onClose]);
}
