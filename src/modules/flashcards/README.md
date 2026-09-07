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
- `decks/hsk.json` ships **21 independently selected level-1 records**, 63 direction units.
  It is a usable start deck, not the complete official list. Only level 1 is currently available.
- Hanzi/pinyin and membership were cross-checked against official vocabulary table rows (printed
  pages 77–83). English dictionary entries are CC-CEDICT, MDBG release 2026-09-07T08:01:26Z,
  CC BY-SA 4.0; meaningsDa is empty. No Danish translations were generated.

The full official PDF carries no redistribution permission identified during this work; it and
bulk official vocabulary are **not** committed. The small locally selected dictionary sample
contains factual vocabulary annotations, not a copy of the full official table. CC-CEDICT-derived
records retain their own CC BY-SA license (see THIRD_PARTY_NOTICES).

## Reproducible explicit import

Install `tools/requirements-data.txt` into a development venv. Download the official linked PDF
and the [CC-CEDICT gzip](https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz)
to a local path outside the repository. Then:

```sh
python tools/hsk/import.py --pdf /local/hsk.pdf --cedict /local/cedict.gz \
  --seed --output src/modules/flashcards/decks/hsk.json
```

Without `--seed`, the tool extracts matching rows to the explicitly chosen output. Keep that
bulk output private pending redistribution permission. Ambiguous dictionary heteronyms are
omitted for review; the tool does not claim a complete 11,000-word translation/import.
Official combined levels, parenthesized later senses and multiword pinyin need human validation
before a larger content release. Existing output is a pinned seed; upstream “latest” is mutable.

Input SHA256 for this seed:

- PDF: `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`
- CC-CEDICT gzip: `cd81c0d253c82d4b1dc3ca2cfe4cd5fc46ca10b753743a80d783f3969ae11a23`

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
