import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A password input with a show/hide button. Hidden by default.
// The label is linked by id, not wrapped around the button, so the field's name stays "Password".
export default function PasswordField({ label, labelHidden = false, error, hint, className = '', ...props }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelHidden ? 'sr-only' : 'text-sm leading-5 font-medium text-fg'}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={shown ? 'text' : 'password'}
          className={`field pr-10 ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:text-fg"
        >
          {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <span id={`${id}-hint`} className="text-xs leading-4 text-red-400">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="caption">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
