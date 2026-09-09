# Forside og vokalværksted — 0.4.0

Deployet 9. september 2026: app-commit `a07f8b8f417f4eb84c0fc51b1138629280908f3c`,
<https://37a9ce9b.peterlingo.pages.dev>, med normal adgang på <https://peterlingo.petergpt.dk>.

## Leveret

- Forsidens sidescroll er fjernet. Tre kolonner på både desktop og mobil; ni fag i de første
  tre rækker og Python-hjernen som det tiende kort nedenunder. Alle fag er fortsat direkte
  tilgængelige. Ingen favoritindstillinger eller ændring af persistence var nødvendig.
- Ni originale SVG-illustrationer og den eksisterende levende Roux-terning. Grafik følger
  light/dark-tema og virker offline. Mobilkort viser kortere tekster, men deres beskrivelser
  er bevaret for skærmlæsere. Dagens træning er stadig forsiden primære handling.
- Fonetik → Vokalværksted sammenligner [i]/[y] og [i]/[u] med skematisk artikulationsgrafik,
  de eksisterende menneskelige optagelser, spektrogrammer og danske undervisningsforklaringer.
  Billeder kan skjules. Links åbner præcis den valgte IPA-øvelse med almindelige hints og FSRS.
- IPA-tastaturet indsætter ved markøren og erstatter markeret tekst. Lydafbrydelse, afvisning og
  timeout frigiver træningen, så brugeren kan prøve igen. Svartidsmåling begynder efter aflytning.

Undervisningsvisningen skaber ikke falske attempts eller mastery. Intet nyt scheduler-system,
ingen nye dependencies eller indholdsdownloads under træning. SVG-grafikken er originalt
projektindhold; de genbrugte menneskelige optagelser og spektrogrammer beholder CC BY-SA 3.0.
De eksisterende HSK-data og oversættelser er uændrede.

## Kontrol

- Formatter, lint, app- og Functions-typecheck: bestået.
- 45 testfiler / 207 tests bestået.
- Chromium + iPhone/WebKit: 73 browsertests bestået, fem forventede platformskips.
- Python-corpus: 42 snippets verificeret ved tre executions hver; fem tooling-tests bestået.
- HSK importer/datasæt: to tests bestået.
- Produktionsbuild: bestået, 126 precache-filer, cirka 11,5 MiB. Eksisterende Vite-advarsel
  om store chunks er fortsat til stede; hele HSK-decket er inkluderet offline.
- Desktop/mobil og mørkt tema inspiceret visuelt; levende Roux-rendering bevaret.
- Deploymentens index/SW/manifest matcher lokalt testet build via SHA256. Live smoke på 390px:
  alle ti kort i tre kolonner uden sidescroll; offline værksted, billeder, audio og korrekt
  IPA-attempt; tilbage til forsiden; nul JavaScript-pageerrors. Access-kontrol bestået.

## Næste faglige arbejde

Dette er en pædagogisk udvidelse omkring isolerede vokaler. Native danske ord, en dokumenteret
udtalekonvention, målte VOT-kontraster og stødscoring mangler stadig. Fysisk telefon/iPad-lytning
og GoCube-kalibrering er ikke verificeret af automatiske browserchecks. HSK's otte uafklarede
betydninger og flere gennemgåede danske oversættelser er også fortsat indholdsarbejde.
