import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Maximize2, Share2, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import Button from './Button.jsx';
import { formatCount } from '../lib/format.js';

// Row under the title: like, dislike and star rating. Needs an account. Guests see a sign-in prompt.
export default function GameToolbar({ game, user, onVote, onRate }) {
  const [hoverStars, setHoverStars] = useState(0);
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);
  const shownStars = hoverStars || game.myRating || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          aria-pressed={game.myVote === 'up'}
          aria-label={`Like, ${formatCount(game.likes)} likes`}
          onClick={() => onVote('up')}
          className={game.myVote === 'up' ? 'border-cyan text-cyan' : ''}
        >
          <ThumbsUp size={16} fill={game.myVote === 'up' ? 'currentColor' : 'none'} aria-hidden="true" />
          {formatCount(game.likes)}
        </Button>
        <Button
          variant="secondary"
          aria-pressed={game.myVote === 'down'}
          aria-label={`Dislike, ${formatCount(game.dislikes)} dislikes`}
          onClick={() => onVote('down')}
          className={game.myVote === 'down' ? 'border-cyan text-cyan' : ''}
        >
          <ThumbsDown size={16} fill={game.myVote === 'down' ? 'currentColor' : 'none'} aria-hidden="true" />
          {formatCount(game.dislikes)}
        </Button>

        <div
          role="group"
          aria-label="Rate this game"
          onMouseLeave={() => setHoverStars(0)}
          className="flex h-10 items-center gap-0.5 rounded-lg border border-line bg-surface px-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} of 5`}
              aria-pressed={game.myRating === n}
              onMouseEnter={() => setHoverStars(n)}
              onFocus={() => setHoverStars(n)}
              onBlur={() => setHoverStars(0)}
              onClick={() => onRate(game.myRating === n ? null : n)}
              className="grid size-7 place-items-center rounded transition hover:scale-110"
            >
              <Star
                size={16}
                aria-hidden="true"
                className={n <= shownStars ? 'text-cyan' : 'text-muted'}
                fill={n <= shownStars ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
      </div>

      {user && !user.emailVerified && (
        <p className="caption">Verify your email to like, dislike, or rate games. Check your inbox for the link.</p>
      )}

      {!user && (
        <p className="caption">
          <Link to={`/login?next=${next}`} className="font-medium text-cyan hover:underline">
            Sign in
          </Link>{' '}
          to like, dislike, or rate this game.
        </p>
      )}
    </div>
  );
}

// Favorite, full screen and share. Guests can use all three.
export function GameActions({ isFavorite, onFavorite, onFullscreen, onShare }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onFavorite} aria-pressed={isFavorite}>
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-red-500' : ''} />
        {isFavorite ? 'Favorited' : 'Favorite'}
      </Button>
      <Button variant="secondary" onClick={onFullscreen}>
        <Maximize2 size={16} />
        Full screen
      </Button>
      <Button onClick={onShare}>
        <Share2 size={16} />
        Share
      </Button>
    </div>
  );
}
