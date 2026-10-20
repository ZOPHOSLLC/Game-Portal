// Central configuration. The site is static; the only backend is the API.
// Set VITE_API_BASE at build time for production (e.g. https://api.example.com).
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
// Shows technical details (such as the API address) only in development.
export const SHOW_DEV_DETAILS = import.meta.env.DEV;

// Your ad network's script URL. Empty = no script loads, the slots show as
// placeholders. Paste the URL here when you have it.
export const AD_SCRIPT_URL = import.meta.env.VITE_AD_SCRIPT_URL || '';

// Hosts allowed inside the game iframe. Anything else is refused.
export const ALLOWED_EMBED_HOSTS = [
  'html5.gamemonetize.co',
  'gamemonetize.co',
  'html5.gamemonetize.com',
  'gamemonetize.com',
  'play.gamepix.com',
  'gamepix.com',
];
