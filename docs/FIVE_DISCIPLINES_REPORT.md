# PeterLingo 0.2.0 — fem nye discipliner

Dato: 7. september 2026. Arbejdet er lavet direkte i det eksisterende repository.

## 1. Eksisterende arkitektur

PeterLingo havde allerede den rigtige kerne: stabile LearningUnits, separate genererede øvelser,
én `ts-fsrs`-wrapper, progressive hints, tidsmålte immutable attempts, mastery, en tidsbudgetteret
fælles sessionvælger og et repository-portlag med IndexedDB/JSON og privat D1-sync. De fem
oprindelige fag beholder deres IDs, routes og faglige implementationer. Fag registreres fortsat i
de eksisterende typed subject-, catalog- og route-registre.

## 2. Generelle ændringer

- Snapshot-version 2 tilføjer deck-indstillinger og fem focus weights. Version 1 migreres ved
  både almindelig IndexedDB-indlæsning/mutation og JSON-import; historik bevares.
- Sessionvælgeren filtrerer også allerede planlagte/scheduled items. Deaktivering sletter intet.
- Generelle LearningUnit-prerequisites åbner næste spektrogramtrin via eksisterende mastery.
- Selvrapporteret recall har en eksplicit grade-policy. Normalt flip tæller ikke som et hint.
- Lokal mastery og cloud-replay bruger én fælles funktion. Easy kan nu nå fluent.
- Dagens link sender det konkrete unit-ID til de nye fag. Hovedflowet er stadig dagens session.
- Ti fag vises i en vandret kortoversigt; Flashkort optager én top-level plads.

Beslutning og konsekvenser: [ADR 0003](adr/0003-ten-subjects-and-self-recall.md).

## 3. Grundstoffer

Fungerende v0: alle 118 records, dansk/engelsk navneaccept, fire øvelsestyper, præcis grid-scoring,
komplet reference, 102 originale Lehrer-positioner og sangkæder uden kunstig wrap-around.
F-blokken har en eksplicit udskilt visningskonvention. Tennessin er den danske Ts-form.
Lokal filvælger og import af sparse JSON-tidsmærker afspiller afgrænsede sangstumper.
Ingen sangoptagelse distribueres. Fil og importerede tidsmærker vælges igen efter genstart;
automatisk brug af sangstumper som øvelseshints afventer Peters tidsmærkede optagelse.

## 4. Morse

Fungerende v0: 36 bogstav-/talrytmer, Koch-start K/M, central og testet unlock-gate,
20 WPM tegn, Farnsworth-spacing, 600 Hz Tone.js-syntese med envelope, audio-first receive,
Space/touch-send og relativ varighed/spacing-scoring. Receive viser ikke facit som overlay.
Reference-træet har dit til venstre og dah til højre. Timing og konfigureret effectiveWpm logges.
WPM er her præsentationsspacing, ikke målt flydende gruppemodtagelse. Subjektiv lyd- og
real-device timingkalibrering er fortsat et fysisk eftertjek.

## 5. Flashkort-engine og deck-contract

`FlashcardDeck` leverer subsets, retninger, stabile DeckUnits og `generateCard(unit, context)`.
Front/back kan vise tekst, Hanzi, sekundær pinyin, tal, flag og lokale billeder; audiofelt er
forberedt. Et hurtigt flip understøtter tap, Enter og Space. Kunne ikke/Næsten/Kunne/Let mapper
præcist til again/hard/good/easy. Svartid logges, men selvrapportering tidsgraderes ikke.
Hints understøttes af den generiske UI og påvirker rating via den fælles policy.

HSK har separate items pr. ord/retning. Lande har 12 records og 36 retningsitems med Europa/Asien.
Omregninger har fire genererede færdigheder med pædagogiske tal, eksakte formler og tydelig
afrunding; tilfældige tal opretter aldrig nye FSRS-items. Deck-manageren gemmer aktivering,
subsets og retninger, viser due, gennemsnitlig styrke og dagens aktivitet.

## 6. Præcis HSK-kilde og version

