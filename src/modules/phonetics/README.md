# Fonetik

`manifest.json` is the locally bundled, readable cache manifest: ID, language (da/en), IPA, label
class, tier, cue, synthesis provenance, asset paths and SHA256 digests. WAV/PNG assets live in
`public/assets/phonetics` and are PWA-precached. No endpoint is called during practice or build.

Stable IDs distinguish IPA transcription, spectrogram class recognition, and vowel reading.
The first tier produces a typed class (vokal/frikativ/plosiv). The second spectrogram tier asks
for /i y a u/ and uses shared LearningUnit prerequisites: all eight class units must have strength
at least 0.68. IPA uses normalized segments (including tie bars and combining diacritics), edit
distance, substitutions, insertions/deletions and diagnostic partial credit. Only exact segment
agreement is correct for the existing grading policy. Hints and revealed answers use normal policy.

There are three **human isolated IPA vowel recordings** [i y u] by Denelson83 (CC BY-SA 3.0),
plus five **synthetic acoustic fixtures**. This is not yet a native Danish word corpus.
The human records use language=da for teaching context/keyboard, not recording nationality. Three additive
formant vowel prototypes, high-passed noise and a stop burst demonstrate spectral structure.
Only vowels have IPA transcription drills; the stop burst is not misrepresented as a natural /p/.
The da/en inventories are separate editable keyboards, not claims of complete phoneme inventories.
Especially Danish needs a documented accent and transcription convention before real word labels
are admitted; these fixtures cannot verify Danish pronunciation or stød.

## Tooling

```sh
python3 -m venv /local/phonetics-venv
/local/phonetics-venv/bin/pip install -r tools/requirements-data.txt
/local/phonetics-venv/bin/python tools/phonetics-dataset/generate.py
/local/phonetics-venv/bin/python tools/phonetics-dataset/generate.py --validate
```

The input manifest is `tools/phonetics-dataset/manifest.json`. The generator creates local mono
16-bit WAV, a Hann-window STFT with triangular mel filters and an annotated PNG. Seeds are fixed.
The cache validator checks IDs, languages, paths and digests. To ingest actual speech, set
`PHONETICS_TTS_ENDPOINT` only during explicit generation. HTTP contract: POST JSON with text,
language and format=wav; response is mono 16-bit PCM WAV. Endpoint and credentials are not bundled.
No endpoint means synthetic fixture generation works and the app/build always uses committed data.

Real TTS labels require listening review: a TTS request is not proof of the waveform's IPA.
Future tiers: voiced/unvoiced with measured VOT, natural syllables/words, annotated formants,
and curated Danish/English recordings. Signal fixtures/images are original project assets,
GPL-3.0. Human WAV conversions and their derived spectrograms retain CC BY-SA 3.0; see
THIRD_PARTY_NOTICES and manifest per-record source/license/hash metadata.

## Human recordings and teaching

Run `python tools/phonetics-dataset/import_commons.py` with ffmpeg available after generating
fixtures; it downloads three explicitly licensed Commons recordings, converts to mono PCM and
uses the same mel generator. `localAudio` also allows explicit local recording imports without
an endpoint. Normal build never downloads or regenerates audio. Re-running the synthetic-only
fixture command replaces the manifest, so follow it with the human importer before publishing.

The four-step `Introduction.tsx` teaches before recall, with Danish word anchors clearly
separated from isolated international IPA recordings. Reading a lesson does not fabricate a
successful attempt or raise mastery. Practice remains on the shared hint/attempt/FSRS path.
Background: Ruben Schachtenhaufen, <https://schwa.dk/lydskrift/>. Danish word-level transcription
and stød diagnosis await curated native speech and a documented convention.

## Vowel workshop (0.4.0)

`VowelWorkshop.tsx` compares the existing human i/y and i/u recordings with a schematic
articulation map and optional paired spectrograms. It is teaching/reference, so seeing examples
does not create successful attempts or mastery. Exact-unit links enter the standard IPA drill;
the page remounts when its unit query changes. The map is not a measured/full IPA vowel chart.
The shared keyboard preserves the caret/selection, and local clip playback rejects interrupted,
denied or stalled audio so the learner can retry. Audio success alone never records an attempt.
