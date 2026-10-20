import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Search, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { addRecent, toggleFavorite, useLibrary } from '../lib/library.js';
import { gamePath } from '../lib/slug.js';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button.jsx';

const TABS = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recently played' },
];

const SORTS = [
  { id: 'recent', label: 'Recently played' },
  { id: 'title', label: 'Title A to Z' },
  { id: 'category', label: 'Category' },
];

// My library: the games you saved and played, in this browser (favorites follow your account).
export default function Profile() {
  const { user } = useAuth();
  const { favorites, recent } = useLibrary();
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('favorites');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'My library | My Game Portal';
    let alive = true;
    api
      .games()
      .then((list) => alive && setGames(Array.isArray(list) ? list : []))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map((games || []).map((g) => [String(g.id), g])), [games]);
  const favoriteGames = favorites.map((id) => byId.get(id)).filter(Boolean);
  const recentGames = recent.map((id) => byId.get(id)).filter(Boolean);
  const continueGame = recentGames[0];

  const shown = useMemo(() => {
    const base = tab === 'favorites' ? favoriteGames : recentGames;
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((g) => (g.title || '').toLowerCase().includes(q)) : base;
    if (sort === 'title') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'category') return [...filtered].sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    return filtered; // already most recent first
  }, [tab, favoriteGames, recentGames, query, sort]);

  return (
    <div className="page flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">{user ? `${user.username}'s library` : 'Your library'}</p>
          <h1 className="title">My library</h1>
          <p className="body">
            {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'} · {recent.length} recently played
          </p>
        </div>
        {!user && (
          <p className="caption max-w-xs text-right">
            Saved on this browser.{' '}
            <Link to="/register" className="font-medium text-cyan hover:underline">
              Create an account
            </Link>{' '}
            to keep it on every device.
          </p>
        )}
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm leading-5 text-red-300">Could not load games: {error}</p>}

      {continueGame && (
        <section aria-labelledby="continue-heading" className="card flex flex-col gap-5 overflow-hidden p-0 sm:flex-row">
          <div className="relative aspect-video w-full overflow-hidden bg-ink sm:aspect-auto sm:w-72 sm:shrink-0">
            {continueGame.thumb && <img src={continueGame.thumb} alt="" className="size-full object-cover" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6">
            <p id="continue-heading" className="eyebrow flex items-center gap-2">
              <Sparkles size={14} aria-hidden="true" /> Continue playing
            </p>
            <h2 className="heading truncate">{continueGame.title}</h2>
            <span className="badge self-start">{continueGame.category || 'Game'}</span>
            <div>
              <Link to={gamePath(continueGame)} onClick={() => addRecent(continueGame.id)}>
                <Button>
                  <Play size={14} fill="currentColor" aria-hidden="true" />
                  Play now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Library sections" className="inline-flex rounded-lg border border-line bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 rounded-md px-3 text-sm leading-5 font-medium transition ${
                  tab === t.id ? 'bg-cyan text-ink' : 'text-muted hover:text-fg'
                }`}
              >
                {t.label}
                <span className="ml-2 text-xs opacity-70">{t.id === 'favorites' ? favoriteGames.length : recentGames.length}</span>
              </button>
            ))}
          </div>

          <label className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs sm:flex-none">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter this list"
              aria-label="Filter this list"
              className="field pl-9"
            />
          </label>

          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field h-10 w-auto pr-8">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>

        {games === null && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl border border-line bg-surface" />
            ))}
          </div>
        )}

        {games && shown.length === 0 && (
          <EmptyState tab={tab} filtered={Boolean(query.trim())} />
        )}

        {shown.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((game) => (
              <LibraryCard key={game.id} game={game} isFavorite={favorites.includes(String(game.id))} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// One game in the library: cover, title, category, and a heart to take it out of favorites.
function LibraryCard({ game, isFavorite }) {
  return (
    <li className="group relative overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link
        to={gamePath(game)}
        onClick={() => addRecent(game.id)}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        <div className="aspect-[4/3] overflow-hidden bg-ink">
          {game.thumb && <img src={game.thumb} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <span className="badge self-start">{game.category || 'Game'}</span>
          <h3 className="truncate text-sm leading-5 font-semibold text-fg">{game.title}</h3>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(game.id)}
        aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        aria-pressed={isFavorite}
        className={`absolute top-3 right-3 grid size-8 place-items-center rounded-lg border border-line bg-ink/80 transition hover:bg-surface-hover ${
          isFavorite ? 'text-red-500' : 'text-muted hover:text-fg'
        }`}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </li>
  );
}

function EmptyState({ tab, filtered }) {
  if (filtered) {
    return <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm leading-6 text-muted">No games match that filter.</p>;
  }
  const copy =
    tab === 'favorites'
      ? { title: 'No favorites yet', body: 'Tap the heart on any game to keep it here.' }
      : { title: 'Nothing played yet', body: 'Games you open will show up here, so you can pick up where you left off.' };
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line bg-surface p-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-cyan/10 text-cyan">
        <Heart size={20} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="heading">{copy.title}</h2>
        <p className="body">{copy.body}</p>
      </div>
      <Link to="/">
        <Button variant="secondary">Browse games</Button>
      </Link>
    </div>
  );
}
