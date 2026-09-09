import type { LearningUnit, ProgressiveHint } from '../../learning/types';
import type { Settings } from '../../persistence/types';
import countries from './decks/countries.json';
import hskData from './decks/hsk.json';
import { unit } from '../shared/recall';
export interface HskWord {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  meaningsDa: string[];
  meaningsEn: string[];
  hskStandard: string;
  hskLevel: string;
  audio?: string;
}
export const hskWords = hskData as HskWord[];
export interface CardContent {
  text: string;
  secondary?: string;
  kind?: 'text' | 'hanzi' | 'flag' | 'number';
  image?: string;
  audio?: string;
}
export interface Flashcard {
  front: CardContent;
  back: CardContent;
  direction: string;
  hints?: ProgressiveHint[];
  metadata: Record<string, unknown>;
}
export interface DeckUnit extends LearningUnit {
  deckId: string;
  subset: string;
  direction: string;
  recordId: string;
}
export interface GenerationContext {
  random: () => number;
  difficulty: number;
}
export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  directions: { id: string; label: string }[];
  getSubsets(): string[];
  getLearningUnits(): DeckUnit[];
  generateCard(unit: DeckUnit, context: GenerationContext): Flashcard;
}
function deckUnit(
  deckId: string,
  recordId: string,
  direction: string,
  subset: string,
  title: string
): DeckUnit {
  return {
    ...unit(`${deckId}:${recordId}:${direction}`, 'flashcards', title),
    deckId,
    recordId,
    direction,
    subset,
  };
}
const countryDirections = [
  { id: 'country_to_capital', label: 'Land → hovedstad' },
  { id: 'capital_to_country', label: 'Hovedstad → land' },
  { id: 'flag_to_country', label: 'Flag → land' },
];
export const countryDeck: FlashcardDeck = {
  id: 'countries',
  title: '🌍 Lande',
  description: '197 lande · seks verdensdele',
  directions: countryDirections,
  getSubsets: () => ['Europa', 'Asien', 'Afrika', 'Nordamerika', 'Sydamerika', 'Oceanien'],
  getLearningUnits: () =>
    countries.flatMap((c) =>
      countryDirections.map((d) =>
        deckUnit('countries', c.id, d.id, c.region, `${c.country} · ${d.label}`)
      )
    ),
  generateCard(u) {
    const c = countries.find((c) => c.id === u.recordId)!;
    return {
      front: {
        text:
          u.direction === 'country_to_capital'
            ? c.country
            : u.direction === 'capital_to_country'
              ? c.capital
              : c.flag,
        kind: u.direction === 'flag_to_country' ? 'flag' : 'text',
        image: u.direction === 'flag_to_country' ? c.flagSvg : undefined,
      },
      back: {
        text: u.direction === 'country_to_capital' ? c.capital : c.country,
        secondary: [u.direction === 'country_to_capital' ? '' : `Hovedstad: ${c.capital}`, c.note]
          .filter(Boolean)
          .join(' · '),
      },
      direction: u.direction,
      metadata: { deckId: u.deckId, subset: u.subset, countryId: c.id },
      hints: [
        { id: 'region', label: 'Verdensdel', content: c.region },
        {
          id: 'initial',
          label: 'Begyndelsesbogstav',
          content: (u.direction === 'country_to_capital' ? c.capital : c.country)[0]!,
        },
      ],
    };
  },
};
const hskDirections = [
  { id: 'hanzi_to_meaning', label: 'Hanzi → betydning' },
  { id: 'meaning_to_hanzi', label: 'Betydning → Hanzi' },
  { id: 'hanzi_to_pinyin', label: 'Hanzi → pinyin' },
  { id: 'pinyin_to_hanzi', label: 'Pinyin → Hanzi' },
  { id: 'pinyin_to_meaning', label: 'Pinyin → betydning' },
  { id: 'meaning_to_pinyin', label: 'Betydning → pinyin' },
];
const hskById = new Map(hskWords.map((w) => [w.id, w]));
export const hskDeck: FlashcardDeck = {
  id: 'hsk',
  title: '🇨🇳 HSK',
  description: '11.000 ord · HSK 3.0 (2025) · dansk med engelsk fallback',
  directions: hskDirections,
  getSubsets: () => [...new Set(hskWords.map((w) => `${w.hskStandard}/${w.hskLevel}`))],
  getLearningUnits: () =>
    hskWords.flatMap((w) =>
      hskDirections
        .filter((d) => !d.id.includes('meaning') || w.meaningsDa.length + w.meaningsEn.length > 0)
        .map((d) =>
          deckUnit(
            'hsk',
            w.id,
            d.id,
            `${w.hskStandard}/${w.hskLevel}`,
            `${w.simplified} · ${d.label}`
          )
        )
    ),
  generateCard(u) {
    const w = hskById.get(u.recordId)!;
    const meaning = (w.meaningsDa.length ? w.meaningsDa : w.meaningsEn).join('; ');
    const fields: Record<string, CardContent> = {
      hanzi: { text: w.simplified, kind: 'hanzi' },
      pinyin: { text: w.pinyin },
      meaning: {
        text: meaning,
        secondary: w.meaningsDa.length ? 'Dansk · redaktionelt udvalg' : 'Engelsk · CC-CEDICT',
      },
    };
    const [front, back] = u.direction.split('_to_');
    return {
      front: fields[front!]!,
      back: {
        ...fields[back!]!,
        secondary: [
          fields[back!]!.secondary,
          back === 'hanzi'
            ? w.pinyin
            : back === 'meaning'
              ? `${w.simplified} · ${w.pinyin}`
              : w.simplified,
        ]
          .filter(Boolean)
          .join(' · '),
      },
      direction: u.direction,
      metadata: {
        deckId: u.deckId,
        subset: u.subset,
        wordId: w.id,
        standard: w.hskStandard,
        level: w.hskLevel,
      },
    };
  },
};
export const conversions = [
  {
    id: 'F-to-C',
    label: 'Fahrenheit → Celsius',
    from: '°F',
    to: '°C',
    formula: '°C = (°F − 32) × 5/9',
    convert: (n: number) => ((n - 32) * 5) / 9,
  },
  {
    id: 'C-to-F',
    label: 'Celsius → Fahrenheit',
    from: '°C',
    to: '°F',
    formula: '°F = °C × 9/5 + 32',
    convert: (n: number) => (n * 9) / 5 + 32,
  },
  {
    id: 'mi-to-km',
    label: 'Miles → kilometer',
    from: 'mi',
    to: 'km',
    formula: 'km = miles × 1,609344',
    convert: (n: number) => n * 1.609344,
  },
  {
    id: 'km-to-mi',
    label: 'Kilometer → miles',
    from: 'km',
    to: 'mi',
    formula: 'miles = km / 1,609344',
    convert: (n: number) => n / 1.609344,
  },
];
export const conversionDeck: FlashcardDeck = {
  id: 'conversion',
  title: '📐 Omregninger',
  description: 'Regn mentalt · ét FSRS-item pr. retning',
  directions: conversions.map((c) => ({ id: c.id, label: c.label })),
  getSubsets: () => ['temperatur', 'afstand'],
  getLearningUnits: () =>
    conversions.map((c) =>
      deckUnit(
        'conversion',
        'skill',
        c.id,
        c.id.includes('to-C') || c.id.includes('to-F') ? 'temperatur' : 'afstand',
        c.label
      )
    ),
  generateCard(u, ctx) {
    const c = conversions.find((c) => c.id === u.direction)!;
    const step = ctx.difficulty < 0.68 ? 5 : 1;
    let input = (Math.floor(ctx.random() * 17) - 4) * step;
    if (c.id === 'F-to-C') input = (input * 9) / 5 + 32;
    if (c.id.includes('mi'))
      input = (Math.floor(ctx.random() * 20) + 1) * (ctx.difficulty < 0.68 ? 5 : 1);
    const output = c.convert(input);
    return {
      front: { text: `${Number(input.toFixed(2))} ${c.from}`, kind: 'number' },
      back: {
        text: `${Number(output.toFixed(2))} ${c.to}`,
        secondary: `${c.formula}${Number(output.toFixed(2)) !== output ? ' · afrundet til 2 decimaler' : ''}`,
        kind: 'number',
      },
      direction: u.direction,
      hints: [
        { id: 'formula', label: 'Eksakt formel', content: c.formula },
        {
          id: 'answer',
          label: 'Facit',
          content: `${Number(output.toFixed(2))} ${c.to}`,
          revealsAnswer: true,
        },
      ],
      metadata: { deckId: u.deckId, subset: u.subset, input, output, difficulty: ctx.difficulty },
    };
  },
};
export const decks = [hskDeck, countryDeck, conversionDeck];
// Stable, shared catalogs: do not allocate 66,000 units on every render.
for (const deck of decks) {
  const subsets = deck.getSubsets();
  deck.getSubsets = () => subsets;
  const units = deck.getLearningUnits();
  deck.getLearningUnits = () => units;
}
export const flashcardUnits = decks.flatMap((d) => d.getLearningUnits());
const flashcardById = new Map(flashcardUnits.map((u) => [u.id, u]));
export function deckSelection(deck: FlashcardDeck, settings: Settings) {
  return (
    settings.deckSettings[deck.id] ?? {
      enabled: true,
      subsets: deck.id === 'hsk' ? deck.getSubsets().slice(0, 1) : deck.getSubsets(),
      directions: deck.id === 'hsk' ? ['hanzi_to_meaning'] : deck.directions.map((d) => d.id),
    }
  );
}
export function flashcardEnabled(id: string, settings: Settings) {
  const u = flashcardById.get(id);
  if (!u) return false;
  const d = decks.find((d) => d.id === u.deckId)!;
  const s = deckSelection(d, settings);
  return s.enabled && s.subsets.includes(u.subset) && s.directions.includes(u.direction);
}
