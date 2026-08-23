import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import type { GeneratedExercise, MasteryRecord, ProgressiveHint } from '../../learning/types';
import {
  BCS_STACK,
  NEXT_SUIT,
  PREVIOUS_SUIT,
  RANK_LABELS,
  SAME_COLOUR_OPPOSITE,
  SUITS,
  SUIT_LABELS,
  SUIT_VALUES,
  accessibleCardName,
  bcsRankCalculation,
  cardAtOffset,
  cardAtPosition,
  cutSizeForTarget,
  cyclicOffset,
  nextBcsCard,
  parseCard,
  positionAfterCut,
  positionOfCard,
  previousBcsCard,
  topCardAfterRemoving,
  type CardCode,
  type Rank,
  type Suit,
} from './bcs';
import type { CardsSkillId } from './curriculum';

export interface CardsAnswerChoice {
  value: string;
  label: string;
  card?: CardCode;
}

export type CardsExercise = GeneratedExercise<{
  skill: CardsSkillId;
  answer: string;
  currentCard?: CardCode;
  targetCard?: CardCode;
  position?: number;
  targetPosition?: number;
  offset?: number;
  cutSize?: number;
  removedCards?: number;
  variant?: 'move-offset' | 'forward-distance' | 'follow-cut' | 'cut-to-target' | 'removed-top';
}> & {
  choices: CardsAnswerChoice[];
  explanation: string;
  visual: {
    card?: CardCode;
    label: string;
    primary: string;
    secondary: string;
  };
};

const SUIT_SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', C: '♣', D: '♦' };

function normalizedSeed(seed: number): number {
  return Math.abs(Math.trunc(seed));
}

