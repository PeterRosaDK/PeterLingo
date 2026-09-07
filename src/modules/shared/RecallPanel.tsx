import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import type { LearningStage } from '../../learning/types';
import { PeriodicGrid } from '../elements/PeriodicGrid';
import { elements } from '../elements/domain';
import { codes, scoreTaps, type Tap } from '../morse/domain';
import { playMorse } from '../../audio/morseAudio';
import { compareIpa, ipaInventories } from '../phonetics/domain';
import { outputMatches } from '../python_output/domain';
import { normalize, type RecallExercise } from './recall';
function CodePanel({ code }: { code: string }) {
  return (
    <pre className="python-code">
      <code>
        {code
          .split(
            /(\b(?:def|return|for|in|if|else|try|except|finally|class|yield|nonlocal|global|print|True|False|None|and|or|is|lambda|raise|pass|del)\b|"[^"\n]*"|'[^'\n]*'|\b\d+\b)/g
          )
          .map((part, i) => (
            <span
              key={i}
              className={
                /^['"]/.test(part)
                  ? 'code-string'
                  : /^\d+$/.test(part)
                    ? 'code-number'
                    : /^\w+$/.test(part)
                      ? 'code-keyword'
                      : undefined
              }
            >
              {part}
            </span>
          ))}
      </code>
    </pre>
  );
}
export function RecallPanel({
  exercise,
  stage,
  next,
  effectiveWpm = 8,
}: {
  exercise: RecallExercise;
  stage: LearningStage;
  next: () => void;
  effectiveWpm?: number;
}) {
  const [input, setInput] = useState('');
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [played, setPlayed] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [taps, setTaps] = useState<Tap[]>([]);
  const down = useRef<number | null>(null);
  const saving = useRef(false);
  const player = useRef<HTMLAudioElement | null>(null);
  useEffect(
    () => () => {
      player.current?.pause();
    },
    []
  );
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const requiresAudio = exercise.kind === 'morse-receive' || exercise.kind === 'ipa';
  async function play() {
    setBusy(true);
    setAudioError('');
    try {
      if (exercise.kind === 'morse-receive')
        await playMorse(codes[String(exercise.parameters.character)]!, 20, effectiveWpm);
      else {
        const audio = new Audio(String(exercise.parameters.audio ?? exercise.media));
        player.current = audio;
        await audio.play();
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('audio'));
        });
      }
      if (!played) restartTimer();
      setPlayed(true);
    } catch {
      setAudioError('Lyden kunne ikke afspilles. Prøv igen.');
    } finally {
      setBusy(false);
    }
  }
  async function answer(value = input) {
    if (saving.current || feedback || busy || (requiresAudio && !played)) return;
    saving.current = true;
    setBusy(true);
    let correct = (exercise.accepted ?? [exercise.answer]).some(
      (a) => normalize(a) === normalize(value)
    );
    let diagnostic: Record<string, unknown> = {};
    let detail = '';
    if (exercise.kind === 'python') correct = outputMatches(value, exercise.answer);
    if (exercise.kind === 'ipa') {
      const result = compareIpa(value, exercise.answer);
      correct = result.correct;
      diagnostic = result;
      detail = `Segmentafstand ${result.distance}: ${result.substitutions.length} substitutioner, ${result.insertions} indsættelser, ${result.deletions} udeladelser.`;
    }
    if (exercise.kind === 'morse-send') {
      const result = scoreTaps(taps, exercise.answer);
      correct = result.correct;
      diagnostic = { ...result, taps };
      detail = `Dine tryk: ${result.actual.map(Math.round).join(' / ')} ms. Ideal ved dit tempo: ${result.ideal.map(Math.round).join(' / ')} ms.`;
    }
    if (exercise.kind === 'grid') {
      const target = elements.find((e) => e.atomicNumber === Number(exercise.answer))!;
      const selected = elements.find((e) => e.atomicNumber === Number(value));
      if (selected && !correct)
        detail = `${selected.period === target.period ? 'Samme periode. ' : ''}${selected.group !== null && selected.group === target.group ? 'Samme gruppe. ' : ''}Facit: ${target.danishName} (${target.symbol}).`;
    }
    try {
      await record({
        correct,
        hintsUsed: hints.used,
        answerRevealed: hints.answerRevealed,
        stage,
        fluentThresholdMs:
          exercise.kind === 'morse-receive' ? 1800 : exercise.kind === 'python' ? 15000 : 6000,
        parameterOverrides: {
          ...diagnostic,
          submittedAnswer: value,
          ...(exercise.discipline === 'morse' ? { characterWpm: 20, effectiveWpm } : {}),
        },
      });
      setFeedback(
        `${correct ? 'Korrekt.' : 'Ikke helt.'} ${exercise.kind === 'grid' ? '' : `Facit: ${exercise.answer || '(ingen stdout)'}.`} ${exercise.explanation} ${detail}`
      );
    } catch {
      setAudioError('Forsøget kunne ikke gemmes. Prøv igen.');
    } finally {
      setBusy(false);
      saving.current = false;
    }
  }
  const press = () => {
    if (down.current === null && !feedback) down.current = performance.now();
  };
  const release = () => {
    if (down.current !== null) {
      const start = down.current;
      down.current = null;
      setTaps((t) => [...t, { down: start, up: performance.now() }]);
    }
  };
  return (
    <ExerciseShell
      eyebrow={stage === 'teaching' ? 'Lær → genkald' : 'Genkald uden hjælp'}
      title={exercise.prompt}
      hints={exercise.hints}
      hintProgress={hints}
      onHint={() => {
        if (!feedback) setHints((h) => revealNextHint(exercise.hints, h));
      }}
    >
      {exercise.code && (
        <>
          <CodePanel code={exercise.code} />
          <p>Skriv præcis stdout eller exception-typen. Sidste linjeskift er valgfrit.</p>
        </>
      )}
      {exercise.kind === 'spectrogram' && (
        <img
          className="spectrogram"
          src={exercise.media}
          alt="Spektrogram med frekvens og tid; identificér lydklassen"
        />
      )}
      {(requiresAudio || (feedback && exercise.kind === 'spectrogram')) && (
        <button className="button primary" onClick={() => void play()} disabled={busy}>
          {busy ? 'Afspiller …' : played ? 'Lyt igen' : 'Afspil lyd'}
        </button>
      )}
      {exercise.kind === 'grid' ? (
        <PeriodicGrid
          onSelect={(n) => void answer(String(n))}
          disabled={busy || Boolean(feedback)}
          answer={feedback ? Number(exercise.answer) : undefined}
        />
      ) : exercise.kind === 'morse-send' ? (
        <div className="morse-pad">
          <p>Hold for dah, kort tryk for dit. Fokusér knappen og brug mellemrum.</p>
          <button
            className="tap-button"
            disabled={!!feedback || busy}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              press();
            }}
            onPointerUp={release}
            onPointerCancel={() => {
              down.current = null;
            }}
            onKeyDown={(e) => {
              if (e.code === 'Space') {
                e.preventDefault();
                if (!e.repeat) press();
              }
            }}
            onKeyUp={(e) => {
              if (e.code === 'Space') {
                e.preventDefault();
                release();
              }
            }}
            onBlur={() => {
              down.current = null;
            }}
          >
            Tap · {taps.length} tryk
          </button>
          <button
            className="button subtle"
            onClick={() => {
              setTaps([]);
              down.current = null;
            }}
            disabled={!!feedback}
          >
            Start rytmen forfra
          </button>
        </div>
      ) : (
        <label className="recall-answer">
          {exercise.kind === 'python' ? 'Stdout / exception' : 'Dit svar'}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy || !!feedback}
            rows={exercise.kind === 'python' ? 4 : 2}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
      )}
      {exercise.kind === 'ipa' && (
        <div className="ipa-keyboard" aria-label="IPA-tastatur">
          {ipaInventories[exercise.parameters.language === 'da' ? 'da' : 'en'].map((c) => (
            <button
              type="button"
              disabled={!!feedback}
              key={c}
              onClick={() => setInput((i) => i + c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {exercise.kind !== 'grid' && !feedback && (
        <button
          className="button primary"
          disabled={
            busy ||
            (requiresAudio && !played) ||
            (exercise.kind === 'morse-send' ? !taps.length : !input && exercise.kind !== 'python')
          }
          onClick={() => void answer()}
        >
          Tjek svar
        </button>
      )}
      {audioError && <p role="alert">{audioError}</p>}
      {feedback && (
        <div role="status" className="feedback">
          <p className="preserve-space">{feedback}</p>
          <button className="button primary" onClick={next}>
            Næste øvelse
          </button>
          <Link className="button secondary" to="/session">
            Til dagens træning
          </Link>
        </div>
      )}
    </ExerciseShell>
  );
}
