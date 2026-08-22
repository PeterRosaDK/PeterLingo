import { accessibleCardName, parseCard, type CardCode, type Rank, type Suit } from './bcs';

interface PlayingCardProps {
  card: CardCode;
  face?: 'front' | 'back';
  flipped?: boolean;
  size?: 'small' | 'medium' | 'large';
  stacked?: boolean;
  dealt?: boolean;
}

const rankFiles: Record<Rank, string> = {
  1: 'ace',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'jack',
  12: 'queen',
  13: 'king',
};
const suitFiles: Record<Suit, string> = { S: 'spades', H: 'hearts', C: 'clubs', D: 'diamonds' };

export function cardAssetPath(card: CardCode): string {
  const { rank, suit } = parseCard(card);
  return `/assets/cards/fronts/${suitFiles[suit]}/${rankFiles[rank]}%20of%20${suitFiles[suit]}.svg`;
}

export function PlayingCard({
  card,
  face = 'front',
  flipped = false,
  size = 'medium',
  stacked = false,
  dealt = false,
}: PlayingCardProps) {
  const showBack = face === 'back' || flipped;
  const label = showBack ? 'Kort med bagsiden opad' : accessibleCardName(card);
  return (
    <span
      className={`playing-card ${size} ${stacked ? 'stacked' : ''} ${dealt ? 'dealt' : ''} ${showBack ? 'is-back' : ''}`}
      role="img"
      aria-label={label}
    >
      <img
        src={showBack ? '/assets/cards/backs/card%20back%20red.svg' : cardAssetPath(card)}
        alt=""
        draggable="false"
      />
    </span>
  );
}
