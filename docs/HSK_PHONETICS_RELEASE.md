# HSK og dansk IPA-introduktion — version 0.3.0

Leveret 7. september 2026. App-commit `68adf123b6875da4ac4a920a6f813a5bf9f00699`, pushed til main
og deployet med Cloudflare Pages Direct Upload. Produktion: <https://peterlingo.petergpt.dk>.
Præcis deployment: <https://1a461914.peterlingo.pages.dev>.

## Implementering

Den eksisterende modularkitektur, LearningUnits, FSRS-wrapper, hints, attempts, latency,
mastery, sessionsgenerator, IndexedDB og design-system er bevaret. Ingen ekstra scheduler.
Store statiske decks bruger nu genbrugte unit-kataloger, indekserede opslag og lineær udvælgelse
i fri træning. Sessionsgeneratoren grupperer historik pr. unit, før den beregner svartidsestimater.
Snapshotversion er fortsat 2; gamle ord-ID'er, FSRS-state og gemte deckvalg bevares.

Flashkort-contractet er uændret: statiske records giver én LearningUnit pr. retning, mens
omregninger fortsat bruger fire generelle færdigheder. HSK har seks retninger mellem Hanzi,
pinyin og betydning. Nye brugere starter på niveau 1, Hanzi→betydning. Niveauer og retninger
kan kombineres frit og gemmes lokalt. En fejl, hvor feedback forsvandt efter et retningsskift,
er rettet og dækket af browserregressionstest.

## HSK-data

Standard: **HSK-3.0-2025-11**, ChineseTests pensum udgivet november 2025, gældende fra juli 2026
ifølge dokumentets omslag. Det er ikke samme datasæt som GF0025-2021.

| Niveau      | Nye records |
| ----------- | ----------: |
| 1           |         300 |
| 2           |         200 |
| 3           |         500 |
| 4           |       1.000 |
| 5           |       1.600 |
| 6           |       1.800 |
| 7–9, samlet |       5.600 |
| I alt       |      11.000 |

Manis licenserede [HSK-transskription](https://github.com/krmanik/HSK-3.0), commit
`182692ce5a11bc30bdc771835d2f0f27491c25de`, er sammenholdt med samtlige nummererede ord i
[ChineseTests officielle pensum](https://www.chinesetest.cn/syllabus). Pinyin og niveauer følger
pensummet. Engelske betydninger kommer fra CC-CEDICT, release 2026-09-07T08:01:26Z.
106 almindelige ord har redaktionelle danske oversættelser af udvalgte ordbogsbetydninger.
De er ikke en officiel dansk HSK-ordbog. Otte uafklarede ordbogsmatch er kun tegn↔pinyin.
Engelske ordbogsartikler kan rumme flere betydninger end den enkelte pensumbetydning.

Hele datasættet ligger lokalt; daglig træning henter intet over netværket.
Se [importvejledningen](../tools/hsk/README.md) for kilder, hashes og reproduktion.

## Fonetik

Fire korte undervisningstrin med dansk vinkel: lyd kontra stavning, tunge/læber, længde/tryk
og forskellen til stød, samt spektrogrammets tid/frekvens/formanter. Tre menneskelige optagelser
af [i y u] og afledte mel-spektrogrammer supplerer de fem syntetiske laboratoriefixtures.
Danske ord bruges som tydeligt mærkede huskekroge. Optagelserne er isolerede internationale
IPA-demonstrationer, ikke indtalinger af danske ord.

IPA-keyboard, præcis scoring med segmentdiagnostik, progressive hints og spektrogramøvelser
bruger den eksisterende læringsmotor. Undervisningslæsning skaber ikke falsk mastery.
Native danske ord, stødscoring, dokumenteret dialekt og et komplet fonetikcurriculum mangler.
TTS-endpoint-adapteren er fortsat valgfri development-tooling, aldrig et runtimekrav.

## Kvalitet og deployment

- Formatter, lint, app-/Functions-typecheck: bestået.
- Vitest: 44 filer, **204 tests bestået**.
- Playwright: **69 bestået, 5 forventede platformskips**, Chromium og iPhone/WebKit.
- Python: 42 snippets, tre isolerede executions hver, fem tooling-tests bestået.
- HSK importer/output: to tests bestået. Fonetik-cache: fire tests og hashvalidator bestået.
- Production build bestået; 126 precache-filer, cirka 11,5 MiB. Kendt Vite-advarsel om store
  chunks; den komplette ordbog medtages eksplicit i offline-cache.
- Reelle deployment-filer for index/SW/manifest matcher lokalt testet artifact via SHA256.
- Live smoke: HSK dansk recall/rating, IPA-audio, alle fem nye fag offline, offline-rating,
  nul JavaScript-pageerrors og ingen vandret overflow ved 390 px.
- Produktionens Access-beskyttelse verificeret på root, nye deep routes, SW og sync-API.
  Signeret fysisk iPad/iPhone-afprøvning og måling af højttalere/tap-timing er ikke udført.

Grundstoffer, Morse, Lande, Omregninger og Python-hjernen fra 0.2.0 er også med i deploymenten.
[Den tidligere udvidelsesrapport](FIVE_DISCIPLINES_REPORT.md) beskriver deres v0-scope;
dens HSK-seed og syntetisk-only Fonetik-status er afløst af denne rapport.

Ingen nye npm-afhængigheder. HSK og den danske adaptation er CC BY-SA 4.0; Denelson83s
menneskelige audio og afledte billeder er CC BY-SA 3.0. ffmpeg bruges kun ved eksplicit
content-import. Se [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md).

## Næste skridt

1. Peters afprøvning på telefon/iPad: kortretninger, læsbarhed og lyd.
2. Gennemgå de otte uafklarede HSK-betydninger og udvid den danske oversættelsesfil gradvist.
3. Kuratér native danske ord og en dokumenteret IPA-konvention, før ord/stød bedømmes.
4. Udvid fonetik med annoterede kontraster og målte VOT-eksempler.
5. Færdiggør de gamle fags exact-unit-routing og kalibrér progression med reel træningshistorik.
