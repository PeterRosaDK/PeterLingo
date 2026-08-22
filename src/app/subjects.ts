import type { DisciplineId } from '../learning/types';

export interface SubjectDefinition {
  id: DisciplineId;
  eyebrow: string;
  title: string;
  description: string;
  route: string;
  accent: string;
}

export const subjects: SubjectDefinition[] = [
  {
    id: 'doomsday',
    eyebrow: 'Mental kalender',
    title: 'Doomsday',
    description: 'Find ugedagen — og forstå hvert led i regnestykket.',
    route: '/fag/doomsday',
    accent: 'citrine',
  },
  {
    id: 'roux',
    eyebrow: 'Rumlig intuition',
    title: 'Roux',
    description: 'Byg blokke, mærk træk og forbind din GoCube.',
    route: '/fag/roux',
    accent: 'ice',
  },
  {
    id: 'cards',
    eyebrow: 'Kortsystem',
    title: 'BCS → MBCS',
    description: 'Genfind algoritmen og gør rækkefølgen øjeblikkelig.',
    route: '/fag/kort',
    accent: 'coral',
  },
  {
    id: 'pi',
    eyebrow: '100 decimaler',
    title: 'Pi',
    description: 'Lær robuste bidder, broer og tilfældig adgang.',
    route: '/fag/pi',
    accent: 'violet',
  },
  {
    id: 'music-ear',
    eyebrow: 'Lyt · forstå · spil',
    title: 'Musikøre',
    description: 'Genopliv øret på klaver, guitar, bas og cello.',
    route: '/fag/musikoere',
    accent: 'mint',
  },
];

export function subjectById(id: DisciplineId): SubjectDefinition {
  return subjects.find((subject) => subject.id === id)!;
}
