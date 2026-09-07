# Grundstoffer

`elements.json` has one record per atomic number 1–118: symbol, English/Danish names, period,
group, and nullable one-based songIndex. `song-timestamps.json` is an editable index→offsetMs map
(initially empty). Domain facts are separate from generators and UI.

Names and atomic numbers were checked against [IUPAC](https://iupac.org/what-we-do/periodic-table-of-elements/),
[Danish Chemical Nomenclature, table 1](https://kemisknomenklatur.dk/kap_tab/tabeller/tabel_1.pdf),
and Ture Damhus' [2019 Danish table and naming discussion](https://www.kemifokus.dk/wp-content/uploads/sites/7/DAK2-2019-s19-21.pdf).
The modern Danish name of Ts is **tennessin**. Everyday Danish aliases (brint, ilt, kvælstof,
kulstof etc.) and US aluminum/cesium are accepted in addition to the displayed names.
Initial factual extraction of English names/positions used Bowserinator's Periodic-Table-JSON;
see THIRD_PARTY_NOTICES. No upstream prose, images or masses are bundled.

The four stable units per element are `symbol_to_name`, `name_to_position`, `song_chain`, and
`song_index_to_grid` (song modes only where meaningful). Last-song-item chain has no next item;
there is no invented wrap-around. Normalized Danish or English names are accepted. Grid grading
requires the exact atomic-number cell. The 15-cell detached f-block uses `group=null`; these
positions are unique and are not presented as fifteen numbered chemical groups.

Song order follows [Lehrer's own original lyric sheet](https://tomlehrersongs.com/wp-content/uploads/2018/12/the-elements.pdf):
102 names through nobelium, not the later 103–118 addendum. This reflects names in use in 1959,
not a claim that every early discovery attribution survived subsequent investigation.

No recording is distributed. Select local audio each browser session; it stays in a Blob URL and
is revoked on replacement/unmount. Import a JSON timestamp map to play bounded segments; absent
file/offset disables the segment button. The source map can be filled after the recording is
known. Audio is currently a reference/teaching control, not an automatic exercise hint.
