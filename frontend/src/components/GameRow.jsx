import { Link } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import { gamePath } from '../lib/slug.js';
import { addRecent, toggleFavorite } from '../lib/library.js';

// Horizontal game card. The whole card is one link (stretched); the heart sits
// above it so it can be pressed without opening the game.
// compact = the "Play next" rail: shorter, smaller type, no call to action.
export default function GameRow({ game, isFavorite = false, compact = false }) {
  const title = game.title || 'Untitled game';
  return (
    <article
      className={`group relative flex overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${
        compact ? 'h-24' : 'h-32 sm:h-36'
      }`}
    >
      <div className={`shrink-0 overflow-hidden bg-ink ${compact ? 'w-32' : 'w-40 sm:w-56'}`}>
        {game.thumb ? (
          <img
            src={game.thumb}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="flex min-w-0 flex-col gap-2 pr-8">
          <span className="badge self-start">{game.category || 'Game'}</span>
          <h3 className={`font-semibold text-fg ${compact ? 'truncate text-sm leading-5' : 'card-title line-clamp-2'}`}>{title}</h3>
        </div>
        {!compact && (
          <span className="inline-flex items-center gap-2 text-sm leading-5 font-medium text-cyan">
            <Play size={14} fill="currentColor" aria-hidden="true" />
            Play now
          </span>
        )}
      </div>

      <Link
        to={gamePath(game)}
        onClick={() => addRecent(game.id)}
        aria-label={`Play ${title}`}
        className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      />

      <button
        type="button"
        onClick={() => toggleFavorite(game.id)}
        aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        aria-pressed={isFavorite}
        className={`absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-lg border border-line bg-surface shadow-sm transition hover:bg-surface-hover ${
          isFavorite ? 'text-red-500' : 'text-muted hover:text-fg'
        }`}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </article>
  );
}
