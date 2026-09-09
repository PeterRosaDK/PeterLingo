# Third-party notices

PeterLingo itself is GPL-3.0. This file records material dependencies and all assets copied into the repository.

## Osterlind Breakthrough Card System

The card curriculum implements the mathematical cycle publicly known as Richard Osterlind's
Breakthrough Card System and preserves that attribution. PeterLingo contains its own educational
wording and code; it does not reproduce Osterlind's performance routines or publication text.

## Pi decimal source

- Sequence: OEIS A000796, decimal expansion of pi
- Source: <https://oeis.org/A000796>
- Bundled range: the first 500 decimal places, excluding the integer 3

The bundled string was compared directly with terms 2–501 of the OEIS b-file. Mathematical digits
are factual data; the source is retained for reproducibility and position semantics.

## OpenDecks playing cards

- Project: `AustinGabriel/OpenDecks-Public-Domain-and-CC0-Playing-Cards`
- Source: <https://github.com/AustinGabriel/OpenDecks-Public-Domain-and-CC0-Playing-Cards>
- Reviewed/vendor commit: `0311b769090eaca2bd9b49de9d4480c1bba5f976`
- Vendored files: all 54 SVG faces and two SVG backs under `public/assets/cards/`
- License: CC0 1.0 Universal / public-domain dedication
- Local license: `public/assets/cards/LICENSE-OpenDecks`

The upstream author credits public-domain/CC0 court cards, pips, rank glyphs, joker art, and card backs in the upstream README. Attribution is not required, but PeterLingo preserves this provenance deliberately.

## smartcube-web-bluetooth

- Project: `poliva/smartcube-web-bluetooth`
- Source: <https://github.com/poliva/smartcube-web-bluetooth>
- Pinned commit: `44f1f091c6e980d9cc31e6d2863c4437eca3ab3c`
- Package version at that commit: 4.0.0
- License: MIT, copyright Pau Oliva and Andy Fedotov

Installed as a dependency; no source was copied into PeterLingo. The pinned generic API supports GoCube/Rubik's Connected alongside other smart cubes.

## Runtime libraries

| Project         | Version | License                     | Purpose                                     |
| --------------- | ------: | --------------------------- | ------------------------------------------- |
| React           |  19.2.8 | MIT                         | Interface                                   |
| ts-fsrs         |   5.4.1 | MIT                         | FSRS scheduling behind PeterLingo's adapter |
| cubing.js       |  0.63.3 | MPL-2.0 OR GPL-3.0-or-later | Cube state, visualization, recovery solving |
| @beacio/core    |   1.2.0 | MIT                         | Early iOS Safari Web Bluetooth path         |
| Tone.js         | 15.1.22 | MIT                         | Web Audio abstraction                       |
| VexFlow         |   5.0.0 | MIT                         | Short notation rendering                    |
| idb             |   8.0.3 | ISC                         | IndexedDB promise adapter                   |
| vite-plugin-pwa |   1.3.0 | MIT                         | Service worker and web manifest             |

The lockfile is the authoritative complete dependency graph and retains package license metadata.

## Reused Roux solver code

None in Milestone 0. No code from `wodzik/cube` or another Roux solver has been copied or claimed.
The current non-Roux recovery path calls cubing.js's packaged two-phase solver through the existing
library boundary; its bundled min2phase component is marked MIT in the cubing.js source.
PeterLingo adds validation and user guidance but does not copy its solver code.

## HSK vocabulary (0.3.0)

