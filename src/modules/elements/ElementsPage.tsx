import { parseSongTimestamps, songClip } from './songAudio';
import { useEffect, useRef, useState } from 'react';
import { Practice } from '../shared/Practice';
import { elementExercise, elementUnits, elements } from './domain';
import { PeriodicGrid } from './PeriodicGrid';
import timestamps from './song-timestamps.json';
export function ElementsPage() {
  const [audio, setAudio] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [map, setMap] = useState(() => parseSongTimestamps(timestamps));
  const [songIndex, setSongIndex] = useState(1);
  const player = useRef<HTMLAudioElement>(null);
  const clipEnd = useRef<number | null>(null);
  const clip = songClip(map, songIndex);
  useEffect(
    () => () => {
      if (audio) URL.revokeObjectURL(audio);
    },
    [audio]
  );
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">118 grundstoffer · fire forbindelser</p>
        <h1>Grundstoffer</h1>
        <p>Symbol, navn, placering og sangkæde — med selvstændig repetition.</p>
      </header>
      <Practice units={elementUnits} generate={elementExercise} />
      <details className="lesson-card">
        <summary>Åbn det komplette periodiske system</summary>
        <PeriodicGrid reference />
        <p>
          F-blokken vises separat; den har ikke individuelle gruppenumre her. Tabellen bruger en
          udskilt 15-cellers konvention.
        </p>
        <p>
          Lehrers oprindelige sang fra 1959 omfatter 102 grundstofnavne, til og med nobelium. Navnet
          indgik dengang, selv om de tidlige opdagelsespåstande senere blev revideret. Senere
          tilføjelser er ikke en del af denne kæde.
        </p>
        <p>
          Ikke i den oprindelige sang:{' '}
          {elements
            .filter((e) => e.songIndex === null)
            .map((e) => e.danishName)
            .join(', ')}
          .
        </p>
      </details>
      <section className="lesson-card">
        <h2>Din egen Lehrer-optagelse</h2>
        <p>
          Vælg din lokale lydfil. Den sendes ingen steder og skal vælges igen efter genstart. Uden
          fil fungerer alle tekst- og gridøvelser.
        </p>
        <label>
          Vælg audio
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setAudio(URL.createObjectURL(f));
                setError('');
              }
            }}
          />
        </label>
        {audio && (
          <audio
            ref={player}
            onTimeUpdate={() => {
              if (
                player.current &&
                clipEnd.current !== null &&
                player.current.currentTime >= clipEnd.current
              ) {
                player.current.pause();
                clipEnd.current = null;
              }
            }}
            src={audio}
            controls
            onError={() => setError('Filen kan ikke afspilles i denne browser.')}
          />
        )}
        <p>
          {Object.keys(map).length} tidsmærker i det redigerbare map. Sangstumper aktiveres, når din
          optagelse er tidsmærket.
        </p>
        <label>
          Importér tidsmærker (JSON)
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f)
                try {
                  setMap(parseSongTimestamps(JSON.parse(await f.text())));
                  setError('');
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : 'Ugyldigt map');
                }
            }}
          />
        </label>
        <label>
          Sangposition
          <input
            type="number"
            min={1}
            max={102}
            value={songIndex}
            onChange={(e) => setSongIndex(Number(e.target.value))}
          />
        </label>
        <button
          className="button secondary"
          disabled={!audio || !clip}
          onClick={() => {
            if (player.current && clip) {
              player.current.currentTime = clip.start;
              clipEnd.current = clip.end;
              void player.current.play().catch(() => setError('Tryk afspil igen.'));
            }
          }}
        >
          Afspil sangstump
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
