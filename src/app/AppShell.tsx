import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../design-system/Logo';
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
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <span className={`local-badge sync-${syncStatus}`} title="PeterLingo cloudstatus">
          <i /> {syncLabels[syncStatus]}
        </span>
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
