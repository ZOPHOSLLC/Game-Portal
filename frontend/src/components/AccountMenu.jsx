import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

// Reddit-style account menu: an avatar button in the header opens a small dropdown
// with who is signed in, the links for the account, and Log out at the bottom.
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);

  // Close on a click outside the menu or on Escape. Escape returns focus to the avatar.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        onClick={() => setOpen((value) => !value)}
        className={`grid size-10 place-items-center rounded-full bg-cyan text-sm leading-5 font-semibold text-ink ring-2 transition hover:brightness-110 ${
          open ? 'ring-cyan' : 'ring-transparent'
        }`}
      >
        <span aria-hidden="true">{initial}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute top-12 right-0 z-40 flex w-60 flex-col rounded-xl border border-line bg-surface p-1 shadow-lift"
        >
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-sm leading-5 font-semibold text-fg">{user.username}</span>
            <span className="caption truncate">{user.email}</span>
          </div>
          <div role="separator" className="my-1 h-px bg-line" />
          <Link
            role="menuitem"
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm leading-5 text-fg transition hover:bg-surface-hover"
          >
            <User size={16} aria-hidden="true" className="text-muted" />
            My library
          </Link>
          <Link
            role="menuitem"
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm leading-5 text-fg transition hover:bg-surface-hover"
          >
            <Settings size={16} aria-hidden="true" className="text-muted" />
            Settings
          </Link>
          <div role="separator" className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-left text-sm leading-5 text-fg transition hover:bg-surface-hover"
          >
            <LogOut size={16} aria-hidden="true" className="text-muted" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
