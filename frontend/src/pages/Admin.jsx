import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import Button from '../components/Button.jsx';

const EMPTY_FORM = {
  id: '',
  title: '',
  category: '',
  thumb: '',
  url: '',
  source: '',
  description: '',
  released: '',
  engine: '',
  platforms: '',
  wikiLinks: '',
  tags: '',
};

// Turns a saved game into form values. Lists become comma-separated text, empty numbers become ''.
function toFormValues(game) {
  const text = (v) => (v == null ? '' : String(v));
  return {
    ...EMPTY_FORM,
    ...game,
    url: game.url || game.gameUrl || '',
    released: text(game.released),
    engine: text(game.engine),
    platforms: (game.platforms || []).join(', '),
    wikiLinks: (game.wikiLinks || []).join(', '),
    tags: (game.tags || []).join(', '),
  };
}

// Admin uses a normal account with the admin role. Anyone else is turned away here,
// and the server checks the role again on every change.
export default function Admin() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin | My Game Portal';
  }, []);

  if (!ready) return <div className="page body">Loading…</div>;

  if (!user) {
    return (
      <Gate
        title="Admin"
        body="Sign in with an admin account to manage games."
        action={
          <Link to="/login?next=/admin">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  if (user.role !== 'admin') {
    return (
      <Gate
        title="Not allowed"
        body={`${user.username} does not have admin access.`}
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              navigate('/login?next=/admin');
            }}
          >
            Sign in with another account
          </Button>
        }
      />
    );
  }

  return (
    <GameManager
      onLogout={async () => {
        await logout();
        navigate('/');
      }}
    />
  );
}

function Gate({ title, body, action }) {
  return (
    <div className="page flex flex-col items-center gap-6 py-24 text-center">
      <h1 className="title">{title}</h1>
      <p className="body">{body}</p>
      {action}
    </div>
  );
}

function GameManager({ onLogout }) {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = closed, otherwise the form state
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      setGames(await api.games());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { id, ...fields } = form;
    try {
      if (id) await api.updateGame(id, fields);
      else await api.createGame(fields);
      setForm(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(game) {
    if (!window.confirm(`Delete "${game.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteGame(game.id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="page flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="title">Games</h1>
          <p className="body">{games ? `${games.length} in the catalogue` : 'Loading…'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onLogout}>
            Sign out
          </Button>
          <Button onClick={() => setForm({ ...EMPTY_FORM })}>
            <Plus size={16} />
            Add game
          </Button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm leading-5 text-red-300">{error}</p>
      )}

      {form && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <h2 className="heading sm:col-span-2">{form.id ? 'Edit game' : 'New game'}</h2>
          <Field label="Title *">
            <input className="field" required {...field('title')} />
          </Field>
          <Field label="Category">
            <input className="field" {...field('category')} />
          </Field>
          <Field label="Game URL *" className="sm:col-span-2">
            <input className="field" required placeholder="/games/my-game/index.html or https://…" {...field('url')} />
          </Field>
          <Field label="Thumbnail URL">
            <input className="field" {...field('thumb')} />
          </Field>
          <Field label="Source">
            <input className="field" {...field('source')} />
          </Field>
          <Field label="Released">
            <input className="field" placeholder="May 2016" {...field('released')} />
          </Field>
          <Field label="Game engine">
            <input className="field" placeholder="HTML5" {...field('engine')} />
          </Field>
          <Field label="Platforms">
            <input className="field" placeholder="Browser (desktop, mobile), iOS, Android" {...field('platforms')} />
          </Field>
          <Field label="Wiki links" className="sm:col-span-2">
            <input className="field" placeholder="https://en.wikipedia.org/wiki/…, https://…fandom.com/…" {...field('wikiLinks')} />
          </Field>
          <Field label="Tags" className="sm:col-span-2">
            <input className="field" placeholder="Arcade, One Button, Casual" {...field('tags')} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              className="field h-auto resize-y py-2"
              rows={5}
              placeholder="Shown under the game on its page. Plain text; blank lines start new paragraphs."
              {...field('description')}
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save game'}
            </Button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-ink">
            <tr>
              <th className="eyebrow px-4 py-3 font-medium">Title</th>
              <th className="eyebrow px-4 py-3 font-medium">Category</th>
              <th className="eyebrow hidden px-4 py-3 font-medium md:table-cell">Source</th>
              <th className="eyebrow hidden px-4 py-3 font-medium lg:table-cell">URL</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(games || []).map((g) => (
              <tr key={g.id} className="hover:bg-ink/60">
                <td className="px-4 py-3 text-sm leading-5 font-medium text-fg">{g.title}</td>
                <td className="px-4 py-3 text-sm leading-5 text-muted">{g.category || 'none'}</td>
                <td className="hidden px-4 py-3 text-sm leading-5 text-muted md:table-cell">{g.source || 'none'}</td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-sm leading-5 text-muted lg:table-cell">{g.url}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit ${g.title}`}
                      onClick={() => setForm(toFormValues(g))}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" aria-label={`Delete ${g.title}`} onClick={() => remove(g)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {games && games.length === 0 && (
              <tr>
                <td colSpan={5} className="body px-4 py-10 text-center">
                  No games yet. Add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm leading-5 font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}
