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
| cubing.js       |  0.63.3 | MPL-2.0 OR GPL-3.0-or-later | Cube visualization/state                    |
| @beacio/core    |   1.2.0 | MIT                         | Early iOS Safari Web Bluetooth path         |
| Tone.js         | 15.1.22 | MIT                         | Web Audio abstraction                       |
| VexFlow         |   5.0.0 | MIT                         | Short notation rendering                    |
| idb             |   8.0.3 | ISC                         | IndexedDB promise adapter                   |
| vite-plugin-pwa |   1.3.0 | MIT                         | Service worker and web manifest             |

The lockfile is the authoritative complete dependency graph and retains package license metadata.

## Reused Roux solver code

None in Milestone 0. No code from `wodzik/cube` or another Roux solver has been copied or claimed.
