/* =====================================================================
   Modal — white centred dialog over a dimmed page
   (Figma: "Cancel Appointment?", "Confirm Booking", "Booked successfully!").

     <Modal title="Cancel Appointment?" onClose={close}
            actions={<><button …>Keep</button><button …>Yes</button></>}>
       Are you sure…?
     </Modal>

   Closes on Escape or a click on the dark backdrop, unless `busy`
   (e.g. while the request is still running).
   ===================================================================== */
import { useEffect, useId } from 'react';

export default function Modal({ title, tone, children, actions, onClose, busy = false }) {
  const titleId = useId();

  // Escape key closes the dialog.
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, busy]);

  return (
    <div className="modal-backdrop" onMouseDown={() => !busy && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Clicks inside the white card must not close it.
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={`modal__title ${tone === 'success' ? 'modal__title--success' : ''}`}>
          {title}
        </h2>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