[ChineseTest](https://www.chinesetest.cn/syllabus) linker HSK Examination Syllabus med
**2025-11 udgivelse og 2026-07 ikrafttrædelse på forsiden**. Lokalt standard-ID:
`HSK-3.0-2025-11`. Det holdes adskilt fra undervisningsstandarden
[GF0025-2021](https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html).
Den officielle visning har 1–6 og en samlet 7–9-gruppe, ikke tre opdigtede separate højeste ordlister.

Hanzi/pinyin og niveau er kontrolleret mod det officielle vocabulary-afsnit. Engelsk betydning
kommer fra CC-CEDICT, MDBG-release **2026-09-07T08:01:26Z**, CC BY-SA 4.0. Ingen danske meanings
er maskinopfundet. Kildehashes og reproducerbar import står i modulets README.

## 7. Tilgængelige HSK-niveauer

**Kun niveau 1: 21 ord, 63 selvstændige recall-retninger.** Det er et fuldt anvendeligt startudvalg,
men ikke et komplet niveau-1-deck eller et 11.000-ords curriculum. Hele den officielle PDF/liste
er ikke committet, da en eksplicit distributionslicens ikke blev identificeret. Importværktøjet
kan behandle den lokale PDF og CC-CEDICT under development; tvetydige heteronymer udelades til
manuel kontrol. Fuld import og udvidede niveauer er dokumenteret content-arbejde.

## 8. Fonetik

Fungerende lokalt: fem reproducerbart syntetiserede signaler, WAV, mel-spektrogrammer, manifest
og SHA256-cachevalidering; touch-IPA-keyboard, Unicode/segmentbaseret edit distance med
substitution/indsættelse/udeladelse; spektrogramklasse og mastery-gated /i a u/-trin.
Audio kommer først frem efter spektrogramsvar. Sprogtastaturer da/en holdes adskilt.

**Scaffold/ikke fysisk valideret:** TTS-endpointadapteren er konfigurerbar build-time tooling;
ingen konkret ekstern TTS-server er afprøvet. Naturlig dansk/engelsk tale, dansk
transskriptionskonvention, stød, VOT og avancerede ordtrin er ikke et færdigt curriculum.
Signalernes syntetiske status står i UI; en støjburst hævdes ikke at være en naturtro /p/.

## 9. Python-hjernen

42 reviewed snippets på 3–8 linjer med separate metadata og forklaringer. Ground truth er faktisk
kørt tre gange pr. snippet med Python **3.13.0**, forskellige hash-seeds, isolerede subprocesser,
timeout samt CPU-/outputgrænser. Tests dækker timeout og nondeterministisk set-output.
Koden eksekveres aldrig i browseren. Stdout bevarer intern whitespace; kun sidste linjeskift er
valgfrit. Ved exception afgives typen. Én float-opgave er eksplicit dokumenteret platform/version-
adfærd; identity bygger ikke på interning. Toolingen er til et reviewet repository-corpus og er
ikke en sandbox til vilkårlige brugerprogrammer.

## 10. Testresultater

Alle afsluttende gates bestået:

- Formatter, lint, TypeScript og Pages Functions-typecheck: bestået.
- Vitest: **44 filer / 202 tests bestået**, inklusive alle eksisterende tests.
- Playwright: **65 bestået / 5 forventede skips**, Chromium og mobil WebKit.
- Python ground truth: **42 snippets × 3 isolerede kørsler** verificeret, plus **5 tooling-tests**.
- Fonetik: **4 cache-tests** og hashvalidering bestået.
- Production build: bestået; **120 precache entries, ca. 9,1 MiB** inklusive eksisterende assets.

Testpakken omfatter eksisterende
fag, registrering, statiske/genererede kort, retnings-ID'er, ratings, filtrering, bevaret FSRS-state,
v1-migration med historik, HSK/pinyin/ID-validering, formler/ranges, Koch, grid/song, IPA og Python.
Browserpakken omfatter Chromium og mobil WebKit samt offline, lokale audiofiler og navigation.
Manuel browserlayoutkontrol: 390 px uden side-overflow, light/dark flashcards og 0 JavaScript-fejl.

## 11. Build og offline

Production build lykkes med hele den lokale audio-/billedcache i service workerens precache.
Den kendte Vite-advarsel om store chunks er ikke fjernet; bl.a. cubing/3D er fortsat store.
Offline-test åbner alle fem nye routes uden netværk og gemmer et flashkortforsøg offline.
Dette er browser-verifikation, ikke en ny påstand om afsluttet fysisk GoCube- eller multi-device-
Access-test. De eksisterende hardwareforbehold gælder stadig.

## 12. Version og commits

App/package og lockfile: **0.2.0**. Snapshot-format: **2**. Projektet havde ingen eksisterende
release-tags; der opfindes ikke en særskilt tagstruktur. Feature-commit: `4425da3` — `feat: add five adaptive learning disciplines`.
Den efterfølgende dokumentationscommit afslutter rapport, README, roadmap og changelog;
dens hash angives i afleveringen. Der er ikke foretaget et produktionsdeploy i denne opgave;
den byggede og browsertestede 0.2.0-artefakt ligger i `dist/`.

## 13. Dependencies og licenser

Ingen nye npm/runtime-dependencies. Eksisterende Tone.js og ts-fsrs genbruges. Valgfri pinned
Python-development tooling: pypdf 6.17.0, NumPy 2.5.3 og Matplotlib 3.11.1. Disse bruges kun
ved eksplicit datagenerering/validering. Nye originale snippets og signalfixtures er GPL-3.0;
CC-CEDICT-datasættet beholder CC BY-SA 4.0. Flag er Unicode/platformglypher.
Se [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md).

## 14. Kendte begrænsninger

HSK er et lille verificeret seed; fonetik er et syntetisk testcurriculum. Flag kan vises som
landebogstaver på platforme uden flagglypher. Audio/timestamps er lokale sessionsvalg.
Koch/timing og mastery kræver senere pædagogisk kalibrering med faktisk brug. Statistik er
fælles aggregering af forsøg, ikke en empirisk valideret retentionprognose. De oprindelige fag har
fortsat deres hidtidige frie øvelsesrouting; det nye præcise unit-link løser ikke hele dette gamle
roadmap-punkt. Indstillinger synkroniseres fortsat ikke mellem enheder.

## 15. Anbefalede næste skridt

1. Afprøv Morse-lyd/touch og flashcard-recall på Peters faktiske telefon/tablet.
2. Afklar fuld HSK-distribution og kuratér flere officielle niveauer/senses; tilføj dansk gradvist.
3. Vælg dansk IPA-konvention og indlæs lyttevalideret dansk/engelsk audio gennem værktøjet.
4. Importér Peters Lehrer-optagelse, tidsmærk den og forbind sangstumper med progressive hints.
5. Brug faktisk historik til at kalibrere Koch/fluency og udbyg sessionrouting/retentionstatistik.
