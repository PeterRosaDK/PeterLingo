# HSK 3.0 (2025) reproducible import

The complete local vocabulary is built from a licensed transcription by Mani
([krmanik/HSK-3.0](https://github.com/krmanik/HSK-3.0)), pinned to commit
`182692ce5a11bc30bdc771835d2f0f27491c25de`. Its HSK word lists are explicitly
CC BY-SA 4.0; the pinned upstream license is in `SOURCE_LICENSE.md`.

Download these inputs outside the repository:

- [Licensed 2025 transcription](https://raw.githubusercontent.com/krmanik/HSK-3.0/182692ce5a11bc30bdc771835d2f0f27491c25de/New%20HSK%20%282025%29/hsk_all_words.json).
- [Official ChineseTest syllabus](https://www.chinesetest.cn/syllabus), linked PDF:
  <https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf>.
- [CC-CEDICT](https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz),
  release 2026-09-07T08:01:26Z, CC BY-SA 4.0. This URL is mutable: compare SHA256 before reproducing.

Install `tools/requirements-data.txt` in a development venv, then run:

```sh
python tools/hsk/import.py --pdf /local/hsk.pdf --cedict /local/cedict.gz \
  --licensed /local/hsk_all_words.json --output src/modules/flashcards/decks/hsk.json
npx prettier --write src/modules/flashcards/decks
```

The importer asserts every word's membership in the licensed list and verifies all 11,000
numbered official records, including homographs and parenthesized later-level senses. It takes
factual pinyin, initial level and record numbers from the official table. No official PDF,
grammar explanations, exam examples or page layout is redistributed. Extra later-level senses
in the transcription do not create duplicate word records.

Dictionary matching first uses tone-marked pronunciation. A spacing/tone-convention fallback
is allowed only for an unambiguous dictionary reading. Eight records have unresolved meanings;
these retain official pinyin and can only train Hanzi↔pinyin. No guessed dictionary answer.
English definitions can include senses beyond the syllabus's particular part of speech.

`hsk-provenance.json` records exact hashes, level counts and the unresolved list.
`hsk-da.json` contains 106 small, editorial Danish translations of selected CC-CEDICT senses,
keyed by immutable official record ID. These are project translations, not an official Danish
HSK dictionary or a complete list of senses. Review additions against English senses and the
specific pronunciation; never mass-fill missing Danish meanings. The Danish layer and derived
HSK dataset are CC BY-SA 4.0. Existing seed IDs are retained unchanged.
