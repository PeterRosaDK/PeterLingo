# Country deck: sources, review and explicit import

Reviewed 2026-09-09. Scope: 193 UN member states, the Holy See/Vatican and Palestine (observers),
and Kosovo and Taiwan (explicit additional entries). 197 records, 591 independent direction
units. Dependencies/territories such as Greenland are not separate entries in this deck.

## Sources and licenses

- [mledoze/countries](https://github.com/mledoze/countries), pinned commit
  `c8015eebdd94c533358406b0d709f441389e1f2e`, ODbL 1.0. Full license: `LICENSE-ODbL`.
  Base factual capitals, ISO IDs, geographic groups. The upstream incorrectly marks Vatican
  City as a UN member; the output explicitly uses observer status instead.
- [UN member states](https://www.un.org/en/about-us),
  [UN observers](https://www.un.org/en/node/123012), and all 195 available
  [UNData country profiles](https://data.un.org/en/iso/dk.html). The checked capital labels are
  in `provenance.json`. Kosovo/Taiwan have no profile in this set. UN tables are not always current
  or consistent about administrative subdivisions; they are a cross-check, not a blind override.
- Country display names: Unicode CLDR 48, Danish, through Node `Intl.DisplayNames(['da'],
{type:'region'})`. CLDR: <https://cldr.unicode.org/>, Unicode License v3:
  <https://www.unicode.org/license.txt> (bundled in `public/assets/data/LICENSE-Unicode.txt`). A small editorial layer clarifies the two Congos and
  Palestine. Capital names use reviewed Danish exonyms where customary.
- [flag-icons](https://github.com/lipis/flag-icons), Panayiotis Lipiridis, pinned commit
  `086f7e97d657358203916dbe84f61c2bccaa81eb`, MIT. Exactly 197 4:3 SVGs are copied locally;
  original notice in `public/assets/flags/LICENSE`. No runtime CDN/emoji-font dependency.

The adapted `countries.json` database is **ODbL 1.0**, including the project's factual
annotations. It is downloadable in the app from `/assets/data/countries.json`, together with
its license. The engine source remains under the repository's own license.

## Reviewed capital exceptions

- Equatorial Guinea: **Ciudad de la Paz**, declared capital on 2026-01-02:
  [official government decree announcement](https://www.guineaecuatorialpress.com/index.php/noticias/el_presidente_de_la_republica_proclama_la_ciudad_de_la_paz_como_capital_de_la_republica_de_guinea_ecuatorial_con_la_firma_de_un_decreto_ley).
  The base database and UN profile still say Malabo; both are overridden.
- Sri Lanka: **Sri Jayewardenepura Kotte**, with Colombo's continuing functions explained:
  [Kotte Municipal Council](https://www.kotte.mc.gov.lk/index.php?Itemid=175&id=25&lang=en&option=com_content&view=article).
- South Africa: Pretoria, Cape Town, Bloemfontein and their roles:
  [South African Government](https://www.gov.za/south-africa-glance).
- Eswatini: Mbabane (administrative), Lobamba (royal/legislative):
  [Getty TGN](https://www.getty.edu/vow/TGNFullDisplay?english=N&find=7277711&nation=&place=&subjectid=1094532).
- Palestine: East Jerusalem (declared capital), Ramallah (administrative centre):
  [UNData](https://data.un.org/en/iso/ps.html). Jerusalem's unresolved status is noted for
  Israel and Palestine: [UN Secretary-General](https://press.un.org/en/2023/sgsm21684.doc.htm).
- Nauru: Yaren is a government district, not an official capital:
  [UNCTAD](https://dgff2021.unctad.org/wp-content/uploads/pdf/Dgff2021_Cp_520.pdf).
- Kiribati: South Tarawa, including Bairiki:
  [Ministry of Foreign Affairs](https://www.mfa.gov.ki/wp-content/uploads/2026/05/Te-Tarakai-SNAPSHOT.pdf).
- Palau: Ngerulmud in Melekeok state; the UN profile labels the state:
  [Palau Government](https://www.palaugov.pw/states/melekeok/).
- Indonesia retains Jakarta pending the legal/operational relocation to Nusantara; keep this
  under review: [Nusantara authority's 2026 material](https://www.ikn.go.id/2026).

Other differences in the UN comparison are spelling/transliteration (e.g. Brasília/Brasilia).
Notes also distinguish constitutional capitals from seats of government in Bolivia, the
Netherlands, Malaysia, Benin and Côte d'Ivoire. Switzerland's Bern is labelled a federal city.

## Data format and extension

`id` is the stable ISO alpha-2 identifier (XK is the commonly used Kosovo code). Do not renumber:
LearningUnits remain `flashcards:countries:<ISO>:<direction>`, including all twelve old entries.
`capital` is the display string; `capitals` is a list of `{name, role}` for multiple capitals.
`region` has exactly one teaching group per country. The assignment follows the pinned source:
Europe includes Russia and Cyprus; Türkiye is in Asia. Central America and the Caribbean join
North America. Antarctica has no sovereign states in this scope.

`note`, `status` and `sources` explain exceptions. `flagSvg` is always local; `flag` retains the
Unicode pair for portable exports. Existing saved subsets/directions stay unchanged. New
installations enable all six continents; no history is deleted when a subset is disabled.

## Reproduction

Download `countries.json`/`LICENSE` from the pinned mledoze commit, and the pinned flag-icons
archive from GitHub codeload. Generate a JSON object mapping each ISO ID to its Danish CLDR name.
Use `provenance.json`'s `unCapitalLabels` as the reviewed UN-profile map (or explicitly refresh
all profiles and review differences). Then:

```sh
python3 tools/countries/import.py --countries /local/countries.json --names /local/da-names.json \
  --un-profiles /local/un-labels.json --flags /local/flag-icons.tar.gz --license /local/LICENSE
npx prettier --write src/modules/flashcards/decks/countries.json public/assets/data/countries.json tools/countries/provenance.json
python3 -m unittest discover -s tools/countries
```

The importer contains the ordinary, editable Danish capital overrides and notes. Review source
changes before updating the pinned version/date. The test checks scope, every local SVG,
multiple-capital exceptions and parity of the downloadable database. No import runs in the PWA.
