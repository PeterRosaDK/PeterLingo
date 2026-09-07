# Flashkort

`engine.ts` defines `FlashcardDeck`, `DeckUnit`, `GenerationContext`, `CardContent` and `Flashcard`.
Decks expose metadata, directions, subsets, stable LearningUnits and a deterministic generator
when supplied the same random source/context. Front/back support text, Hanzi, pinyin/secondary
text, numbers, flag Unicode, local image and future audio references. No arbitrary HTML is rendered.

- Static: HSK records and `decks/countries.json` have one unit per record/direction.
- Generated: conversions use exactly four `flashcards:conversion:skill:<direction>` IDs. Values,
  exact result and difficulty are attempt parameters, never new FSRS IDs.
- `deckSettings` stores enabled/subsets/directions in snapshot v2; disabling removes cards from
  daily eligibility, including already-due cards, without deleting history. Free practice remains
  available in disabled decks. Existing JSON backup includes selections; cloud settings sync is
  outside the existing conflict contract.

The flip button works with touch, Enter and Space. Danish ratings map 1:1 to existing FSRS grades:
Kunne ikke→again, Næsten→hard, Kunne→good, Let→easy. Normal reveal follows mental recall and does
not count as an answer hint. Self-report latency is stored but not graded as fluency. Good/Easy
are counted as complete recall; Hard is partial. See ADR 0003.

To add a deck, add ordinary records/generation rules under `decks`, implement the contract and
register in `decks`. Preserve immutable word IDs and independent directions. Audio fields are
reserved; no TTS runs during training. Region filtering already works for Europe/Asia.

## HSK provenance and available content

Official research checked 2026-09-07:

- [MOE GF0025-2021 announcement](https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html)
  describes the three-band/nine-level educational standard effective 2021-07-01.
- [ChineseTest syllabus portal](https://www.chinesetest.cn/syllabus) links the **HSK Examination
  Syllabus**, issued November 2025, effective July 2026 according to its cover. This is versioned
  here as `HSK-3.0-2025-11`, not mislabeled GF0025-2021.
- Portal levels are 1, 2, 3, 4, 5, 6 and the combined **7–9** group. The importer preserves the
  group; it never invents independent membership in levels 7, 8 or 9.
- `decks/hsk.json` ships all **11,000 numbered records**: levels 1/2/3/4/5/6/7–9
  contain 300/200/500/1,000/1,600/1,800/5,600 newly introduced records respectively.
- Six independent directions connect Hanzi, pinyin and meaning. Eight unresolved dictionary
  readings are pinyin-only. 106 common level-1 words have editorial Danish meanings; the rest
  use CC-CEDICT English where available. The UI identifies the language explicitly.
- New settings default to level 1 and Hanzi→meaning. Persisted selections and existing seed
  LearningUnit IDs survive unchanged. Level 7–9 remains one group, never three invented lists.
- Shared immutable catalogs and indexed lookup avoid repeated 66,000-unit allocation/scans.
  FSRS still stores only items actually studied. The complete dictionary is precached offline.

See [the reproducible importer](../../../tools/hsk/README.md) for the licensed Mani transcription,
official cross-check, pinned hashes, Danish editorial policy and unresolved readings. The dataset
and adapted Danish layer use CC BY-SA 4.0; no official PDF is bundled.

## Geography and conversions

12 small country/capital records, 36 direction items, Europe/Asia filters. Flags use Unicode
regional indicator pairs rendered by the platform, no downloaded flag artwork or runtime CDN.
Some Windows font stacks show regional letters instead of flag glyphs; a local SVG fallback is
future work. Country/capital facts use Danish display names. Sources: Nordic Statistics capital
areas, EU country profiles, and standard national country profiles; no article text is copied.

Conversions use exact 1 mi = 1.609344 km and exact Celsius/Fahrenheit formulas. Beginners receive
whole Celsius anchors and distance multiples of five. Later values use unit steps. Answers are
rounded to two decimal places when necessary and explicitly labelled; exact results/formulas are
retained. Numeric input, approximation teaching, deck import/export and authored decks are later.
