# Lande og forbedret Flashkort — 0.5.1

Deployet 9. september 2026 på <https://peterlingo.petergpt.dk>.
Præcis deployment: <https://50c27287.peterlingo.pages.dev>, app-revision
`521668b2b95a9865005ebbf6600c02559520a5c6`.

## Landedeck

197 lande og 591 uafhængige LearningUnits: land→hovedstad, hovedstad→land og flag→land.
Scope er 193 FN-medlemslande, Vatikanstaten/Den Hellige Stol og Palæstina samt Kosovo og Taiwan.
Selvstyrende territorier som Grønland er ikke selvstændige kort i dette udvalg.

| Verdensdel                                       | Lande |
| ------------------------------------------------ | ----: |
| Europa                                           |    46 |
| Asien                                            |    48 |
| Afrika                                           |    54 |
| Nordamerika, inklusive Mellemamerika og Caribien |    23 |
| Sydamerika                                       |    12 |
| Oceanien                                         |    14 |

Danske landenavne og sædvanlige danske hovedstadsnavne. Hvert land har ét geografisk udvalg;
fordelingen følger den dokumenterede kilde, bl.a. Cypern/Rusland i Europa og Tyrkiet i Asien.

Det licenserede grunddatasæt er sammenholdt med alle 195 tilgængelige FN-landeprofiler.
Nationale og andre autoritative kilder afklarer undtagelser, herunder Ciudad de la Paz som
Ækvatorialguineas nye hovedstad i 2026, Sri Jayewardenepura Kotte og flere hovedstæder i
Sydafrika/Eswatini. Noter skelner mellem hovedstad og regeringssæde og forklarer omstridt status.
Afghanistans kort viser republikkens trikolore med en tydelig note om Talibanmyndighedernes hvide
flag. Der påstås ikke, at én flagvariant løser et lands politiske anerkendelsesspørgsmål.

Alle 197 SVG-flag ligger lokalt, uafhængigt af platformens flag-emojis. En referenceoversigt under
udvalget viser landene, deres hovedstæder og noter. Den tilpassede database og licens kan hentes
som almindelige filer, også offline. [Kilder og import](../tools/countries/README.md).

## Kortflow

- Kompakt oversigt over HSK, Lande og Omregninger. Selve kortet kommer før indstillingerne.
- Mellemrum/Enter vender kortet. 1 = Kunne ikke, 2 = Næsten, 3 = Kunne, 4 = Let.
- Enter eller højrepil går videre efter vellykket gemning. Næste-knappen ligger til højre.
- Ingen rating før reveal; ingen dobbeltlogning ved hurtige tastetryk. Redigerbare felter,
  genvejskombinationer med modifikationstaster, gentagelser ved holdte taster og igangværende
  gemninger er beskyttet. Knapperne fungerer fortsat med touch og almindelig keyboard-navigation.
- Hints påvirker stadig FSRS-vurderingen gennem den fælles policy. Self-report giver ikke en
  automatisk korrekt vurdering, bare fordi kortet vendes.

Den eksisterende læringsmotor, statistik, persistence og dagens blandede session bruges fortsat.
Ingen migration eller nye dependencies. ISO/direction-ID'er fra de gamle tolv lande bevares.
Gemte udvalg ændres ikke automatisk: nye verdensdele kan slås til under **Udvalg og retninger**.

## Verifikation og licenser

Formatter, lint, app-/Functions-typecheck og production build bestået. 45 Vitest-filer /
209 tests bestået; Chromium og iPhone/WebKit: 79 browsertests bestået, fem forventede skips.
Python: 42 snippets verificeret med tre executions hver, fem tooling-tests; HSK to tests;
geografi tre tests for dækning, flag, undtagelser og downloadparitet.

Buildet precacher 327 filer, cirka 12,8 MiB. Den kendte Vite-advarsel om store chunks består.
Live smoke verificerede præcise artifact-hashes, offline SVG/keyboard-rating/videre-navigation,
download af alle 197 records, mobilgeometri, nul JavaScript-pageerrors og Access-beskyttelsen.
Fysisk signeret iPhone/iPad-afprøvning er ikke udført af agenten.

Landefakta og tilpasning: ODbL 1.0. Danske landenavne: Unicode CLDR 48 / Unicode License v3.
Flag: flag-icons, MIT. Alle notices og datakilder er dokumenteret i
[THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md). Ingen runtime-CDN eller datatjeneste.

Commits: `c12620f` (landedeck og kortflow), `521668b` (forklarende flagrettelse og 0.5.1).
Næste muligheder: eksplicit territorie-deck, kortpositioner som recall-retning og løbende
kildekontrol af ændrede hovedstæder, især den planlagte flytning i Indonesien.
