export type Suit = 'S' | 'H' | 'C' | 'D';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardCode = `${Rank}${Suit}`;

export interface PlayingCardData {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ['S', 'H', 'C', 'D'];
export const SUIT_VALUES: Record<Suit, number> = { S: 1, H: 2, C: 3, D: 4 };
export const PREVIOUS_SUIT: Record<Suit, Suit> = { S: 'D', H: 'S', C: 'H', D: 'C' };
export const NEXT_SUIT: Record<Suit, Suit> = { S: 'H', H: 'C', C: 'D', D: 'S' };
export const SAME_COLOUR_OPPOSITE: Record<Suit, Suit> = { S: 'C', C: 'S', H: 'D', D: 'H' };

export function parseCard(card: CardCode): PlayingCardData {
  const suit = card.at(-1) as Suit;
  const rank = Number(card.slice(0, -1)) as Rank;
  if (!SUITS.includes(suit) || rank < 1 || rank > 13 || !Number.isInteger(rank))
    throw new RangeError(`Ugyldigt kort: ${card}`);
  return { rank, suit };
}

export function formatCard({ rank, suit }: PlayingCardData): CardCode {
  return `${rank}${suit}`;
}

export interface BcsRankCalculation {
  doubled: number;
  reducedDouble: Rank;
  withSuitValue: number;
  result: Rank;
}

function reduceToRank(value: number): Rank {
  return (((value - 1) % 13) + 1) as Rank;
}

export function bcsRankCalculation(card: CardCode): BcsRankCalculation {
  const { rank, suit } = parseCard(card);
  const doubled = rank * 2;
  const reducedDouble = reduceToRank(doubled);
  const withSuitValue = reducedDouble + SUIT_VALUES[suit];
  return {
    doubled,
    reducedDouble,
    withSuitValue,
    result: reduceToRank(withSuitValue),
  };
}

export function nextBcsCard(card: CardCode): CardCode {
  const { suit } = parseCard(card);
  const newRank = bcsRankCalculation(card).result;
  let newSuit = suit;
  if (newRank >= 4 && newRank <= 6) newSuit = SAME_COLOUR_OPPOSITE[suit];
  else if (newRank >= 7 && newRank <= 9) newSuit = PREVIOUS_SUIT[suit];
  else if (newRank >= 10) newSuit = NEXT_SUIT[suit];
  return formatCard({ rank: newRank, suit: newSuit });
}

export const BCS_STACK: CardCode[] = (() => {
  const cards: CardCode[] = [];
  let current: CardCode = '1S';
  for (let index = 0; index < 52; index += 1) {
    cards.push(current);
    current = nextBcsCard(current);
  }
  if (new Set(cards).size !== 52 || cards[51] !== '13S' || current !== '1S')
    throw new Error('BCS-algoritmen dannede ikke den kanoniske cyklus.');
  return cards;
})();

export function cardAtPosition(position: number): CardCode {
  if (!Number.isInteger(position) || position < 1 || position > 52)
    throw new RangeError('Positionen skal være 1–52.');
  return BCS_STACK[position - 1]!;
}

export function positionOfCard(card: CardCode): number {
  const position = BCS_STACK.indexOf(card) + 1;
  if (position === 0) throw new RangeError(`Kortet findes ikke i BCS: ${card}`);
  return position;
}

export function cyclicOffset(position: number, offset: number): number {
  if (!Number.isInteger(position) || position < 1 || position > 52)
    throw new RangeError('Positionen skal være 1–52.');
  return ((((position - 1 + offset) % 52) + 52) % 52) + 1;
}

export function cardAtOffset(card: CardCode, offset: number): CardCode {
  if (!Number.isInteger(offset)) throw new RangeError('Afstanden skal være et helt tal.');
  return cardAtPosition(cyclicOffset(positionOfCard(card), offset));
}

export function previousBcsCard(card: CardCode): CardCode {
  return cardAtOffset(card, -1);
}

export function forwardDistance(from: CardCode, to: CardCode): number {
  return (positionOfCard(to) - positionOfCard(from) + 52) % 52;
}

export function positionAfterCut(position: number, cutSize: number): number {
  if (!Number.isInteger(cutSize) || cutSize < 0 || cutSize > 51)
    throw new RangeError('Et cut skal flytte 0–51 kort.');
  return cyclicOffset(position, -cutSize);
}

export function cutSizeForTarget(position: number, targetPosition: number): number {
  if (!Number.isInteger(targetPosition) || targetPosition < 1 || targetPosition > 52)
    throw new RangeError('Målpositionen skal være 1–52.');
  return (position - targetPosition + 52) % 52;
}

export function topCardAfterRemoving(removedCards: number): CardCode {
  if (!Number.isInteger(removedCards) || removedCards < 0 || removedCards > 51)
    throw new RangeError('Der skal være 0–51 fjernede topkort.');
  return cardAtPosition(removedCards + 1);
}

export const RANK_LABELS: Record<Rank, string> = {
  1: 'Es',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Knægt',
  12: 'Dame',
  13: 'Konge',
};
export const SUIT_LABELS: Record<Suit, string> = { S: 'spar', H: 'hjerter', C: 'klør', D: 'ruder' };
export function accessibleCardName(card: CardCode): string {
  const value = parseCard(card);
  return `${RANK_LABELS[value.rank]} ${SUIT_LABELS[value.suit]}`;
}
