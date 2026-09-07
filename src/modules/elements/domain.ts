import data from './elements.json';
import { recall, unit, type RecallExercise } from '../shared/recall';
import type { LearningUnit } from '../../learning/types';
export const elements = data;
export type ElementRecord = (typeof data)[number];
export const song = [...elements]
  .filter((e) => e.songIndex !== null)
  .sort((a, b) => a.songIndex! - b.songIndex!);
export const elementModes = [
  'symbol_to_name',
  'name_to_position',
  'song_chain',
  'song_index_to_grid',
] as const;
export const elementUnits = elements.flatMap((e) =>
  elementModes
    .filter(
      (mode) =>
        !mode.startsWith('song') ||
        (e.songIndex !== null && (mode !== 'song_chain' || e.songIndex < song.length))
    )
    .map((mode) =>
      unit(
        `${mode}:${e.atomicNumber}`,
        'elements',
        `${mode === 'symbol_to_name' ? 'Symbol' : mode === 'name_to_position' ? 'Placering' : mode === 'song_chain' ? 'Sangkæde' : 'Sangplacering'} · ${e.symbol}`
      )
    )
);
const aliases: Record<string, string[]> = {
  H: ['brint'],
  O: ['ilt'],
  N: ['kvælstof'],
  C: ['kul', 'kulstof'],
  Al: ['aluminum'],
  Cs: ['cesium'],
  P: ['fosfor'],
  Cl: ['klor'],
  Cr: ['krom'],
  Co: ['kobolt'],
  Ts: ['tennessine'],
};
export function gridPosition(e: ElementRecord): [number, number] {
  if (e.atomicNumber >= 57 && e.atomicNumber <= 71) return [9, e.atomicNumber - 54];
  if (e.atomicNumber >= 89 && e.atomicNumber <= 103) return [10, e.atomicNumber - 86];
  return [e.period, e.group!];
}
export function elementExercise(u: LearningUnit): RecallExercise {
  const [, mode, n] = u.id.split(':');
  const e = elements.find((e) => e.atomicNumber === Number(n))!;
  const target = mode === 'song_chain' ? song[e.songIndex!]! : e;
  const grid = mode === 'name_to_position' || mode === 'song_index_to_grid';
  return recall(
    u,
    mode === 'symbol_to_name'
      ? e.symbol
      : mode === 'song_chain'
        ? `Hvad følger efter ${e.danishName} i sangen?`
        : mode === 'song_index_to_grid'
          ? `Nr. ${e.songIndex} i sangen`
          : `Find ${e.danishName}`,
    grid ? String(target.atomicNumber) : target.danishName,
    grid
      ? `Find periode ${target.period}${target.group ? `, gruppe ${target.group}` : ', den udskilte f-blok'}.`
      : `Navnet begynder med ${target.danishName[0]}.`,
    {
      kind: grid ? 'grid' : 'text',
      ...(grid
        ? {
            hints: [
              { id: 'period', label: 'Periode', content: `Start i periode ${target.period}.` },
              {
                id: 'cell',
                label: 'Præcis placering',
                content: `${target.danishName}: periode ${target.period}, ${target.group ? `gruppe ${target.group}` : `f-blok, celle ${gridPosition(target)[1] - 2}`}.`,
                revealsAnswer: true,
              },
            ],
          }
        : {}),
      accepted: grid
        ? undefined
        : [target.danishName, target.englishName, ...(aliases[target.symbol] ?? [])],
      parameters: { mode, atomicNumber: e.atomicNumber, target: target.atomicNumber },
    }
  );
}
