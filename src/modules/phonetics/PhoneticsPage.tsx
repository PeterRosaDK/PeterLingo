import { Introduction } from './Introduction';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLearningData } from '../../app/DataProvider';
import { Practice } from '../shared/Practice';
import { phoneticsExercise, phoneticsUnits } from './domain';
export function PhoneticsPage() {
  const { snapshot } = useLearningData();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(
    params.get('unit')?.includes(':ipa_transcribe:')
      ? 'ipa'
      : params.has('unit')
        ? 'spectrogram'
        : 'intro'
  );
  const eligible = phoneticsUnits.filter((u) =>
    (u.prerequisites ?? []).every(
      (id) => (snapshot.mastery.find((m) => m.learningUnitId === id)?.strength ?? 0) >= 0.68
    )
  );
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Lydens skrift og form</p>
        <h1>Fonetik</h1>
        <p>Lyt og skriv IPA, eller læs frekvensmønstret før lyden afsløres.</p>
      </header>
      <div className="self-ratings">
        <button
          className="button secondary"
          aria-pressed={mode === 'intro'}
          onClick={() => setMode('intro')}
        >
          Start her · dansk introduktion
        </button>
        <button
          className="button secondary"
          aria-pressed={mode === 'spectrogram'}
          onClick={() => setMode('spectrogram')}
        >
          Spektrogram
        </button>
        <button
          className="button secondary"
          aria-pressed={mode === 'ipa'}
          onClick={() => setMode('ipa')}
        >
          IPA-transskription
        </button>
      </div>
      {mode === 'intro' ? (
        <Introduction start={setMode} />
      ) : (
        <Practice
          key={mode}
          hideUnitSelector
          units={eligible.filter((u) =>
            mode === 'ipa' ? u.id.includes(':ipa_transcribe:') : u.id.includes(':spectrogram')
          )}
          generate={phoneticsExercise}
        />
      )}
    </div>
  );
}
