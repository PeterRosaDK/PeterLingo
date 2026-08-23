import { useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { BASS, CELLO, GUITAR } from '../../music/instruments';
import { StringInstrument } from '../../music/components/StringInstrument';
import { VirtualPiano } from '../../music/components/VirtualPiano';
import { noteName } from '../../music/pitch';
import { EAR_CURRICULUM_VERSION } from './curriculum';
import { DailyEarTest } from './DailyEarTest';
import { EarLesson } from './EarLesson';

type InstrumentTab = 'piano' | 'guitar' | 'bass' | 'cello';
type EarMode = 'learn' | 'daily';

export function MusicEarPage() {
  const { snapshot, ready } = useLearningData();
  const [selectedMode, setSelectedMode] = useState<EarMode | null>(null);
  const [tab, setTab] = useState<InstrumentTab>('piano');
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [showGuides, setShowGuides] = useState(true);

  if (!ready) return <div className="page subject-page">Finder din høretræning …</div>;

  const naming = snapshot.settings.noteNaming;
  const hasEarHistory = snapshot.attempts.some(
    (attempt) =>
      attempt.discipline === 'music-ear' &&
      attempt.generatedParameters.earCurriculumVersion === EAR_CURRICULUM_VERSION
  );
  const mode = selectedMode ?? (hasEarHistory ? 'daily' : 'learn');

  return (
    <div className="page subject-page music-page">
      <header className="subject-hero mint">
        <div>
          <p className="eyebrow">Lyt først · svar bagefter</p>
          <h1>Hørelære</h1>
          <p>
            Lær intervallets form i roligt tempo, og træn det derefter melodisk opad, melodisk nedad
            og harmonisk.
          </p>
        </div>
        <div className="waveform" aria-hidden="true">
          {[3, 7, 13, 9, 18, 12, 6, 15, 9, 4].map((height, index) => (
            <i key={index} style={{ height: `${height * 4}px` }} />
          ))}
        </div>
      </header>

      <nav className="ear-mode-switch" aria-label="Hørelæretilstand">
        <button
          type="button"
          aria-pressed={mode === 'learn'}
          className={mode === 'learn' ? 'active' : ''}
          onClick={() => setSelectedMode('learn')}
        >
          <strong>Kort læringsforløb</strong>
          <span>Fire rolige trin med sammenligninger</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === 'daily'}
          className={mode === 'daily' ? 'active' : ''}
          onClick={() => setSelectedMode('daily')}
        >
          <strong>Dagens test</strong>
          <span>Tre spørgsmål · én af hver lydform</span>
        </button>
      </nav>

      {mode === 'learn' ? (
        <EarLesson onFinish={() => setSelectedMode('daily')} />
      ) : (
        <DailyEarTest />
      )}

      <section className="instrument-lab">
        <div className="instrument-heading">
          <div>
            <p className="eyebrow">Altid i lommen</p>
            <h2>Virtuelle instrumenter</h2>
            <p>Lyden starter kun ved din berøring. Ingen mikrofon bliver forespurgt.</p>
          </div>
          {lastNote !== null && (
            <div className="last-note">
              <span>Sidst spillet</span>
              <strong>{noteName(lastNote, naming)}</strong>
            </div>
          )}
        </div>
        <div className="instrument-tabs" role="tablist">
          {(['piano', 'guitar', 'bass', 'cello'] as InstrumentTab[]).map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? 'active' : ''}
              onClick={() => setTab(name)}
            >
              {name === 'piano'
                ? 'Klaver'
                : name === 'guitar'
                  ? 'Guitar'
                  : name === 'bass'
                    ? 'Bas'
                    : 'Cello'}
            </button>
          ))}
        </div>
        <div className="instrument-surface">
          {tab === 'piano' && (
            <VirtualPiano
              naming={naming}
              showNames={snapshot.settings.showPianoNoteNames}
              onPlay={setLastNote}
            />
          )}
          {tab === 'guitar' && (
            <StringInstrument definition={GUITAR} naming={naming} onPlay={setLastNote} />
          )}
          {tab === 'bass' && (
            <StringInstrument definition={BASS} naming={naming} onPlay={setLastNote} />
          )}
          {tab === 'cello' && (
            <>
              <div className="guide-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(event) => setShowGuides(event.target.checked)}
                  />{' '}
                  Pitch-guides
                </label>
                <span>Celloen er båndløs; markeringerne er kun træningshjælp.</span>
              </div>
              <StringInstrument
                definition={CELLO}
                naming={naming}
                showPitchGuides={showGuides}
                showNames={showGuides}
                onPlay={setLastNote}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
