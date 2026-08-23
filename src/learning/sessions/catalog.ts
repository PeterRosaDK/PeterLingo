import type { LearningUnit } from '../types';
import type { DisciplineId } from '../types';

export const learningCatalog: LearningUnit[] = [
  {
    id: 'doomsday:weekday-numbering',
    discipline: 'doomsday',
    title: 'Ugedagenes tal',
    stage: 'teaching',
    estimatedSeconds: 60,
    isNew: true,
  },
  {
    id: 'doomsday:century-anchors',
    discipline: 'doomsday',
    title: 'Århundredernes ankre',
    stage: 'teaching',
    estimatedSeconds: 75,
    isNew: true,
  },
  {
    id: 'doomsday:year-calculation',
    discipline: 'doomsday',
    title: 'Årets dommedag',
    stage: 'teaching',
    estimatedSeconds: 90,
    isNew: true,
  },
  {
    id: 'doomsday:month-anchors',
    discipline: 'doomsday',
    title: 'Månedernes huskedatoer',
    stage: 'teaching',
    estimatedSeconds: 75,
    isNew: true,
  },
  {
    id: 'doomsday:leap-years',
    discipline: 'doomsday',
    title: 'Skudår',
    stage: 'teaching',
    estimatedSeconds: 60,
    isNew: true,
  },
  {
    id: 'doomsday:complete-date',
    discipline: 'doomsday',
    title: 'Hele datoen',
    stage: 'teaching',
    estimatedSeconds: 120,
    isNew: true,
  },
  {
    id: 'cards:bcs-next',
    discipline: 'cards',
    title: 'BCS: næste kort',
    stage: 'assisted',
    estimatedSeconds: 45,
    isNew: true,
  },
  {
    id: 'cards:suit-values',
    discipline: 'cards',
    title: 'Kulørværdierne',
    stage: 'assisted',
    estimatedSeconds: 40,
    isNew: true,
  },
  {
    id: 'pi:diagnostic',
    discipline: 'pi',
    title: 'Pi-status',
    stage: 'teaching',
    estimatedSeconds: 90,
    isNew: true,
  },
  {
    id: 'pi:bridge:6-10',
    discipline: 'pi',
    title: 'Pi-bro 6–10',
    stage: 'assisted',
    estimatedSeconds: 45,
    isNew: true,
  },
  {
    id: 'roux:first-block-intro',
    discipline: 'roux',
    title: 'Første blok',
    stage: 'teaching',
    estimatedSeconds: 90,
    isNew: true,
  },
  {
    id: 'roux:cube-orientation',
    discipline: 'roux',
    title: 'Terningens orientering',
    stage: 'assisted',
    estimatedSeconds: 60,
    isNew: true,
  },
  {
    id: 'music-ear:interval:m3:ascending',
    discipline: 'music-ear',
    title: 'Lille terts op',
    stage: 'assisted',
    estimatedSeconds: 50,
    isNew: true,
  },
  {
    id: 'music-ear:instrument-geography',
    discipline: 'music-ear',
    title: 'Find tonen',
    stage: 'assisted',
    estimatedSeconds: 50,
    isNew: true,
  },
];

export function disciplineForLearningUnitId(id: string): DisciplineId | null {
  const prefix = id.split(':')[0];
  if (prefix === 'doomsday' || prefix === 'roux' || prefix === 'cards' || prefix === 'pi')
    return prefix;
  if (prefix === 'music-ear') return 'music-ear';
  return null;
}
