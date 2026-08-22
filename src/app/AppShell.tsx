import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../design-system/Logo';

const nav = [
  { to: '/', label: 'I dag', icon: '⌂', end: true },
  { to: '/fag', label: 'Fag', icon: '◇' },
  { to: '/statistik', label: 'Statistik', icon: '↗' },
  { to: '/indstillinger', label: 'Indstillinger', icon: '⚙' },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <span className="local-badge">
          <i /> Privat på denne enhed
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
