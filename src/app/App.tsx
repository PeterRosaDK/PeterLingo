import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
const RouxTrainingPage = lazy(() =>
  import('../modules/roux/RouxTrainingPage').then((module) => ({
    default: module.RouxTrainingPage,
  }))
);
const RouxFirstBlockPage = lazy(() =>
  import('../modules/roux/RouxFirstBlockPage').then((module) => ({
    default: module.RouxFirstBlockPage,
  }))
);
const RouxSecondBlockPage = lazy(() =>
  import('../modules/roux/RouxSecondBlockPage').then((module) => ({
    default: module.RouxSecondBlockPage,
  }))
);
const RouxCmllPage = lazy(() =>
  import('../modules/roux/RouxCmllPage').then((module) => ({ default: module.RouxCmllPage }))
);
const RouxLsePage = lazy(() =>
  import('../modules/roux/RouxLsePage').then((module) => ({ default: module.RouxLsePage }))
);
const CubeNotationHelpPage = lazy(() =>
  import('../modules/roux/CubeNotationHelpPage').then((module) => ({
    default: module.CubeNotationHelpPage,
  }))
);
const ManualCubeStatePage = lazy(() =>
  import('../modules/roux/ManualCubeStatePage').then((module) => ({
    default: module.ManualCubeStatePage,
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
              <Route path="fag/roux" element={<RouxTrainingPage />} />
              <Route path="fag/roux/traening" element={<RouxTrainingPage />} />
              <Route path="fag/roux/first-block" element={<RouxFirstBlockPage />} />
              <Route path="fag/roux/second-block" element={<RouxSecondBlockPage />} />
              <Route path="fag/roux/cmll" element={<RouxCmllPage />} />
              <Route path="fag/roux/lse" element={<RouxLsePage />} />
              <Route path="fag/roux/notation" element={<CubeNotationHelpPage />} />
              <Route path="fag/roux/manuel-tilstand" element={<ManualCubeStatePage />} />
              <Route path="fag/roux/opsaetning" element={<Navigate replace to="/fag/roux" />} />
              <Route
                path="fag/roux/diagnostik"
                element={<Navigate replace to="/fag/roux/opsaetning" />}
              />
              <Route path="fag/hoerelaere" element={<MusicEarPage />} />
              <Route path="fag/musikoere" element={<Navigate replace to="/fag/hoerelaere" />} />
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
