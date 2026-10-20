import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { api } from '../lib/api.js';
import { emailError, passwordChecks, passwordError } from '../lib/rules.js';

// Shared card for the screens reached from an email link or a "forgot" request.
function Card({ title, children }) {
  return (
    <div className="page flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="card-lg flex w-full max-w-md flex-col gap-6">
        <h1 className="title text-center">{title}</h1>
        {children}
      </div>
    </div>
  );
}

// Opened from the link in the verification email.
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ status: 'working', error: '' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', error: 'This link is missing its code. Open the link from the email again.' });
      return;
    }
    api
      .verifyEmail(token)
      .then(() => setState({ status: 'done', error: '' }))
      .catch((err) => setState({ status: 'error', error: err.message }));
  }, [token]);

  return (
    <Card
      title={state.status === 'done' ? 'Email verified' : state.status === 'error' ? "We couldn't verify this link" : 'Verifying your email'}
    >
      {state.status === 'working' && <p className="body text-center">One moment…</p>}
      {state.status === 'done' && (
        <>
          <p className="body text-center">Your email is confirmed. You can now like, rate, and review games.</p>
          <Link to="/login" className="self-center">
            <Button>Sign in</Button>
          </Link>
        </>
      )}
      {state.status === 'error' && (
        <>
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-center text-sm leading-5 text-red-300">
            {state.error}
          </p>
          <Link to="/settings#account" className="self-center text-sm font-medium text-cyan hover:underline">
            Sign in and ask for a new link
          </Link>
        </>
      )}
    </Card>
  );
}

// Asks for a reset link. Always gives the same answer, whether or not the email has an account.
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (emailError(email.trim())) return;
    setBusy(true);
    setError('');
    try {
      setMessage((await api.forgotPassword(email.trim())).message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Reset your password">
      {message ? (
        <p className="body text-center">{message}</p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="body text-center">Enter the email you signed up with and we will send a reset link.</p>
          <label className="flex flex-col gap-2">
            <span className="text-sm leading-5 font-medium text-fg">Email</span>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={touched && Boolean(emailError(email.trim()))}
            />
            {touched && emailError(email.trim()) && (
              <span className="text-xs leading-4 text-red-400">{emailError(email.trim())}</span>
            )}
          </label>
          {error && <p role="alert" className="text-sm leading-5 text-red-300">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <Link to="/login" className="self-center text-sm font-medium text-cyan hover:underline">
        Back to sign in
      </Link>
    </Card>
  );
}

// Opened from the reset link. Choosing a new password signs out every device.
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const passwordProblem = passwordError(password);
  const confirmProblem = confirm && confirm !== password ? 'The two passwords do not match.' : '';

  async function submit(e) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (passwordProblem || confirmProblem) return;
    setBusy(true);
    setError('');
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Card title="Reset your password">
        <p role="alert" className="text-center text-sm leading-5 text-red-300">
          This link is missing its code. Open the link from the email again.
        </p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card title="Password changed">
        <p className="body text-center">Sign in with your new password. Your other devices have been signed out.</p>
        <Link to="/login" className="self-center">
          <Button>Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card title="Choose a new password">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched({ ...touched, password: true })}
          autoComplete="new-password"
          error={touched.password ? passwordProblem : ''}
        />
        <ul className="flex flex-col gap-1">
          {passwordChecks(password).map((check) => (
            <li key={check.label} className={`text-xs leading-4 ${check.ok ? 'text-cyan' : 'text-muted'}`}>
              {check.label}
            </li>
          ))}
        </ul>
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched({ ...touched, confirm: true })}
          autoComplete="new-password"
          error={touched.confirm ? confirmProblem : ''}
        />
        {error && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm leading-5 text-red-300">
            {error} <Link to="/forgot-password" className="font-medium underline">Ask for a new link</Link>
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </Card>
  );
}
