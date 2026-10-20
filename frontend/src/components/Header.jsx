import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from './Button.jsx';
import AccountMenu from './AccountMenu.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Header() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const onHome = useLocation().pathname === '/';
  const query = params.get('q') ?? '';

  // Typing in the header search always lands on the catalogue with ?q=.
  function handleSearch(value) {
    if (!onHome) {
      navigate(value ? `/?q=${encodeURIComponent(value)}` : '/');
      return;
    }
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur">
      <div className="page flex flex-wrap items-center gap-4 py-4 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link to="/" className="flex items-center gap-3">
          <img src="/icon-192.png" alt="" width="40" height="40" className="rounded-lg" />
          <span className="flex flex-col gap-1">
            <span className="wordmark">YOUR STUDIO</span>
            <span className="eyebrow hidden whitespace-nowrap sm:block">Official released games</span>
          </span>
        </Link>

        <label className="relative order-last w-full sm:order-none sm:ml-auto sm:max-w-sm">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search games…"
            aria-label="Search games"
            className="field pl-9"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="chase-strip" aria-hidden="true" />
    </header>
  );
}
