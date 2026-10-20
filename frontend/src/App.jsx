import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Button from './components/Button.jsx';
import AdSlot from './components/AdSlot.jsx';
import Home from './pages/Home.jsx';
import Game from './pages/Game.jsx';
import Admin from './pages/Admin.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import { ForgotPassword, ResetPassword, VerifyEmail } from './pages/AccountFlows.jsx';
import NoticeBar from './components/NoticeBar.jsx';

// Ads appear on the catalogue and game pages only. Wide screens get a rail on
// the left and right. Game pages also get one banner straight under the header;
// on narrower screens the home page gets that banner too, because it has no room
// for side rails.
function Layout() {
  const { pathname } = useLocation();
  const isGame = pathname.startsWith('/game');
  const withAds = pathname === '/' || isGame;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <NoticeBar />
      <main className="flex flex-1 flex-col">
        {withAds && (
          <div className="px-4 pt-4 sm:px-6">
            <AdSlot variant="banner" placement={isGame ? 'game-top' : 'home-top'} className={isGame ? '' : 'xl:hidden'} />
          </div>
        )}
        {withAds ? (
          <div className="mx-auto grid w-full max-w-[1600px] gap-6 xl:grid-cols-[160px_minmax(0,1fr)_160px]">
            <div className="hidden xl:block">
              <AdSlot variant="rail" placement="left" />
            </div>
            <div className="min-w-0">
              <Outlet />
            </div>
            <div className="hidden xl:block">
              <AdSlot variant="rail" placement="right" />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="page flex flex-wrap items-center justify-between gap-4 py-6">
          <span className="body">&copy; 2026 Your Company</span>
          <Link to="/admin" className="body hover:text-fg">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SettingsRedirect() {
  const { pathname } = useLocation();
  const anchors = { profile: 'profile', account: 'account', security: 'security', danger: 'delete' };
  const anchor = anchors[pathname.split('/')[2]];
  return <Navigate to={`/settings${anchor ? `#${anchor}` : ''}`} replace />;
}

function NotFound() {
  return (
    <div className="page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="title">Page not found</h1>
      <p className="body">The page you were looking for does not exist.</p>
      <Link to="/">
        <Button>Browse games</Button>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="game/:slug" element={<Game />} />
        {/* Legacy /game?id=<id> links: Game redirects them to the readable URL. */}
        <Route path="game" element={<Game />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="settings" element={<Settings />} />
        {/* Old per-section links (/settings/security) open the matching section on the one page. */}
        <Route path="settings/*" element={<SettingsRedirect />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