function rotate<T>(items: T[], seed: number): T[] {
  const offset = normalizedSeed(seed) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function answerHint(content: string): ProgressiveHint {
  return { id: 'answer', label: 'Vis svaret', content, revealsAnswer: true };
}

function cardChoices(answer: CardCode, seed: number): CardsAnswerChoice[] {
  const index = positionOfCard(answer) - 1;
  return rotate(
    [
      answer,
      BCS_STACK[(index + 7) % 52]!,
      BCS_STACK[(index + 19) % 52]!,
      BCS_STACK[(index + 31) % 52]!,
    ].map((card) => ({ value: card, label: accessibleCardName(card), card })),
    seed
  );
}

function positionChoices(answer: number, seed: number): CardsAnswerChoice[] {
  return rotate(
    [answer, cyclicOffset(answer, 7), cyclicOffset(answer, 17), cyclicOffset(answer, 29)].map(
      (position) => ({ value: String(position), label: String(position) })
    ),
    seed
  );
}

function countChoices(answer: number, seed: number): CardsAnswerChoice[] {
  const values = [answer, (answer + 7) % 52, (answer + 19) % 52, (answer + 31) % 52].filter(
    (value, index, all) => all.indexOf(value) === index
  );
  for (let value = 0; values.length < 4; value += 1) {
    if (!values.includes(value)) values.push(value);
  }
  return rotate(
    values.map((value) => ({ value: String(value), label: String(value) })),
    seed
  );
}

function rankChoices(answer: Rank, seed: number): CardsAnswerChoice[] {
  const ranks = [answer, ...[3, 6, 9].map((offset) => (((answer - 1 + offset) % 13) + 1) as Rank)];
  return rotate(
    ranks.map((rank) => ({ value: String(rank), label: RANK_LABELS[rank] })),
    seed
  );
}

function suitChoices(seed: number): CardsAnswerChoice[] {
  return rotate(
    SUITS.map((suit) => ({
      value: suit,
      label: `${SUIT_SYMBOLS[suit]} ${SUIT_LABELS[suit]}`,
    })),
    seed
  );
}

function suitRelation(currentSuit: Suit, nextRank: Rank): string {
  if (nextRank <= 3) return `samme kulør: ${SUIT_LABELS[currentSuit]}`;
  if (nextRank <= 6)
    return `samme farve, anden kulør: ${SUIT_LABELS[SAME_COLOUR_OPPOSITE[currentSuit]]}`;
  if (nextRank <= 9) return `forrige i kulørcirklen: ${SUIT_LABELS[PREVIOUS_SUIT[currentSuit]]}`;
  return `næste i kulørcirklen: ${SUIT_LABELS[NEXT_SUIT[currentSuit]]}`;
}

function createSuitValueExercise(seed: number): CardsExercise {
  const suit = SUITS[normalizedSeed(seed) % SUITS.length]!;
  const answer = SUIT_VALUES[suit];
  return {
    id: `cards:suit-values:${suit}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:suit-values',
    discipline: 'cards',
    prompt: `Hvad er kulørtallet for ${SUIT_LABELS[suit]}?`,
    parameters: { skill: 'suit-values', answer: String(answer) },
    choices: [1, 2, 3, 4].map((value) => ({ value: String(value), label: String(value) })),
    visual: {
      label: 'Kulør',
      primary: SUIT_SYMBOLS[suit],
      secondary: SUIT_LABELS[suit],
    },
    explanation: `${SUIT_LABELS[suit]} har kulørtallet ${answer}. Tallet er kun et fast hjælpemiddel i BCS-reglen.`,
    hints: [
      {
        id: 'sequence',
        label: 'Brug kulørcirklen',
        content: 'Tallene følger rækken spar, hjerter, klør, ruder.',
      },
      answerHint(`${SUIT_LABELS[suit]} = ${answer}.`),
    ],
  };
}

function createRankReductionExercise(seed: number): CardsExercise {
  const card = BCS_STACK[normalizedSeed(seed) % 52]!;
  const current = parseCard(card);
  const calculation = bcsRankCalculation(card);
  const answer = calculation.result;
  return {
    id: `cards:rank-reduction:${card}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:rank-reduction',
    discipline: 'cards',
    prompt: `Hvad bliver den nye kortværdi efter ${accessibleCardName(card)}?`,
    parameters: { skill: 'rank-reduction', answer: String(answer), currentCard: card },
    choices: rankChoices(answer, seed),
    visual: {
      card,
      label: 'Regn kun værdien',
      primary: `${current.rank} × 2 → ${calculation.reducedDouble}`,
      secondary: `læg derefter ${SUIT_VALUES[current.suit]} til`,
    },
    explanation: `${current.rank} × 2 = ${calculation.doubled}. ${calculation.doubled > 13 ? `Træk 13 fra: ${calculation.reducedDouble}` : `Behold ${calculation.reducedDouble}`}. Tæl derefter ${SUIT_VALUES[current.suit]} op for ${SUIT_LABELS[current.suit]}; efter 13 begynder du ved es. Den nye kortværdi er ${RANK_LABELS[answer].toLowerCase()}.`,
    hints: [
      {
        id: 'double',
        label: 'Fordobl først',
        content: `${current.rank} × 2 = ${calculation.doubled}. ${calculation.doubled > 13 ? `Træk 13 fra, så du får ${calculation.reducedDouble}.` : `Det giver ${calculation.reducedDouble}.`}`,
      },
      {
        id: 'suit-count',
        label: 'Tæl kulørtallet op',
        content: `${SUIT_LABELS[current.suit]} er ${SUIT_VALUES[current.suit]}, så tæl ${SUIT_VALUES[current.suit]} op fra ${calculation.reducedDouble}. Efter konge kommer es.`,
      },
      answerHint(`Den nye kortværdi er ${RANK_LABELS[answer].toLowerCase()} (${answer}).`),
    ],
  };
}

function createSuitRelationshipExercise(seed: number): CardsExercise {
  const card = BCS_STACK[normalizedSeed(seed) % 52]!;
  const current = parseCard(card);
  const next = parseCard(nextBcsCard(card));
  const relation = suitRelation(current.suit, next.rank);
  return {
    id: `cards:suit-relationship:${card}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:suit-relationship',
    discipline: 'cards',
    prompt: `Den nye kortværdi er ${RANK_LABELS[next.rank].toLowerCase()}. Hvilken kulør følger efter ${SUIT_LABELS[current.suit]}?`,
    parameters: { skill: 'suit-relationship', answer: next.suit, currentCard: card },
    choices: suitChoices(seed),
    visual: {
      card,
      label: `Ny værdi: ${next.rank}`,
      primary: SUIT_SYMBOLS[current.suit],
      secondary: 'vælg den nye kulør',
    },
    explanation: `Den nye værdi ${next.rank} bruger reglen “${relation}”. Derfor bliver den nye kulør ${SUIT_LABELS[next.suit]}.`,
    hints: [
      {
        id: 'groups',
        label: 'Find værdigruppen',
        content: '1–3: samme. 4–6: samme farve. 7–9: forrige. 10–13: næste.',
      },
      {
        id: 'cycle',
        label: 'Brug kulørcirklen',
        content: 'Kulørcirklen er spar → hjerter → klør → ruder → spar.',
      },
      answerHint(`Den nye kulør er ${SUIT_LABELS[next.suit]}.`),
    ],
  };
}

function nextCardHints(card: CardCode, answer: CardCode): ProgressiveHint[] {
  const current = parseCard(card);
  const next = parseCard(answer);
  const calculation = bcsRankCalculation(card);
  return [
    {
      id: 'suit-value',
      label: 'Find kulørtallet',
      content: `${SUIT_LABELS[current.suit]} har kulørtallet ${SUIT_VALUES[current.suit]}.`,
    },
    {
      id: 'rank',
      label: 'Find den nye kortværdi',
      content: `${current.rank} × 2 bliver ${calculation.reducedDouble}, når et eventuelt 13-tal er trukket fra. Tæl så ${SUIT_VALUES[current.suit]} op for ${SUIT_LABELS[current.suit]}: ${next.rank}.`,
    },
    {
      id: 'relation',
      label: 'Find kuløren',
      content: `Værdi ${next.rank} betyder ${suitRelation(current.suit, next.rank)}.`,
    },
    answerHint(`Det næste kort er ${accessibleCardName(answer)}.`),
  ];
}

function createNextCardExercise(seed: number): CardsExercise {
  const card = BCS_STACK[normalizedSeed(seed) % 52]!;
  const answer = nextBcsCard(card);
  return {
    id: `cards:bcs-next:${card}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:bcs-next',
    discipline: 'cards',
    prompt: `Hvilket kort følger efter ${accessibleCardName(card)}?`,
    parameters: { skill: 'next-card', answer, currentCard: card, targetCard: answer },
    choices: cardChoices(answer, seed),
    visual: { card, label: 'Nuværende kort', primary: '→ ?', secondary: 'brug hele BCS-reglen' },
    explanation: `${accessibleCardName(answer)} følger efter ${accessibleCardName(card)} i BCS.`,
    hints: nextCardHints(card, answer),
  };
}

function createPreviousCardExercise(seed: number): CardsExercise {
  const card = BCS_STACK[normalizedSeed(seed) % 52]!;
  const answer = previousBcsCard(card);
  return {
    id: `cards:bcs-previous:${card}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:bcs-previous',
    discipline: 'cards',
    prompt: `Hvilket kort står lige før ${accessibleCardName(card)}?`,
    parameters: { skill: 'previous-card', answer, currentCard: card, targetCard: answer },
    choices: cardChoices(answer, seed),
    visual: { card, label: 'Nuværende kort', primary: '? ←', secondary: 'find naboen baglæns' },
    explanation: `${accessibleCardName(answer)} står lige før ${accessibleCardName(card)}. Fremadreglen fra ${accessibleCardName(answer)} giver netop ${accessibleCardName(card)}.`,
    hints: [
      {
        id: 'reverse-meaning',
        label: 'Vend spørgsmålet om',
        content: `Du leder efter det kort, hvis almindelige BCS-regel ender på ${accessibleCardName(card)}.`,
      },
      ...nextCardHints(answer, card).slice(0, 3),
      answerHint(`Det forrige kort er ${accessibleCardName(answer)}.`),
    ],
  };
}

function createMultiForwardExercise(seed: number): CardsExercise {
  const card = BCS_STACK[normalizedSeed(seed) % 52]!;
  const offset = 2 + (Math.floor(normalizedSeed(seed) / 52) % 4);
  const answer = cardAtOffset(card, offset);
  const route = Array.from({ length: offset }, (_, index) => cardAtOffset(card, index + 1));
  return {
    id: `cards:bcs-forward:${offset}:${card}:${normalizedSeed(seed)}`,
    learningUnitId: `cards:bcs-forward:${offset}`,
    discipline: 'cards',
    prompt: `Hvilket kort ligger ${offset} pladser efter ${accessibleCardName(card)}?`,
    parameters: { skill: 'multi-forward', answer, currentCard: card, targetCard: answer, offset },
    choices: cardChoices(answer, seed),
    visual: { card, label: 'Følg kæden', primary: `+${offset}`, secondary: 'kort frem' },
    explanation: `Kæden er ${route.map(accessibleCardName).join(' → ')}. Derfor lander du på ${accessibleCardName(answer)}.`,
    hints: [
      {
        id: 'first-step',
        label: 'Tag første skridt',
        content: `Det første kort er ${accessibleCardName(route[0]!)}.`,
      },
      {
        id: 'route',
        label: 'Vis kæden næsten færdig',
        content: route.slice(0, -1).map(accessibleCardName).join(' → '),
      },
      answerHint(`Efter ${offset} skridt står ${accessibleCardName(answer)}.`),
    ],
  };
}

function createCardToPositionExercise(seed: number, targetIndex: number): CardsExercise {
  const card = BCS_STACK[targetIndex]!;
  const answer = targetIndex + 1;
  return {
    id: `cards:card-to-position:${card}:${normalizedSeed(seed)}`,
    learningUnitId: `cards:card-to-position:${card}`,
    discipline: 'cards',
    prompt: `Hvilken MBCS-position har ${accessibleCardName(card)}?`,
    parameters: {
      skill: 'card-to-position',
      answer: String(answer),
      currentCard: card,
      position: answer,
    },
    choices: positionChoices(answer, seed),
    visual: {
      card,
      label: 'Kort → position',
      primary: '#?',
      secondary: 'svar uden at tælle fra toppen',
    },
    explanation: `${accessibleCardName(card)} har den faste position ${answer}.`,
    hints: [
      {
        id: 'direction',
        label: 'Hold retningen ren',
        content:
          'Opgaven går fra kort til tal. Prøv at hente tallet direkte frem som én forbindelse.',
      },
      answerHint(`${accessibleCardName(card)} = position ${answer}.`),
    ],
  };
}

function createPositionToCardExercise(seed: number, targetIndex: number): CardsExercise {
  const position = targetIndex + 1;
  const card = cardAtPosition(position);
  return {
    id: `cards:position-to-card:${position}:${normalizedSeed(seed)}`,
    learningUnitId: `cards:position-to-card:${position}`,
    discipline: 'cards',
    prompt: `Hvilket kort ligger på MBCS-position ${position}?`,
    parameters: { skill: 'position-to-card', answer: card, targetCard: card, position },
    choices: cardChoices(card, seed),
    visual: {
      label: 'Position → kort',
      primary: String(position),
      secondary: 'find kortet direkte',
    },
    explanation: `Position ${position} er ${accessibleCardName(card)}.`,
    hints: [
      {
        id: 'direction',
        label: 'Hold retningen ren',
        content:
          'Opgaven går fra tal til kort. Det er en anden hukommelsesforbindelse end kort til tal.',
      },
      answerHint(`Position ${position} = ${accessibleCardName(card)}.`),
    ],
  };
}

function createCyclicOffsetExercise(seed: number): CardsExercise {
  const position = 1 + (normalizedSeed(seed) % 52);
  if (Math.floor(normalizedSeed(seed) / 52) % 2 === 1) {
    const distance = 3 + (Math.floor(normalizedSeed(seed) / 104) % 40);
    const targetPosition = cyclicOffset(position, distance);
    return {
      id: `cards:cyclic-offsets:distance:${position}:${targetPosition}:${normalizedSeed(seed)}`,
      learningUnitId: 'cards:cyclic-offsets:forward-distance',
      discipline: 'cards',
      prompt: `Hvor mange pladser er der fremad fra position ${position} til position ${targetPosition}?`,
      parameters: {
        skill: 'cyclic-offsets',
        answer: String(distance),
        position,
        targetPosition,
        offset: distance,
        variant: 'forward-distance',
      },
      choices: countChoices(distance, seed),
      visual: {
        label: 'Afstand fremad',
        primary: `#${position} → #${targetPosition}`,
        secondary: 'gå gennem 52 og videre til 1',
      },
      explanation: `Fra ${position} går du ${52 - position} pladser til 52 og derefter videre til ${targetPosition}. Det er ${distance} pladser fremad i alt.`,
      hints: [
        {
          id: 'straight-or-wrap',
          label: 'Se om du passerer 52',
          content:
            targetPosition > position
              ? 'Målet ligger højere, så træk startpositionen fra målpositionen.'
              : 'Målet ligger lavere, så turen passerer position 52 og fortsætter ved 1.',
        },
        {
          id: 'calculation',
          label: 'Stil regnestykket op',
          content:
            targetPosition > position
              ? `${targetPosition} − ${position}`
              : `52 − ${position} + ${targetPosition}`,
        },
        answerHint(`Afstanden fremad er ${distance}.`),
      ],
    };
  }

  const offsets = [-15, -9, -5, 4, 7, 12, 18] as const;
  const offset = offsets[Math.floor(normalizedSeed(seed) / 52) % offsets.length]!;
  const answer = cyclicOffset(position, offset);
  return {
    id: `cards:cyclic-offsets:${position}:${offset}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:cyclic-offsets',
    discipline: 'cards',
    prompt: `Du står på position ${position} og går ${Math.abs(offset)} ${offset < 0 ? 'tilbage' : 'frem'}. Hvor lander du?`,
    parameters: {
      skill: 'cyclic-offsets',
      answer: String(answer),
      position,
      offset,
      variant: 'move-offset',
    },
    choices: positionChoices(answer, seed),
    visual: {
      label: 'Stakken er en cirkel',
      primary: `${offset > 0 ? '+' : ''}${offset}`,
      secondary: `fra position ${position}`,
    },
    explanation: `${position} ${offset < 0 ? '−' : '+'} ${Math.abs(offset)} føres rundt mellem 1 og 52 og giver position ${answer}.`,
    hints: [
      {
        id: 'ordinary',
        label: 'Regn først som normalt',
        content: `${position} ${offset < 0 ? '−' : '+'} ${Math.abs(offset)} = ${position + offset}.`,
      },
      {
        id: 'wrap',
        label: 'Før resultatet ind i stakken',
        content: 'Er resultatet over 52, trækker du 52 fra. Er det under 1, lægger du 52 til.',
      },
      answerHint(`Du lander på position ${answer}.`),
    ],
  };
}

function createCutsAndTargetsExercise(seed: number): CardsExercise {
  const variant = (normalizedSeed(seed) % 3) as 0 | 1 | 2;
  if (variant === 0) {
    const position = 1 + (Math.floor(normalizedSeed(seed) / 3) % 52);
    const cutSize = 3 + (Math.floor(normalizedSeed(seed) / 156) % 18);
    const answer = positionAfterCut(position, cutSize);
    return {
      id: `cards:cuts-and-targets:follow-cut:${position}:${cutSize}:${normalizedSeed(seed)}`,
      learningUnitId: 'cards:cuts-and-targets:follow-cut',
      discipline: 'cards',
      prompt: `Et kort lå på position ${position}. Du flytter de øverste ${cutSize} kort samlet til bunden. Hvor ligger kortet nu?`,
      parameters: {
        skill: 'cuts-and-targets',
        answer: String(answer),
        position,
        cutSize,
        variant: 'follow-cut',
      },
      choices: positionChoices(answer, seed),
      visual: {
        label: 'Følg et cut',
        primary: `−${cutSize}`,
        secondary: `fra position ${position}`,
      },
      explanation: `Et cut på ${cutSize} flytter den gamle position ${position} til ${answer}. Stakken er stadig i samme cykliske orden; kun toppen er flyttet.`,
      hints: [
        {
          id: 'subtract',
          label: 'Træk cuttet fra',
          content: `${position} − ${cutSize} = ${position - cutSize}.`,
        },
        {
          id: 'wrap',
          label: 'Gå rundt om bunden',
          content: 'Hvis resultatet er under 1, lægger du 52 til.',
        },
        answerHint(`Kortets nye position er ${answer}.`),
      ],
    };
  }

  if (variant === 1) {
    const position = 1 + (Math.floor(normalizedSeed(seed) / 3) % 52);
    const cutSize = 3 + (Math.floor(normalizedSeed(seed) / 156) % 18);
    const targetPosition = positionAfterCut(position, cutSize);
    const card = cardAtPosition(position);
    const answer = cutSizeForTarget(position, targetPosition);
    return {
      id: `cards:cuts-and-targets:cut-to-target:${position}:${targetPosition}:${normalizedSeed(seed)}`,
      learningUnitId: 'cards:cuts-and-targets:cut-to-target',
      discipline: 'cards',
      prompt: `${accessibleCardName(card)} ligger på position ${position}. Hvor mange topkort skal flyttes samlet til bunden for at få kortet til position ${targetPosition}?`,
      parameters: {
        skill: 'cuts-and-targets',
        answer: String(answer),
        currentCard: card,
        position,
        targetPosition,
        cutSize: answer,
        variant: 'cut-to-target',
      },
      choices: countChoices(answer, seed),
      visual: {
        card,
        label: 'Flyt til mål',
        primary: `#${position} → #${targetPosition}`,
        secondary: 'hvor stort et cut?',
      },
      explanation: `${position} − ${targetPosition} = ${position - targetPosition}. Ført ind i området 0–51 giver det et cut på ${answer} kort.`,
      hints: [
        {
          id: 'difference',
          label: 'Find forskellen',
          content: `Træk målpositionen ${targetPosition} fra kortets nuværende position ${position}.`,
        },
        {
          id: 'wrap',
          label: 'Brug hele stakken',
          content:
            'Er forskellen negativ, lægger du 52 til. Et cut på 0 betyder, at kortet allerede ligger rigtigt.',
        },
        answerHint(`Flyt de øverste ${answer} kort samlet til bunden.`),
      ],
    };
  }

  const removedCards = 1 + (Math.floor(normalizedSeed(seed) / 3) % 15);
  const answer = topCardAfterRemoving(removedCards);
  return {
    id: `cards:cuts-and-targets:removed-top:${removedCards}:${normalizedSeed(seed)}`,
    learningUnitId: 'cards:cuts-and-targets:removed-top',
    discipline: 'cards',
    prompt: `De øverste ${removedCards} kort er taget helt væk. Hvilket kort ligger nu øverst?`,
    parameters: {
      skill: 'cuts-and-targets',
      answer,
      targetCard: answer,
      removedCards,
      variant: 'removed-top',
    },
    choices: cardChoices(answer, seed),
    visual: {
      label: 'Kort fjernet',
      primary: String(removedCards),
      secondary: `${52 - removedCards} kort tilbage`,
    },
    explanation: `Når ${removedCards} kort er fjernet, bliver den oprindelige position ${removedCards + 1} det nye topkort: ${accessibleCardName(answer)}. Det er ikke et cut, fordi kortene ikke lægges tilbage i bunden.`,
    hints: [
      {
        id: 'new-position',
        label: 'Find den gamle position',
        content: `Det nye topkort var oprindeligt nummer ${removedCards + 1}.`,
      },
      answerHint(`Det nye topkort er ${accessibleCardName(answer)}.`),
    ],
  };
}

