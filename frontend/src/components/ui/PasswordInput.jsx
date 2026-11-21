/* =====================================================================
   PasswordInput — password field with the eye icon toggle
   (24×24, 14px from the right edge, as in Figma).
   Accepts the same props as a normal <input>.
   ===================================================================== */
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} className="input" />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={22} /> : <Eye size={22} />}
      </button>
    </div>
  );
}
