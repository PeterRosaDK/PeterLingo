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
    eyebrow: 'Fem cifre ad gangen',
    title: 'Pi',
    description: 'Udvid sikre bidder og overgange uden et fast loft på 100.',
    route: '/fag/pi',
    accent: 'violet',
  },
  {
    id: 'music-ear',
    eyebrow: 'Melodisk · harmonisk',
    title: 'Hørelære',
    description: 'Lær intervallet roligt, og tag derefter dagens adaptive høretest.',
    route: '/fag/hoerelaere',
    accent: 'mint',
  },
  {
    id: 'elements',
    title: 'Grundstoffer',
    eyebrow: 'Symbol · placering · sang',
    description: 'Forbind alle 118 grundstoffer.',
    route: '/fag/elements',
    accent: 'citrine',
  },
  {
    id: 'morse',
    title: 'Morse',
    eyebrow: 'Lyd → tegn',
    description: 'Lær rytmen med Koch og aktiv afsendelse.',
    route: '/fag/morse',
    accent: 'ice',
  },
  {
    id: 'flashcards',
    title: 'Flashkort',
    eyebrow: 'Genkald · vend · vurder',
    description: 'HSK, lande og mentale omregninger.',
    route: '/fag/flashcards',
    accent: 'coral',
  },
  {
    id: 'phonetics',
    title: 'Fonetik',
    eyebrow: 'IPA · spektrogram',
    description: 'Se og skriv lydens struktur.',
    route: '/fag/phonetics',
    accent: 'violet',
  },
  {
    id: 'python_output',
    title: 'Python-hjernen',
    eyebrow: 'Mental execution',
    description: 'Hvad printer programmet — præcis?',
    route: '/fag/python_output',
    accent: 'mint',
  },
];

export function subjectById(id: DisciplineId): SubjectDefinition {
  return subjects.find((subject) => subject.id === id)!;
}
