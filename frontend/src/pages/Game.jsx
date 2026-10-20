import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Minimize2, Play } from 'lucide-react';
import { api } from '../lib/api.js';
import { gamePath, isAllowedEmbed, slugify } from '../lib/slug.js';
import { addRecent, toggleFavorite, useLibrary } from '../lib/library.js';
import { useAuth } from '../lib/auth.jsx';
import { ALLOWED_EMBED_HOSTS, API_BASE, SHOW_DEV_DETAILS } from '../config.js';
import Button from '../components/Button.jsx';
import GameRow from '../components/GameRow.jsx';
import GameInfo from '../components/GameInfo.jsx';
import GameToolbar, { GameActions } from '../components/GameToolbar.jsx';

export default function Game() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const legacyId = params.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const frameWrap = useRef(null);
  // Full screen hides the rest of the page, so the frame gets its own exit button.
  const [fullscreenOn, setFullscreenOn] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreenOn(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const { favorites } = useLibrary();

  // Reload when someone signs in or out, so the viewer's own vote and rating are right.
  useEffect(() => {
    let alive = true;
    api
      .games()
      .then((list) => alive && setCatalog(Array.isArray(list) ? list : []))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [userId]);

  const game = useMemo(() => {
    if (!catalog) return null;
    return legacyId
      ? catalog.find((g) => String(g.id) === legacyId) || null
      : catalog.find((g) => slugify(g.title) === slug) || null;
  }, [catalog, legacyId, slug]);

  // Old links (?id=...) move to the readable URL.
  useEffect(() => {
    if (game && legacyId) navigate(gamePath(game), { replace: true });
  }, [game, legacyId, navigate]);

  useEffect(() => {
    document.title = game ? `${game.title} | My Game Portal` : 'My Game Portal';
  }, [game]);

  // Stop playing when the game changes (e.g. clicking a "Play next" card).
  useEffect(() => setPlaying(false), [slug]);

  const related = useMemo(() => {
    if (!catalog || !game) return [];
    const others = catalog.filter((g) => String(g.id) !== String(game.id));
    const same = others.filter((g) => g.category === game.category);
    return [...same, ...others.filter((g) => !same.includes(g))].slice(0, 12);
  }, [catalog, game]);

  if (error) {
    return <Message title="Could not load the game list" body={SHOW_DEV_DETAILS ? `${error}. Is the API running at ${API_BASE}?` : "The game list is not available right now. Please try again in a moment."} />;
  }
  if (!catalog) {
    return <div className="page body">Loading game…</div>;
  }
  if (!game) {
    return <Message title="Game not found" body={`No game matches "${slug}".`} />;
  }
  if (!isAllowedEmbed(game.url, ALLOWED_EMBED_HOSTS)) {
    return <Message title={game.title} body="This game has no valid link on file." />;
  }

  const isFavorite = favorites.includes(String(game.id));
  const description = (game.description || '').trim();
  const iframeAllow = String(game.id).startsWith('gm-')
    ? 'autoplay; fullscreen; focus-without-user-activation; monetization'
    : 'autoplay; fullscreen';

  function play() {
    addRecent(game.id);
    setPlaying(true);
  }

  // Replaces this one game in the list with the server's new copy (new counts, new vote).
  function replaceGame(updated) {
    setCatalog((list) => list.map((g) => (String(g.id) === String(updated.id) ? updated : g)));
  }

  async function vote(value) {
    if (!user) return;
    try {
      const { game: updated } = await api.vote(game.id, game.myVote === value ? null : value);
      replaceGame(updated);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function rate(stars) {
    if (!user) return;
    try {
      const { game: updated } = await api.rate(game.id, stars);
      replaceGame(updated);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameWrap.current?.requestFullscreen();
    } catch (err) {
      console.error('Full screen failed:', err);
    }
  }

  async function share() {
    const url = new URL(gamePath(game), window.location.origin).toString();
    // Use the system share sheet when there is one. If the person closes it, do nothing.
    if (navigator.share) {
      try {
        await navigator.share({ title: game.title, text: `Play ${game.title} free`, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    // Otherwise copy the link, and say what happened either way.
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Link copied to your clipboard.');
    } catch {
      setNotice('Could not copy automatically. Copy the link from the address bar.');
    }
    setTimeout(() => setNotice(''), 3000);
  }

  return (
    <div className="page grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-8">
        <nav aria-label="Breadcrumb" className="caption flex items-center gap-2">
          <Link to="/" className="hover:text-fg">
            Games
          </Link>
          <span aria-hidden="true">/</span>
          <span>{game.category || 'Game'}</span>
        </nav>

        <section className="card overflow-hidden p-0">
          <div className="frame-bezel p-4">
            <div ref={frameWrap} className="relative aspect-video overflow-hidden rounded-xl bg-black">
              {fullscreenOn && (
                <button
                  type="button"
                  onClick={fullscreen}
                  className="absolute top-3 right-3 z-10 inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-ink/90 px-3 text-xs leading-4 font-medium text-fg transition hover:bg-surface-hover"
                >
                  <Minimize2 size={14} aria-hidden="true" />
                  Exit full screen
                </button>
              )}
              {playing ? (
                <iframe title={game.title} src={game.url} allow={iframeAllow} className="size-full border-0" />
              ) : (
                <button
                  type="button"
                  onClick={play}
                  className="group absolute inset-0 grid place-items-center content-center gap-4 overflow-hidden bg-ink bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.12),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,255,255,0.10),transparent_50%)]"
                  aria-label={`Play ${game.title}`}
                >
                  {game.thumb && (
                    <img
                      src={game.thumb}
                      alt=""
                      className="absolute inset-0 size-full object-cover opacity-40 transition duration-500 group-hover:scale-105 group-hover:opacity-50"
                    />
                  )}
                  <span className="relative inline-flex h-12 items-center gap-2 rounded-lg bg-cyan px-6 text-base leading-6 font-semibold text-ink shadow-lg transition group-hover:brightness-110">
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                    Click to Play
                  </span>
                  <span className="relative caption">Click to load the game instantly in your browser</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-line p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <h1 className="title truncate">{game.title}</h1>
                <span className="badge self-start">{game.category || 'Game'}</span>
              </div>
              <GameActions
                isFavorite={isFavorite}
                onFavorite={() => toggleFavorite(game.id)}
                onFullscreen={fullscreen}
                onShare={share}
              />
            </div>
            <GameToolbar game={game} user={user} onVote={vote} onRate={rate} />
            <p aria-live="polite" className="caption empty:hidden">
              {notice}
            </p>
          </div>

          <GameInfo game={game} />
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="heading">About this game</h2>
          {description ? (
            <p className="body text-fg whitespace-pre-line">{description}</p>
          ) : (
            <p className="body">Play {game.title} free online, no download, no install.</p>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <h2 className="eyebrow">Play next</h2>
        <div className="flex flex-col gap-3">
          {related.map((g) => (
            <GameRow key={g.id} game={g} compact isFavorite={favorites.includes(String(g.id))} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function Message({ title, body }) {
  return (
    <div className="page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="title">{title}</h1>
      <p className="body">{body}</p>
      <Link to="/">
        <Button>Browse games</Button>
      </Link>
    </div>
  );
}
