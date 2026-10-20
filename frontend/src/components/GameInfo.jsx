import { formatCount, hostLabel } from '../lib/format.js';

// Game facts in a two-column list, like CrazyGames. Rating and votes come from what
// players did (they are never typed in by admin). The other rows only show when
// the game has that value.
export default function GameInfo({ game }) {
  const likes = game.likes ?? 0;
  const dislikes = game.dislikes ?? 0;
  const ratingCount = game.ratingCount ?? 0;

  const rows = [
    {
      label: 'Rating',
      value:
        game.rating != null ? (
          <span>
            <span className="font-semibold text-fg">{Number(game.rating).toFixed(1)}</span>
            <span className="text-muted"> / 5 · {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</span>
          </span>
        ) : (
          'No ratings yet'
        ),
    },
    {
      label: 'Votes',
      value:
        likes + dislikes > 0
          ? `${formatCount(likes)} likes and ${formatCount(dislikes)} dislikes`
          : 'No votes yet',
    },
    game.released && { label: 'Released', value: game.released },
    game.engine && { label: 'Game engine', value: game.engine },
    game.platforms?.length > 0 && { label: 'Platforms', value: game.platforms.join(', ') },
    game.wikiLinks?.length > 0 && {
      label: 'Wiki pages',
      value: (
        <span className="flex flex-wrap gap-x-2">
          {game.wikiLinks.map((link, i) => (
            <span key={link} className="flex gap-2">
              {i > 0 && <span className="text-muted">/</span>}
              <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-cyan hover:underline">
                {hostLabel(link)}
              </a>
            </span>
          ))}
        </span>
      ),
    },
  ].filter(Boolean);

  const tags = game.tags ?? [];

  return (
    <div className="flex flex-col gap-6 border-t border-line p-6">
      <dl className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-x-6 gap-y-3 text-sm leading-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="min-w-0 text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>

      {tags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="eyebrow">Tags</h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="chip border-line bg-ink text-muted">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
