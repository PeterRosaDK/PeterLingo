# Fonetik

`manifest.json` is the locally bundled, readable cache manifest: ID, language (da/en), IPA, label
class, tier, cue, synthesis provenance, asset paths and SHA256 digests. WAV/PNG assets live in
`public/assets/phonetics` and are PWA-precached. No endpoint is called during practice or build.

Stable IDs distinguish IPA transcription, spectrogram class recognition, and vowel reading.
The first tier produces a typed class (vokal/frikativ/plosiv). The second spectrogram tier asks
for /i a u/ and uses shared LearningUnit prerequisites: all five class units must have strength
at least 0.68. IPA uses normalized segments (including tie bars and combining diacritics), edit
distance, substitutions, insertions/deletions and diagnostic partial credit. Only exact segment
agreement is correct for the existing grading policy. Hints and revealed answers use normal policy.

There are five **synthetic acoustic fixtures**, not a curated speech corpus. Three additive
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
GPL-3.0; no IPA chart image or third-party recording is copied.
