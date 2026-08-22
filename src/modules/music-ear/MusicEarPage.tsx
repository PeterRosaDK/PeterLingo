import { useMemo, useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { getAudioEngine } from '../../audio/ToneAudioEngine';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { BASS, CELLO, GUITAR } from '../../music/instruments';
import { createIntervalExample, INTERVALS } from '../../music/intervals';
import { noteName } from '../../music/pitch';
import { NotationFragment } from '../../music/components/NotationFragment';
import { StringInstrument } from '../../music/components/StringInstrument';
import { VirtualPiano } from '../../music/components/VirtualPiano';

type InstrumentTab = 'piano' | 'guitar' | 'bass' | 'cello';
const intervalOptions = [
  { name: 'Lille terts', semitones: INTERVALS.m3 },
  { name: 'Stor terts', semitones: INTERVALS.M3 },
  { name: 'Ren kvart', semitones: INTERVALS.P4 },
  { name: 'Ren kvint', semitones: INTERVALS.P5 },
];

function intervalExercise(
  index: number
): GeneratedExercise<{ rootMidi: number; targetMidi: number; semitones: number; answer: string }> {
  const option = intervalOptions[index % intervalOptions.length]!;
  const example = createIntervalExample(
    60 + (index % 5),
    option.semitones,
    index % 2 ? 'descending' : 'ascending'
  );
  return {
    id: `interval:${index}`,
    learningUnitId: `music-ear:interval:${option.semitones}:${example.direction}`,
    discipline: 'music-ear',
    prompt: `Hvilket interval hører du ${example.direction === 'descending' ? 'nedad' : 'opad'}?`,
    parameters: {
      rootMidi: example.rootMidi,
      targetMidi: example.targetMidi,
      semitones: option.semitones,
      answer: option.name,
    },
    hints: [
      {
        id: 'span',
        label: 'Lyt til spændet',
        content: option.semitones <= 4 ? 'Det er et tertsspænd.' : 'Det er større end en terts.',
      },
      { id: 'answer', label: 'Vis svaret', content: option.name, revealsAnswer: true },
    ],
  };
}

export function MusicEarPage() {
  const { snapshot } = useLearningData();
  const [tab, setTab] = useState<InstrumentTab>('piano');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = useMemo(() => intervalExercise(exerciseIndex), [exerciseIndex]);
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const naming = snapshot.settings.noteNaming;

  const playInterval = () => {
    // Tone.start() is reached synchronously from this click, satisfying iOS audio activation.
    void getAudioEngine().playInterval(
      exercise.parameters.rootMidi,
      exercise.parameters.targetMidi
    );
  };
  const answer = async (name: string) => {
    if (feedback) return;
    const correct = name === exercise.parameters.answer;
    setFeedback(
      correct
        ? 'Ja — behold fornemmelsen af afstanden.'
        : `Det var ${exercise.parameters.answer.toLowerCase()}.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: 'assisted',
      fluentThresholdMs: 7_000,
    });
  };
  const next = () => {
    const index = exerciseIndex + 1;
    setExerciseIndex(index);
    const nextExercise = intervalExercise(index);
    setHints(createHintProgress(nextExercise.hints));
    setFeedback(null);
    restartTimer();
  };

  return (
    <div className="page subject-page music-page">
      <header className="subject-hero mint">
        <div>
          <p className="eyebrow">Rustent er ikke det samme som nyt</p>
          <h1>Musikøre</h1>
          <p>Lyt, genkend og find tonen direkte på det instrument, du har ved hånden.</p>
        </div>
        <div className="waveform" aria-hidden="true">
          {[3, 7, 13, 9, 18, 12, 6, 15, 9, 4].map((height, index) => (
            <i key={index} style={{ height: `${height * 4}px` }} />
          ))}
        </div>
      </header>
      <ExerciseShell
        eyebrow="Genereret høretræning"
        title={exercise.prompt}
        hints={exercise.hints}
        hintProgress={hints}
        onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
      >
        <div className="ear-prompt">
          <button className="listen-button" type="button" onClick={playInterval}>
            <span>▶</span>Afspil interval
          </button>
          <NotationFragment keys={['c/4', exercise.parameters.semitones === 3 ? 'eb/4' : 'g/4']} />
        </div>
        <div className="answer-grid intervals">
          {intervalOptions.map((option) => (
            <button
              key={option.name}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => void answer(option.name)}
            >
              {option.name}
            </button>
          ))}
        </div>
        {feedback && (
          <div className="feedback" role="status">
            {feedback}
            <button className="button primary" type="button" onClick={next}>
              Nyt interval
            </button>
          </div>
        )}
      </ExerciseShell>
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
                <span>Celloen er fretless; markeringerne er kun træningshjælp.</span>
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
