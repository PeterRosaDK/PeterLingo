import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DataProvider } from './DataProvider';
import { ThemeSync } from './ThemeSync';
import { HomePage } from '../routes/HomePage';

const SubjectsPage = lazy(() =>
  import('../routes/SubjectsPage').then((module) => ({ default: module.SubjectsPage }))
);
const StatsPage = lazy(() =>
  import('../routes/StatsPage').then((module) => ({ default: module.StatsPage }))
);
const SettingsPage = lazy(() =>
  import('../routes/SettingsPage').then((module) => ({ default: module.SettingsPage }))
);
const SessionPage = lazy(() =>
  import('../routes/SessionPage').then((module) => ({ default: module.SessionPage }))
);
const DoomsdayPage = lazy(() =>
  import('../modules/doomsday/DoomsdayPage').then((module) => ({ default: module.DoomsdayPage }))
);
const CardsPage = lazy(() =>
  import('../modules/cards/CardsPage').then((module) => ({ default: module.CardsPage }))
);
const PiPage = lazy(() =>
  import('../modules/pi/PiPage').then((module) => ({ default: module.PiPage }))
);
const RouxPage = lazy(() =>
  import('../modules/roux/RouxPage').then((module) => ({ default: module.RouxPage }))
);
const SmartCubeDiagnosticsPage = lazy(() =>
  import('../modules/roux/SmartCubeDiagnosticsPage').then((module) => ({
    default: module.SmartCubeDiagnosticsPage,
  }))
);
const MusicEarPage = lazy(() =>
  import('../modules/music-ear/MusicEarPage').then((module) => ({ default: module.MusicEarPage }))
);
const NotFoundPage = lazy(() =>
  import('../routes/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);

export function App() {
  return (
    <DataProvider>
      <ThemeSync />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="route-loading" role="status">
              Åbner øvelsen …
            </div>
          }
        >
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="session" element={<SessionPage />} />
              <Route path="fag" element={<SubjectsPage />} />
              <Route path="fag/doomsday" element={<DoomsdayPage />} />
              <Route path="fag/kort" element={<CardsPage />} />
              <Route path="fag/pi" element={<PiPage />} />
              <Route path="fag/roux" element={<RouxPage />} />
              <Route path="fag/roux/diagnostik" element={<SmartCubeDiagnosticsPage />} />
              <Route path="fag/musikoere" element={<MusicEarPage />} />
              <Route path="statistik" element={<StatsPage />} />
              <Route path="indstillinger" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider>
  );
}
