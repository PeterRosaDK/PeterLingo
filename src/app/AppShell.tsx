import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../design-system/Logo';
import { cloudAccessAction, logoutCloudAccessAndReturn } from './cloudAccessAction';
import { useLearningData, type CloudSyncStatus } from './DataProvider';

const nav = [
  { to: '/', label: 'I dag', icon: '⌂', end: true },
  { to: '/fag', label: 'Fag', icon: '◇' },
  { to: '/statistik', label: 'Statistik', icon: '↗' },
  { to: '/indstillinger', label: 'Indstillinger', icon: '⚙' },
];

const syncLabels: Record<CloudSyncStatus, string> = {
  local: 'Gemt lokalt',
  syncing: 'Synkroniserer …',
  synced: 'Synkroniseret',
  offline: 'Offline · gemt lokalt',
  'auth-required': 'Cloudlogin kræves',
  unavailable: 'Gemt lokalt',
  error: 'Gemt lokalt · synkfejl',
};

export function AppShell() {
  const { syncStatus } = useLearningData();
  const accessAction = cloudAccessAction(window.location.hostname, syncStatus);
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <div className="topbar-actions">
          {accessAction === 'login' ? (
            <a
              className={`local-badge local-badge-link sync-${syncStatus}`}
              href="/login"
              title="Log ind for at synkronisere med PeterLingo-cloud"
            >
              <i /> {syncLabels[syncStatus]}
            </a>
          ) : (
            <span className={`local-badge sync-${syncStatus}`} title="PeterLingo cloudstatus">
              <i /> {syncLabels[syncStatus]}
            </span>
          )}
          {accessAction === 'login' && (
            <a className="access-link access-login-link" href="/login">
              Log ind
            </a>
          )}
          {accessAction === 'logout' && (
            <a
              className="access-link access-logout-link"
              href="/cdn-cgi/access/logout"
              title="Cloudflare logger også ud af andre Access-beskyttede PeterGPT-apps"
              onClick={(event) => {
                event.preventDefault();
                if (
                  window.confirm(
                    'Cloudflare logger dig også ud af andre Access-beskyttede PeterGPT-apps i denne browser. Vil du fortsætte?'
                  )
                )
                  void logoutCloudAccessAndReturn();
              }}
            >
              Log ud
            </a>
          )}
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <nav className="main-nav" aria-label="Hovednavigation">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
