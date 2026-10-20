import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Download, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import QRCode from 'qrcode';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { emailError, passwordChecks, passwordError, usernameError } from '../lib/rules.js';

// Settings is one scrolling page. Every value shows as a row with an Edit button.
// Editing opens a dialog that shows exactly what will change and asks for the account
// password before anything is saved. Nothing sensitive is editable inline.
const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'account', label: 'Account', icon: Mail },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'delete', label: 'Delete account', icon: AlertTriangle },
];

const fullDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

export default function Settings() {
  const { user, ready } = useAuth();
  const signedIn = Boolean(user);
  const [active, setActive] = useState('profile');
  const [editing, setEditing] = useState(null); // which dialog is open, e.g. 'username'

  // Highlight the section nearest the top of the screen.
  useEffect(() => {
    if (!signedIn) return undefined;
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView();
    return () => observer.disconnect();
  }, [signedIn]);

  useEffect(() => {
    document.title = 'Settings | My Game Portal';
  }, []);

  if (!ready) return <div className="page body">Loading…</div>;
  if (!user) return <Navigate to="/login?next=/settings" replace />;

  const close = () => setEditing(null);

  return (
    <div className="page grid min-w-0 grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="On this page" className="min-w-0 md:sticky md:top-24 md:self-start">
        <p className="eyebrow mb-3 hidden md:block">On this page</p>
        <ul className="sticky top-16 z-10 -mx-4 flex gap-1 overflow-x-auto bg-ink/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:flex-col md:overflow-visible md:bg-transparent md:p-0 md:backdrop-blur-none">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={active === id ? 'true' : undefined}
                className={`flex h-9 items-center gap-3 rounded-lg px-3 text-sm leading-5 font-medium transition ${
                  active === id ? 'bg-surface text-fg' : 'text-muted hover:bg-surface hover:text-fg'
                } ${id === 'delete' ? 'md:mt-4' : ''}`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-10">
        <ProfileHeader />

        <Section id="profile" title="Profile" description="How other players see you.">
          <Row title="Username" description="3 to 24 letters, numbers, or underscores." value={user.username}>
            <Button variant="secondary" size="sm" onClick={() => setEditing('username')}>
              Edit
            </Button>
          </Row>
          <Row title="Member since" value={fullDate(user.createdAt)} />
        </Section>

        <Section id="account" title="Account" description="Your sign-in email and password.">
          <Row
            title="Email address"
            description={
              user.emailVerified
                ? 'Verified. Used to sign in and for account messages.'
                : 'Not verified yet. Until you verify, you cannot like, rate, or review games.'
            }
            value={user.email}
          >
            <Button variant="secondary" size="sm" onClick={() => setEditing('email')}>
              Edit
            </Button>
          </Row>
          {!user.emailVerified && <ResendVerification />}
          <Row title="Password" description="Use a password you do not use anywhere else." value="••••••••••">
            <Button variant="secondary" size="sm" onClick={() => setEditing('password')}>
              Edit
            </Button>
          </Row>
        </Section>

        <Section id="security" title="Security" description="Extra protection for your sign-in.">
          <Row
            title="Two-step sign-in"
            description="Ask for a code from an authenticator app every time you sign in, in addition to your password."
            value={
              user.twoFactor ? (
                <span className="inline-flex items-center gap-2 text-cyan">
                  <CheckCircle2 size={14} aria-hidden="true" /> On
                </span>
              ) : (
                'Off'
              )
            }
          >
            <Button variant="secondary" size="sm" onClick={() => setEditing('2fa')}>
              {user.twoFactor ? 'Turn off' : 'Set up'}
            </Button>
          </Row>
        </Section>

        <DeleteSection onOpen={() => setEditing('delete')} />
      </div>

      {editing === 'username' && <UsernameDialog onClose={close} />}
      {editing === 'email' && <EmailDialog onClose={close} />}
      {editing === 'password' && <PasswordDialog onClose={close} />}
      {editing === '2fa' && <TwoFactorDialog onClose={close} />}
      {editing === 'delete' && <DeleteDialog onClose={close} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

// The top of the page: who is signed in, and the state of the email and the two-step sign-in.
function ProfileHeader() {
  const { user } = useAuth();
  return (
    <header className="card flex flex-wrap items-center gap-5">
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-cyan text-2xl leading-8 font-semibold text-ink">
        {user.username.charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="title truncate">{user.username}</h1>
        <p className="body truncate">{user.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill on={user.emailVerified} onText="Email verified" offText="Email not verified" />
        <Pill on={user.twoFactor} onText="Two-step sign-in on" offText="Two-step sign-in off" />
      </div>
    </header>
  );
}

function Pill({ on, onText, offText }) {
  return on ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs leading-4 font-medium text-cyan">
      <CheckCircle2 size={14} aria-hidden="true" />
      {onText}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs leading-4 font-medium text-muted">
      {offText}
    </span>
  );
}

// A section: a heading above one card.
function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-32 flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="heading">{title}</h2>
        {description && <p className="caption">{description}</p>}
      </div>
      <div className="card divide-y divide-line overflow-hidden p-0">{children}</div>
    </section>
  );
}

// One setting: title and explanation on the left; current value and action on the right.
function Row({ title, description, value, children }) {
  return (
    <div className="grid gap-3 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm leading-5 font-medium text-fg">{title}</span>
        {description && <span className="caption">{description}</span>}
      </div>
      {(value !== undefined || children) && (
        <div className="flex min-w-0 items-center justify-between gap-4 md:justify-end">
          {value !== undefined && <span className="min-w-0 truncate text-sm leading-5 text-muted">{value}</span>}
          {children}
        </div>
      )}
    </div>
  );
}

// A dialog's footer: cancel and the confirm button.
function DialogFooter({ onClose, busy, disabled, confirmLabel, busyLabel, variant = 'primary' }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button type="submit" variant={variant} disabled={busy || disabled}>
        {busy ? busyLabel : confirmLabel}
      </Button>
    </div>
  );
}

// Shows "from → to" so the person sees exactly what will change before they confirm.
function Change({ label, from, to }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-ink/60 p-4 text-sm leading-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted line-through">{from}</span>
        <span aria-hidden="true" className="text-muted">
          →
        </span>
        <span className="font-medium text-fg">{to || 'none'}</span>
      </div>
    </div>
  );
}

function ResendVerification() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true);
    try {
      await api.resendVerification();
      setMessage('A new verification link is on its way.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
      <span className="caption">{message || 'Did not get the verification email?'}</span>
      <Button variant="ghost" size="sm" onClick={resend} disabled={busy}>
        Send it again
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit dialogs. Each one asks for the password before it saves.
// ---------------------------------------------------------------------------

function UsernameDialog({ onClose }) {
  const { user, reload } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const problem = usernameError(username.trim());
  const unchanged = username.trim() === user.username;

  async function submit(e) {
    e.preventDefault();
    if (problem || unchanged || !password) return;
    setBusy(true);
    setError('');
    try {
      await api.updateProfile(username.trim(), password);
      await reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal open title="Change username" description="Your username is shown next to your games and reviews." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Change label="Username" from={user.username} to={username.trim()} />
        <label className="flex flex-col gap-2">
          <span className="text-sm leading-5 font-medium text-fg">New username</span>
          <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} aria-invalid={Boolean(username && problem)} />
          {username && problem && <span className="text-xs leading-4 text-red-400">{problem}</span>}
        </label>
        <PasswordField label="Your account password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p role="alert" className="text-sm leading-5 text-red-300">{error}</p>}
        <DialogFooter onClose={onClose} busy={busy} disabled={!password || unchanged || Boolean(problem)} confirmLabel="Save username" busyLabel="Saving…" />
      </form>
    </Modal>
  );
}

function EmailDialog({ onClose }) {
  const { user, reload } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const problem = email ? emailError(email.trim()) : '';

  async function submit(e) {
    e.preventDefault();
    if (!email || problem || !password) return;
    setBusy(true);
    setError('');
    try {
      await api.changeEmail(password, email.trim());
      await reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Change email address"
      description="We will send a verification link to the new address. Your other devices will be signed out."
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Change label="Email address" from={user.email} to={email.trim()} />
        <label className="flex flex-col gap-2">
          <span className="text-sm leading-5 font-medium text-fg">New email address</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            aria-invalid={Boolean(problem)}
          />
          {problem && <span className="text-xs leading-4 text-red-400">{problem}</span>}
        </label>
        <PasswordField label="Your account password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p role="alert" className="text-sm leading-5 text-red-300">{error}</p>}
        <DialogFooter onClose={onClose} busy={busy} disabled={!email || !password || Boolean(problem)} confirmLabel="Change email" busyLabel="Saving…" />
      </form>
    </Modal>
  );
}

function PasswordDialog({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const nextProblem = next ? passwordError(next) : '';
  const confirmProblem = confirm && confirm !== next ? 'The two passwords do not match.' : '';
  const ready = current && next && confirm && !nextProblem && !confirmProblem;

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await api.changePassword(current, next);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal open title="Change password" description="Your other devices will be signed out after you change it." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <PasswordField label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <div className="flex flex-col gap-2">
          <PasswordField label="New password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" error={next ? nextProblem : ''} />
          <ul className="flex flex-col gap-1">
            {passwordChecks(next).map((check) => (
              <li key={check.label} className={`text-xs leading-4 ${check.ok ? 'text-cyan' : 'text-muted'}`}>
                {check.label}
              </li>
            ))}
          </ul>
        </div>
        <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" error={confirm ? confirmProblem : ''} />
        {error && <p role="alert" className="text-sm leading-5 text-red-300">{error}</p>}
        <DialogFooter onClose={onClose} busy={busy} disabled={!ready} confirmLabel="Change password" busyLabel="Saving…" />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Two-step sign-in: turn on (password, scan, confirm, recovery codes) or turn off
// ---------------------------------------------------------------------------

function TwoFactorDialog({ onClose }) {
  const { user, reload } = useAuth();
  // Steps: 'password' → 'scan' → 'codes' when turning on; 'off' when turning off.
  const [step, setStep] = useState(user.twoFactor ? 'off' : 'password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null); // { secret, qr }
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  async function startSetup(e) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const { secret, uri } = await api.startTwoFactor(password);
      const qr = await QRCode.toDataURL(uri, { width: 200, margin: 1 });
      setSetup({ secret, qr });
      setStep('scan');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { recoveryCodes: codes } = await api.enableTwoFactor(code.trim());
      setRecoveryCodes(codes);
      await reload();
      setStep('codes');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff(e) {
    e.preventDefault();
    if (!password || !code.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.disableTwoFactor(password, code.trim());
      await reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Could not copy. Select the text and copy it by hand.');
    }
  }

  function downloadCodes() {
    const blob = new Blob(
      [`My Game Portal recovery codes for ${user.email}\nEach code works once.\n\n${recoveryCodes.join('\n')}\n`],
      { type: 'text/plain' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-game-portal-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const errorLine = error && (
    <p role="alert" className="text-sm leading-5 text-red-300">
      {error}
    </p>
  );

  if (step === 'password') {
    return (
      <Modal open title="Turn on two-step sign-in" description="Confirm it is you first." onClose={onClose}>
        <form onSubmit={startSetup} noValidate className="flex flex-col gap-5">
          <PasswordField label="Your account password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {errorLine}
          <DialogFooter onClose={onClose} busy={busy} disabled={!password} confirmLabel="Continue" busyLabel="Please wait…" />
        </form>
      </Modal>
    );
  }

  if (step === 'scan' && setup) {
    return (
      <Modal open title="Add to your authenticator app" description="Scan the code with Google Authenticator, Microsoft Authenticator, 1Password, or a similar app." onClose={onClose}>
        <form onSubmit={confirmSetup} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <img src={setup.qr} alt="Scan this code with your authenticator app" width="200" height="200" className="rounded-lg bg-white p-2" />
            <div className="flex w-full flex-col gap-2">
              <span className="caption">Cannot scan it? Type this key into the app:</span>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-fg">
                  {setup.secret}
                </code>
                <Button variant="secondary" size="sm" onClick={() => copy(setup.secret, 'key')}>
                  <Copy size={14} aria-hidden="true" />
                  {copied === 'key' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm leading-5 font-medium text-fg">Enter the 6-digit code from the app</span>
            <input
              className="field text-center font-mono text-lg tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
            />
          </label>
          {errorLine}
          <DialogFooter onClose={onClose} busy={busy} disabled={!code.trim()} confirmLabel="Turn on" busyLabel="Checking…" />
        </form>
      </Modal>
    );
  }

  if (step === 'codes') {
    return (
      <Modal open title="Save your recovery codes" description="Each code works once. Use one if you lose your phone. They will not be shown again." onClose={onClose}>
        <div className="flex flex-col gap-5">
          <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-ink p-4 font-mono text-sm text-fg">
            {recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => copy(recoveryCodes.join('\n'), 'codes')}>
              <Copy size={14} aria-hidden="true" />
              {copied === 'codes' ? 'Copied' : 'Copy all'}
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadCodes}>
              <Download size={14} aria-hidden="true" />
              Download
            </Button>
          </div>
          {errorLine}
          <div className="flex justify-end">
            <Button onClick={onClose}>I have saved them</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Turning off.
  return (
    <Modal open title="Turn off two-step sign-in" description="Your account will then sign in with a password only." onClose={onClose}>
      <form onSubmit={turnOff} noValidate className="flex flex-col gap-5">
        <PasswordField label="Your account password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm leading-5 font-medium text-fg">
            <KeyRound size={14} aria-hidden="true" />
            Authenticator code or recovery code
          </span>
          <input className="field font-mono" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" placeholder="123456" />
        </label>
        {errorLine}
        <DialogFooter onClose={onClose} busy={busy} disabled={!password || !code.trim()} confirmLabel="Turn off" busyLabel="Turning off…" variant="danger" />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------

function DeleteSection({ onOpen }) {
  const { user } = useAuth();
  return (
    <section id="delete" className="scroll-mt-32 flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="heading text-red-300">Delete account</h2>
        <p className="caption">This cannot be undone after 7 days.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-red-500/40 bg-surface">
        <Row
          title="Delete your account"
          description={
            user.deleteAt
              ? `Scheduled for deletion on ${fullDate(user.deleteAt)}. Signing in again cancels it.`
              : 'Your favorites, likes, and ratings are removed too. Signing in again within 7 days cancels it.'
          }
        >
          <Button variant="danger" size="sm" onClick={onOpen}>
            Delete account
          </Button>
        </Row>
      </div>
    </section>
  );
}

function DeleteDialog({ onClose }) {
  const { user, reload, announce } = useAuth();
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const matches = typed === user.username;

  async function submit(e) {
    e.preventDefault();
    if (!matches || !password) return;
    setBusy(true);
    setError('');
    try {
      const body = await api.deleteAccount(typed, password);
      announce(`Your account is scheduled for deletion on ${fullDate(body.deleteAt)}. Sign in again before then to cancel it.`);
      await reload();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal open title="Delete your account?" description="Your favorites, likes, and ratings will be removed after 7 days. Signing in again within those 7 days cancels it." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm leading-5 text-fg">
            Type <span className="font-semibold">{user.username}</span> to confirm
          </span>
          <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </label>
        <PasswordField label="Your account password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p role="alert" className="text-sm leading-5 text-red-300">{error}</p>}
        <DialogFooter onClose={onClose} busy={busy} disabled={!matches || !password} confirmLabel="Delete my account" busyLabel="Scheduling…" variant="danger" />
      </form>
    </Modal>
  );
}