function mbcsUnitId(skill: CardsSkillId, targetIndex: number): string | null {
  if (skill === 'card-to-position') return `cards:card-to-position:${BCS_STACK[targetIndex]!}`;
  if (skill === 'position-to-card') return `cards:position-to-card:${targetIndex + 1}`;
  return null;
}

export function recommendMbcTarget(
  skill: CardsSkillId,
  mastery: MasteryRecord[],
  scheduled: ScheduledLearningUnit[],
  seed = Date.now(),
  now = new Date()
): number {
  const candidates = Array.from({ length: 52 }, (_, index) => ({
    index,
    unitId: mbcsUnitId(skill, index),
  })).filter((candidate): candidate is { index: number; unitId: string } =>
    Boolean(candidate.unitId)
  );
  if (!candidates.length) return normalizedSeed(seed) % 52;

  const masteryById = new Map(mastery.map((record) => [record.learningUnitId, record]));
  const scheduledById = new Map(scheduled.map((card) => [card.learningUnitId, card]));
  const due = candidates
    .filter((candidate) => {
      const card = scheduledById.get(candidate.unitId);
      return card && new Date(card.due).getTime() <= now.getTime();
    })
    .sort(
      (a, b) =>
        (masteryById.get(a.unitId)?.strength ?? 0) - (masteryById.get(b.unitId)?.strength ?? 0) ||
        a.index - b.index
    );
  if (due[0]) return due[0].index;

  const start = normalizedSeed(seed) % 52;
  for (let offset = 0; offset < 52; offset += 1) {
    const candidate = candidates[(start + offset) % 52]!;
    if (!masteryById.has(candidate.unitId)) return candidate.index;
  }

  return [...candidates].sort(
    (a, b) =>
      (masteryById.get(a.unitId)?.strength ?? 0) - (masteryById.get(b.unitId)?.strength ?? 0) ||
      a.index - b.index
  )[0]!.index;
}

export function createCardsExercise(
  skill: CardsSkillId,
  seed = Date.now(),
  targetIndex = normalizedSeed(seed) % 52
): CardsExercise {
  if (skill === 'suit-values') return createSuitValueExercise(seed);
  if (skill === 'rank-reduction') return createRankReductionExercise(seed);
  if (skill === 'suit-relationship') return createSuitRelationshipExercise(seed);
  if (skill === 'next-card') return createNextCardExercise(seed);
  if (skill === 'previous-card') return createPreviousCardExercise(seed);
  if (skill === 'multi-forward') return createMultiForwardExercise(seed);
  if (skill === 'card-to-position') return createCardToPositionExercise(seed, targetIndex);
  if (skill === 'position-to-card') return createPositionToCardExercise(seed, targetIndex);
  if (skill === 'cyclic-offsets') return createCyclicOffsetExercise(seed);
  return createCutsAndTargetsExercise(seed);
}
