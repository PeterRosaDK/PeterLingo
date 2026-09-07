import type { Attempt, LearningUnit } from '../../learning/types';
import { recall, unit } from '../shared/recall';
export const codes: Record<string, string> = Object.fromEntries(
  'A .-;B -...;C -.-.;D -..;E .;F ..-.;G --.;H ....;I ..;J .---;K -.-;L .-..;M --;N -.;O ---;P .--.;Q --.-;R .-.;S ...;T -;U ..-;V ...-;W .--;X -..-;Y -.--;Z --..;0 -----;1 .----;2 ..---;3 ...--;4 ....-;5 .....;6 -....;7 --...;8 ---..;9 ----.'
    .split(';')
    .map((v) => v.split(' '))
);
export const kochConfig = {
  order: 'KMURESNAPTLWIJZFOYVG5Q9H38B427C1D60X',
  minimumAttempts: 30,
  attemptsPerActiveCharacter: 3,
  accuracy: 0.9,
  characterWpm: 20,
  frequency: 600,
  initialEffectiveWpm: 8,
};
export function kochCount(attempts: Attempt[]): number {
  let count = 2;
  while (count < kochConfig.order.length) {
    const active = kochConfig.order.slice(0, count);
    const windowSize = Math.max(
      kochConfig.minimumAttempts,
      count * kochConfig.attemptsPerActiveCharacter
    );
    const relevant = attempts
      .filter(
        (a) =>
          a.discipline === 'morse' &&
          a.generatedParameters.mode === 'receive' &&
          active.includes(String(a.generatedParameters.character))
      )
      .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt))
      .slice(-windowSize);
    if (
      relevant.length < windowSize ||
      relevant.filter((a) => a.correct && a.hintsUsed === 0 && !a.answerRevealed).length /
        relevant.length <=
        kochConfig.accuracy ||
      [...active].some((c) => !relevant.some((a) => a.generatedParameters.character === c))
    )
      break;
    count++;
  }
  return count;
}
export const morseUnits = Object.keys(codes).flatMap((c) =>
  ['receive', 'send'].map((mode) =>
    unit(`${mode}:${c}`, 'morse', mode === 'receive' ? 'Modtag et tegn' : `Send · ${c}`, 20)
  )
);
export function morseExercise(u: LearningUnit) {
  const [, mode, c] = u.id.split(':');
  return recall(
    u,
    mode === 'receive' ? 'Lyt, og skriv tegnet' : `Send ${c}`,
    mode === 'receive' ? c! : codes[c!]!,
    'Genkald hele lydmønstret som én rytme.',
    {
      kind: mode === 'receive' ? 'morse-receive' : 'morse-send',
      parameters: { mode, character: c },
      hints: [
        { id: 'rhythm', label: 'Teaching', content: `${c}: ${codes[c!]}`, revealsAnswer: true },
      ],
    }
  );
}
export interface Tap {
  down: number;
  up: number;
}
export function scoreTaps(taps: Tap[], pattern: string) {
  const lengths = taps.map((t) => t.up - t.down);
  if (lengths.length !== pattern.length || lengths.some((n) => n <= 0))
    return { correct: false, error: 1, unitMs: 0, actual: lengths, ideal: [] as number[] };
  const units = lengths.map((n, i) => n / (pattern[i] === '-' ? 3 : 1));
  const sorted = [...units].sort((a, b) => a - b);
  const dit = sorted[Math.floor(sorted.length / 2)]!;
  const ideal = [...pattern].map((c) => dit * (c === '-' ? 3 : 1));
  const durations = lengths.map((n, i) => Math.abs(n - ideal[i]!) / ideal[i]!);
  const gaps = taps.slice(1).map((t, i) => Math.abs(t.down - taps[i]!.up - dit) / dit);
  const errors = [...durations, ...gaps];
  const error = errors.reduce((a, b) => a + b, 0) / errors.length;
  return {
    correct: error <= 0.3 && Math.max(...errors) <= 0.6,
    error,
    unitMs: dit,
    actual: lengths,
    ideal,
  };
}