- Licensed HSK word transcription: Mani, [krmanik/HSK-3.0](https://github.com/krmanik/HSK-3.0),
  commit `182692ce5a11bc30bdc771835d2f0f27491c25de`, **CC BY-SA 4.0**.
  Pinned upstream notice: `tools/hsk/SOURCE_LICENSE.md`.
- CC-CEDICT community, published by MDBG, release 2026-09-07T08:01:26Z,
  <https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz>, **CC BY-SA 4.0**.
- Adaptation: 11,000 licensed vocabulary records cross-checked against ChineseTest's November
  2025 syllabus (effective July 2026); official record IDs/initial levels/pronunciation retained,
  compatible English dictionary senses joined, 106 selected senses translated into Danish.
- `src/modules/flashcards/decks/hsk.json` and `hsk-da.json`, including these adaptations, are
  **CC BY-SA 4.0**, <https://creativecommons.org/licenses/by-sa/4.0/>. Preserve these credits and
  the license when redistributing. Hashes, reproduction and unresolved meanings are documented
  in `tools/hsk/README.md` and `hsk-provenance.json`.
- Official verification source: <https://www.chinesetest.cn/syllabus>. No official PDF or its
  creative instructional/exam text is distributed. GF0025-2021 is a separate standard.

## Human IPA audio and derived spectrograms (0.3.0)

Denelson83, Wikimedia Commons, **CC BY-SA 3.0**, chosen from the offered dual licenses:

- <https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg>
- <https://commons.wikimedia.org/wiki/File:Close_front_rounded_vowel.ogg>
- <https://commons.wikimedia.org/wiki/File:Close_back_rounded_vowel.ogg>

License: <https://creativecommons.org/licenses/by-sa/3.0/>. Adaptations: mono 16-bit PCM WAV at
16 kHz and generated mel-spectrogram PNGs, `public/assets/phonetics/human-*`. These adaptations
retain CC BY-SA 3.0. Source URLs, original and output hashes are in the phonetics manifest;
`tools/phonetics-dataset/import_commons.py` reproduces them with ffmpeg (development only).
These are human isolated IPA demonstrations, not recordings of native Danish example words.
PeterLingo's Danish teaching text is original; background reading: Ruben Schachtenhaufen,
<https://schwa.dk/lydskrift/>. No proprietary IPA association recordings are distributed.

## Chemical facts and Lehrer sequence

118 symbols, atomic numbers and names checked against IUPAC and Kemisk Forenings
Nomenklaturudvalg (table 1 and Ture Damhus, Dansk Kemi 100/2, 2019). Initial English/position facts
were extracted from <https://github.com/Bowserinator/Periodic-Table-JSON>; no Wikipedia prose,
images, atomic-mass tables or upstream software are included. Module README links primary sources.

The 102-name original song order follows Tom Lehrer's own lyric sheet. Lehrer permanently
relinquished his song copyrights: <https://tomlehrersongs.org/>. No audio recording or full lyric
sheet is included in PeterLingo; local user-selected recordings remain on the device.

## Morse, geography and phonetics

Morse character facts and timing ratios follow ITU-R M.1677. No ITU document or audio is copied.
Country/capital pairs are factual records; Unicode flag pairs use platform glyphs, not vendored art.
The five synthetic phonetics signals and spectrograms are original project assets (GPL-3.0).
Python snippets/explanations are original project content (GPL-3.0).

Optional development tools: pypdf (BSD-3-Clause), NumPy (BSD-3-Clause), Matplotlib (PSF-based
Matplotlib license). Pinned in `tools/requirements-data.txt`; they are not runtime dependencies.
There are no new npm dependencies.

## Complete country deck and flags (0.5.0)

- mledoze/countries, commit `c8015eebdd94c533358406b0d709f441389e1f2e`,
  <https://github.com/mledoze/countries>, **ODbL 1.0**. The 197-record adapted database,
  Danish exonyms and capital/status annotations retain ODbL. The database and full license
  are offered inside the app under `/assets/data/countries.json` and `countries-LICENSE.txt`.
- UNData and national/authoritative sources cross-check factual memberships and capitals;
  sources, corrections and pinned hashes are in `tools/countries/README.md` and `provenance.json`.
- Unicode CLDR 48 Danish territory names through Node Intl.DisplayNames,
  <https://cldr.unicode.org/>, Unicode License v3, <https://www.unicode.org/license.txt>.
- flag-icons, copyright (c) 2013 Panayiotis Lipiridis, **MIT**, commit
  `086f7e97d657358203916dbe84f61c2bccaa81eb`, <https://github.com/lipis/flag-icons>.
  197 original 4:3 SVGs and the complete license are in `public/assets/flags/`.

No additional npm dependencies or runtime data services are used.
