/* =====================================================================
   StatusBadge — small coloured label for an appointment status,
   using the semantic colours from the Figma style guide.
   ===================================================================== */
import { STATUS_LABELS } from '../../utils/format';

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
