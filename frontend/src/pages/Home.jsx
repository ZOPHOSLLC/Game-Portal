import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { api } from '../lib/api.js';
import { useLibrary } from '../lib/library.js';
import { API_BASE, SHOW_DEV_DETAILS } from '../config.js';
import GameRow from '../components/GameRow.jsx';

// Same tab order as the HTML site. Popular, New and Trending show the full
// catalogue, exactly as the old catalog.js did (the API has no ranking data yet).
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'favorite', label: 'Favorite' },
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'trending', label: 'Trending' },
];

const EMPTY_TEXT = {
  favorite: 'No favorites yet. Click the heart on a game to add it.',
  recent: 'Nothing played yet.',
  all: 'No games found.',
};

// Shared chip styling: idle and active states.
const CHIP_IDLE = 'border-line bg-surface text-muted hover:border-cyan hover:text-fg';
const CHIP_ACTIVE = 'border-cyan bg-cyan font-semibold text-ink';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'all';
  const category = params.get('category') || 'All';
  const query = (params.get('q') || '').trim().toLowerCase();
  const [genresOpen, setGenresOpen] = useState(false);
  const genreMenu = useRef(null);

  const [games, setGames] = useState(null);
  const [error, setError] = useState(null);
  const { favorites, recent } = useLibrary();

  useEffect(() => {
    let alive = true;
    api
      .games()
      .then((list) => alive && setGames(Array.isArray(list) ? list : []))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.title = 'My Game Portal';
  }, []);

  // Clicking outside the genre menu, or pressing Escape, closes it.
  useEffect(() => {
    if (!genresOpen) return undefined;
    function onClick(e) {
      if (genreMenu.current && !genreMenu.current.contains(e.target)) setGenresOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setGenresOpen(false);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [genresOpen]);

  const categories = useMemo(
    () => ['All', ...new Set((games || []).map((g) => g.category).filter(Boolean))],
    [games]
  );

  const visible = useMemo(() => {
    if (!games) return [];
    const byId = new Map(games.map((g) => [String(g.id), g]));
    let list;
    if (tab === 'favorite') list = favorites.map((id) => byId.get(id)).filter(Boolean);
    else if (tab === 'recent') list = recent.map((id) => byId.get(id)).filter(Boolean);
    else list = games.filter((g) => category === 'All' || g.category === category);
    return list.filter((g) => !query || (g.title || '').toLowerCase().includes(query));
  }, [games, tab, category, query, favorites, recent]);

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  }

  function pickTab(id) {
    update({ tab: id === 'all' ? null : id, category: null });
  }

  function pickGenre(name) {
    setGenresOpen(false);
    update({ tab: null, category: name === 'All' ? null : name });
  }

  const genreActive = tab === 'all' && category !== 'All';

  return (
    <div className="page flex flex-col gap-6">
      <h1 className="sr-only">Browse games</h1>
      <div role="tablist" aria-label="Browse games" className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => pickTab(t.id)}
            className={`chip ${tab === t.id ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            {t.label}
          </button>
        ))}

        <div ref={genreMenu} className="relative">
          <button
            type="button"
            aria-expanded={genresOpen}
            aria-controls="genre-menu-panel"
            onClick={() => setGenresOpen((open) => !open)}
            className={`chip ${genreActive ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            {genreActive ? category : 'More'}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {genresOpen && (
            <div
              id="genre-menu-panel"
              className="absolute top-10 left-0 z-20 flex w-60 flex-col gap-1 rounded-xl border border-line bg-surface p-2 shadow-lift"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickGenre(c)}
                  className={`h-8 rounded-lg px-3 text-left text-sm leading-5 transition hover:bg-surface-hover hover:text-cyan ${
                    c === category ? 'text-cyan' : 'text-muted'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="caption">{games ? `${visible.length} games loaded` : ''}</p>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm leading-5 text-red-300">
          {SHOW_DEV_DETAILS ? <>Could not load games: {error}. Is the API running at <code>{API_BASE}</code>?</> : 'The games could not be loaded. Please try again in a moment.'}
        </div>
      )}

      {!games && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-line bg-surface sm:h-36" />
          ))}
        </div>
      )}

      {games && visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm leading-6 text-muted">
          {query ? 'No games match your search.' : EMPTY_TEXT[tab] || EMPTY_TEXT.all}
        </div>
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((game) => (
            <GameRow key={game.id} game={game} isFavorite={favorites.includes(String(game.id))} />
          ))}
        </div>
      )}
    </div>
  );
}
