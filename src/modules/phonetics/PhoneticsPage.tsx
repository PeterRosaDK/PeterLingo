import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLearningData } from '../../app/DataProvider';
import { Practice } from '../shared/Practice';
import { phoneticsExercise, phoneticsUnits } from './domain';
export function PhoneticsPage() {
  const { snapshot } = useLearningData();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(
    params.get('unit')?.includes(':ipa_transcribe:') ? 'ipa' : 'spectrogram'
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
      <section className="lesson-card">
        <h2>Et lille akustisk laboratorium</h2>
        <p>
          De fem lokale signaler er syntetiske undervisningsfixtures. Vokalerne er IPA-prototyper,
          ikke verificerede danske eller engelske ord. Sprogenes tastaturer holdes adskilt; en
          konkret dansk transskriptionskonvention kræver kurateret tale.
        </p>
      </section>
      <div className="self-ratings">
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
      <Practice
        key={mode}
        hideUnitSelector
        units={eligible.filter((u) =>
          mode === 'ipa' ? u.id.includes(':ipa_transcribe:') : u.id.includes(':spectrogram')
        )}
        generate={phoneticsExercise}
      />
    </div>
  );
}
