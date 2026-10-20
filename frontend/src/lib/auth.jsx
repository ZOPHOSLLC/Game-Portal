import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { syncFavorites } from './library.js';

// Who is signed in. Guests have user = null and can still use favorites.
const AuthContext = createContext(null);

async function refreshFavorites() {
  try {
    syncFavorites(await api.games());
  } catch {
    // The API is down; the page shows its own error.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // A one-off message from the server, such as "your deletion was cancelled".
  const [notice, setNotice] = useState(null);

  async function reload() {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    reload().finally(() => setReady(true));
    refreshFavorites();
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      notice,
      clearNotice: () => setNotice(null),
      announce: (text) => setNotice(text),
      // Refetches the signed-in account, e.g. after a change in settings.
      reload,
      // Returns { requires2fa: true } when the password was right but the authenticator code is still needed.
      async login(email, password, code) {
        const body = await api.login(email, password, code);
        if (body.requires2fa) return { requires2fa: true };
        setUser(body.user);
        if (body.notice) setNotice(body.notice);
        await refreshFavorites(); // guest favorites are now the account's
        return body.user;
      },
      // Sign-up does not sign the person in. They verify their email first.
      async register(username, email, password) {
        return (await api.register(username, email, password)).message;
      },
      async logout() {
        await api.logout();
        setUser(null);
        await refreshFavorites();
      },
    }),
    [user, ready, notice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
