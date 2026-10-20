# Game Portal (frontend)

This repository is the frontend of a browser game portal: the website people use to browse, play, and save free games. It is written in React and built with Vite and Tailwind CSS. There is no server code here. You connect the site to your own API, described below.

## What it includes

- A single-page React app, so moving between screens is fast after the first visit.
- One set of colors, spacing, and text sizes, used on every page.
- A game page with a player, a Favorite button, Full screen, Share, likes and dislikes, a five-star rating, game details (rating, votes, release date, engine, platforms, wiki links, and tags), a description, and a list of games to play next.
- Accounts: sign up, sign in, email verification, forgot and reset password, and a settings page. Each change, such as a new username, email, or password, opens a dialog that asks for the account password first.
- Two-step sign-in with an authenticator app, including setup with a QR code and recovery codes.
- A library page with a "continue playing" card, favorites, recently played games, search, and sorting.
- Ad slots on the home page and game pages. They show as placeholders until you add an ad script.
- An admin page for adding, editing, and deleting games. Only accounts with the admin role can open it.
- Layouts for phones, tablets, and desktops.

The Popular, New, and Trending tabs show the full catalog for now, because the API does not provide ranking data yet.

## Running it on your computer

You need Node.js 22 or newer.

```
cd frontend
npm install
```

Copy the file `.env.example` to `.env.local`, then run:

```
npm run dev
```

Open http://localhost:5173. By default the site talks to an API at http://localhost:3000. Change `VITE_API_BASE` in `.env.local` if your API runs somewhere else.

## Connecting your own API

The frontend does not include a server. Your API needs these routes:

- Games: `GET /api/games`. Admin only: `POST /api/games`, `PUT /api/games/:id`, `DELETE /api/games/:id`.
- Game actions: `POST /api/games/:id/favorite`, `POST /api/games/:id/vote`, `POST /api/games/:id/rate`.
- Accounts: `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/verify`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot`, `POST /api/auth/reset`.
- Account settings: `PATCH /api/account/profile`, `POST /api/account/password`, `POST /api/account/email`, `POST /api/account/delete`, `POST /api/account/2fa/start`, `POST /api/account/2fa/enable`, `POST /api/account/2fa/disable`.

The frontend sends cookies with every request, so the API must:

- allow the frontend's address in its CORS settings, with credentials turned on
- set the session cookie as HttpOnly, Secure, and SameSite=None when the frontend and the API are on different domains. If they share a parent domain, such as app.example.com and api.example.com, SameSite=Lax also works.

The response fields the frontend reads are listed in `src/lib/api.js` and `src/lib/auth.jsx`. Check those files if your API returns different names.

## Building for production and hosting on Cloudflare Pages

The production build needs the address of your API. It fails without one, so visitors are never sent to localhost by mistake.

In Cloudflare Pages, connect this repository and use these settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE`, set to your API address, for example `https://api.example.com`

The file `public/_redirects` makes links such as `/game/some-game` work after a refresh. Cloudflare Pages reads it automatically.

## Replacing the placeholders

The logo, favicon, and app icons in `public/` are neutral placeholders. Replace `public/favicon.svg`, `public/icon-192.png`, and `public/icon-512.png` with your own files. The name shown in the header is set in `src/components/Header.jsx`, and the footer text is in `src/App.jsx`.

## Project layout

- `src/pages`: the screens (home, game, library, settings, admin, sign in, and the account pages)
- `src/components`: shared parts such as the header, game cards, dialogs, and the account menu
- `src/lib`: the API client, sign-in state, favorites, validation rules, and helpers
- `src/styles.css`: colors, spacing, and text sizes

## License

MIT. See [LICENSE](LICENSE).