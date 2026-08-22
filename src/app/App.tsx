import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './DataProvider';
import { ThemeSync } from './ThemeSync';

function FoundationPage() {
  return (
    <main className="page">
      <p className="eyebrow">Milestone 0</p>
      <h1>PeterLingo</h1>
      <p>Fem færdigheder. Én fælles læringsmotor.</p>
    </main>
  );
}

export function App() {
  return (
    <DataProvider>
      <ThemeSync />
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<FoundationPage />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
