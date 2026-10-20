import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Mail, ShieldCheck, User } from 'lucide-react';
import Button from '../components/Button.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useAuth } from '../lib/auth.jsx';
import { emailError, passwordChecks, passwordError, usernameError } from '../lib/rules.js';

// Sign in and sign up share one card. Sign-in asks for the email and password first.
// If two-step sign-in is on, a second step asks for the authenticator code.
export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register } = useAuth();

  const [form, setForm] = useState({ username: '', email: '', password: '', code: '' });
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = {
    username: isRegister ? usernameError(form.username) : '',
    email: emailError(form.email),
    password: isRegister ? passwordError(form.password) : form.password ? '' : 'Enter your password.',
    code: needsCode && !form.code.trim() ? 'Enter the 6-digit code from your authenticator app.' : '',
  };
  const fieldError = (name) => (touched[name] ? errors[name] : '');
  const update = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const blur = (name) => () => setTouched({ ...touched, [name]: true });
  const hasErrors = Object.values(errors).some(Boolean);

  async function submit(e) {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, code: true });
    if (hasErrors) return;
    setBusy(true);
    setServerError('');
    try {
      if (isRegister) {
        await register(form.username.trim(), form.email.trim(), form.password);
        setSentTo(form.email.trim());
        return;
      }
      const result = await login(form.email.trim(), form.password, needsCode ? form.code.trim() : undefined);
      if (result?.requires2fa) {
        setNeedsCode(true);
        setTouched({ ...touched, code: false });
        return;
      }
      const next = params.get('next');
      navigate(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="page flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="card-lg flex w-full max-w-md flex-col items-center gap-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-cyan/10 text-cyan">
            <Mail size={22} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="title">Check your email</h1>
            <p className="body">
              We sent a link to <span className="font-medium text-fg">{sentTo}</span>. Open it to verify your email, then sign in.
            </p>
          </div>
          <Link to="/login" className="font-medium text-cyan hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="card-lg flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/icon-192.png" alt="" width="48" height="48" className="rounded-lg" />
          <div className="flex flex-col gap-2">
            <h1 className="title">
              {isRegister ? 'Create your account' : needsCode ? 'Enter your code' : 'Welcome back'}
            </h1>
            <p className="body">
              {isRegister
                ? 'Like, rate, and keep your favorites on any device.'
                : needsCode
                  ? 'Open your authenticator app and enter the 6-digit code for this account.'
                  : 'Sign in to like, rate, and manage your account.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {isRegister && (
            <label className="flex flex-col gap-2">
              <span className="text-sm leading-5 font-medium text-fg">Username</span>
              <span className="relative">
                <User size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  className="field pl-9"
                  value={form.username}
                  onChange={update('username')}
                  onBlur={blur('username')}
                  placeholder="yourname"
                  autoComplete="username"
                  aria-invalid={Boolean(fieldError('username'))}
                />
              </span>
              {fieldError('username') ? (
                <span className="text-xs leading-4 text-red-400">{fieldError('username')}</span>
              ) : (
                <span className="caption">Shown next to your games and reviews.</span>
              )}
            </label>
          )}

          {!needsCode && (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-sm leading-5 font-medium text-fg">Email</span>
                <span className="relative">
                  <Mail size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                  <input
                    className="field pl-9"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    onBlur={blur('email')}
                    placeholder="name@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldError('email'))}
                  />
                </span>
                {fieldError('email') && <span className="text-xs leading-4 text-red-400">{fieldError('email')}</span>}
              </label>

              <div className="flex flex-col gap-2">
                <PasswordField
                  label="Password"
                  value={form.password}
                  onChange={update('password')}
                  onBlur={blur('password')}
                  placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  error={fieldError('password')}
                />
                {isRegister && (
                  <ul className="flex flex-col gap-1">
                    {passwordChecks(form.password).map((check) => (
                      <li key={check.label} className={`flex items-center gap-2 text-xs leading-4 ${check.ok ? 'text-cyan' : 'text-muted'}`}>
                        <Check size={12} aria-hidden="true" className={check.ok ? '' : 'opacity-30'} />
                        {check.label}
                      </li>
                    ))}
                  </ul>
                )}
                {!isRegister && (
                  <Link to="/forgot-password" className="self-end text-xs leading-4 font-medium text-cyan hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
            </>
          )}

          {needsCode && (
            <label className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm leading-5 font-medium text-fg">
                <ShieldCheck size={16} aria-hidden="true" className="text-cyan" />
                Authenticator code
              </span>
              <input
                className="field text-center font-mono text-lg tracking-widest"
                value={form.code}
                onChange={update('code')}
                onBlur={blur('code')}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="text"
                autoFocus
                aria-invalid={Boolean(fieldError('code'))}
              />
              {fieldError('code') ? (
                <span className="text-xs leading-4 text-red-400">{fieldError('code')}</span>
              ) : (
                <span className="caption">You can also enter one of your recovery codes.</span>
              )}
            </label>
          )}

          {serverError && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm leading-5 text-red-300">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : isRegister ? 'Create account' : needsCode ? 'Sign in' : 'Continue'}
          </Button>
          {needsCode && (
            <button
              type="button"
              onClick={() => {
                setNeedsCode(false);
                setForm({ ...form, code: '' });
                setServerError('');
              }}
              className="self-center text-sm leading-5 text-muted hover:text-fg"
            >
              Use a different account
            </button>
          )}
        </form>

        {!needsCode && (
          <p className="body text-center">
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <Link to={isRegister ? '/login' : '/register'} className="font-medium text-cyan hover:underline">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
