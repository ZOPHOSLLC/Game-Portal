// Turns a game title into a URL segment: "Sample Game!" becomes "sample-game".
export function slugify(text) {
  return (
    String(text ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'game'
  );
}

// Public game page path. The internal id never appears in the URL.
export function gamePath(game) {
  return `/game/${slugify(game.title)}`;
}

// True when the game's URL may be loaded in the iframe.
export function isAllowedEmbed(url, allowedHosts) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return parsed.pathname.startsWith('/games/') && !parsed.pathname.includes('..');
    }
    if (parsed.protocol !== 'https:') return false;
    return allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
