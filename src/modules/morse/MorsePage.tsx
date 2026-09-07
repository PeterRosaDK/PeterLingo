import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLearningData } from '../../app/DataProvider';
import { Practice } from '../shared/Practice';
import { codes, kochConfig, kochCount, morseExercise, morseUnits } from './domain';
function Branch({ path }: { path: string }) {
  if (path.length > 5) return null;
  const c = Object.entries(codes).find(([, code]) => code === path)?.[0];
  if (!Object.values(codes).some((code) => code.startsWith(path))) return null;
  return (
    <li>
      <span>
        {path ? ' ' + (c ?? '·') : 'Start'}
        <small>{path.replaceAll('.', '·').replaceAll('-', '−')}</small>
      </span>
      <ul>
        <Branch path={path + '.'} />
        <Branch path={path + '-'} />
      </ul>
    </li>
  );
}
export function MorsePage() {
  const { snapshot } = useLearningData();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('unit')?.includes(':send:') ? 'send' : 'receive');
  const count = kochCount(snapshot.attempts);
  const active = kochConfig.order.slice(0, count);
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Lyd → tegn</p>
        <h1>Morse</h1>
        <p>20 WPM tegnhastighed · 600 Hz · rolig afstand mellem tegnene.</p>
      </header>
      <section className="lesson-card">
        <h2>Dit Koch-sæt: {active.split('').join(' · ')}</h2>
        <p>
          Næste tegn åbner efter mindst {kochConfig.minimumAttempts} nyere modtageforsøg, over 90%
          korrekt uden hints og øvelse af alle aktive tegn. Ved større sæt vokser vinduet til tre
          forsøg pr. aktivt tegn. FSRS vælger repetitionerne.
        </p>
      </section>
      <div className="self-ratings">
        <button
          className="button secondary"
          aria-pressed={mode === 'receive'}
          onClick={() => setMode('receive')}
        >
          Modtag
        </button>
        <button
          className="button secondary"
          aria-pressed={mode === 'send'}
          onClick={() => setMode('send')}
        >
          Send
        </button>
      </div>
      <Practice
        key={mode}
        hideUnitSelector={mode === 'receive'}
        units={morseUnits.filter(
          (u) => active.includes(u.id.split(':')[2]!) && u.id.includes(`:${mode}:`)
        )}
        generate={morseExercise}
        effectiveWpm={Math.min(20, 8 + (count - 2) * 0.5)}
      />
      <details className="lesson-card">
        <summary>Morse-træ · teaching og reference</summary>
        <p>Dit til venstre, dah til højre. Modtagetræning viser kun lyd.</p>
        <div className="morse-tree">
          <ul>
            <Branch path="" />
          </ul>
        </div>
      </details>
    </div>
  );
}
