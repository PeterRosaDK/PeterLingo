import { useState } from 'react';
import { Link } from 'react-router-dom';
import { phoneticsManifest } from './domain';
const vowels = phoneticsManifest.filter((row) => !row.synthetic);
const comparisons = [
  {
    ids: ['human-i', 'human-y'],
    title: 'i → y · rund læberne',
    instruction:
      'Hold tungen fremme og højt. Begynd med [i], og rund så læberne. Lyt efter ændringen til [y].',
    cue: 'Runding ændrer mundens resonans. Flere formanter kan flytte sig. Sammenlign de brede energibånd i billederne; de fine striber viser også stemmens svingninger.',
  },
  {
    ids: ['human-i', 'human-u'],
    title: 'i → u · flyt tungen tilbage',
    instruction:
      'Ved [u] er tungen længere tilbage, og læberne er rundede. Skift langsomt mellem [i] og [u], og mærk begge bevægelser.',
    cue: 'Begge er høje vokaler. Ved [u] ligger de nederste formanter typisk tættere sammen end ved [i]. Brug mønstret som et spor, og sammenlign altid med lyden.',
  },
];
export function VowelWorkshop() {
  const [comparison, setComparison] = useState(0);
  const [showImages, setShowImages] = useState(true);
  const selected = comparisons[comparison]!;
  return (
    <section className="lesson-card vowel-workshop">
      <p className="eyebrow">Lyt · mærk · se · genkald</p>
      <h2>Vokalværksted</h2>
      <p>
        To lyde ad gangen. Her må du se facit og lytte så ofte, du vil. Når du er klar, går du
        videre til en øvelse med skjult svar.
      </p>
      <div className="self-ratings">
        {comparisons.map((pair, index) => (
          <button
            key={pair.title}
            className="button secondary"
            aria-pressed={comparison === index}
            onClick={() => setComparison(index)}
          >
            {pair.title}
          </button>
        ))}
      </div>
      <div
        className="vowel-map"
        aria-label="Skematisk vokalkort: i og y er fortungevokaler; u er en bagtungevokal"
      >
        <svg
          viewBox="0 0 600 150"
          role="img"
          aria-label="Alle tre vokaler har høj tungeposition. i er urundet; y og u er rundede."
        >
          <path
            d="M90 50H510L440 126H235Z"
            fill="none"
            stroke="currentColor"
            opacity=".2"
            strokeWidth="2"
          />
          <text x="90" y="22">
            Tungen fremme
          </text>
          <text x="408" y="22">
            Tungen tilbage
          </text>
          <text x="25" y="83">
            Høj
          </text>
          {[
            { id: 'human-i', x: 105, symbol: 'i' },
            { id: 'human-y', x: 200, symbol: 'y' },
            { id: 'human-u', x: 490, symbol: 'u' },
          ].map((v) => (
            <g key={v.id} opacity={selected.ids.includes(v.id) ? 1 : 0.35}>
              <circle
                cx={v.x}
                cy="65"
                r="27"
                fill="var(--surface)"
                stroke="currentColor"
                strokeWidth="2"
              />
              <text x={v.x} y="76" textAnchor="middle" fontSize="32">
                {v.symbol}
              </text>
              <text x={v.x} y="112" textAnchor="middle">
                {v.symbol === 'i' ? 'Urundet' : 'Rundet'}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p>{selected.instruction}</p>
      <label>
        <input
          type="checkbox"
          checked={showImages}
          onChange={(e) => setShowImages(e.target.checked)}
        />{' '}
        Vis spektrogrammer til sammenligning
      </label>
      <div className="vowel-comparison" key={comparison}>
        {selected.ids.map((id) => {
          const row = vowels.find((v) => v.id === id)!;
          return (
            <article key={id}>
              <h3>[{row.ipa}]</h3>
              <p>{row.cue}</p>
              <audio
                controls
                preload="metadata"
                src={row.audio}
                aria-label={`Værksted: lyt til ${row.ipa}`}
                onPlay={(event) => {
                  const current = event.currentTarget;
                  current
                    .closest('section')
                    ?.querySelectorAll('audio')
                    .forEach((a) => {
                      if (a !== current) a.pause();
                    });
                }}
              />
              {showImages && (
                <figure>
                  <img
                    src={row.image}
                    alt={`Menneskelig ${row.ipa}-lyd: tid vandret, frekvens lodret`}
                  />
                  <figcaption>
                    Vandret: sekunder · lodret: Hz på mel-skala · lysere: mere energi
                  </figcaption>
                </figure>
              )}
              <Link
                className="button secondary"
                to={`/fag/phonetics?unit=phonetics:ipa_transcribe:${row.id}`}
              >
                Øv [{row.ipa}] uden facit →
              </Link>
            </article>
          );
        })}
      </div>
      <p className="feedback">{selected.cue}</p>
      <p>
        Danske huskekroge: is, lys og hus. Optagelserne viser isolerede IPA-vokaler, ikke de danske
        ord. Kortet viser kun tre høje vokaler og er skematisk, ikke et komplet IPA-diagram.
      </p>
      <p className="source-note">
        Lyd: Denelson83, Wikimedia Commons, CC BY-SA 3.0. PeterLingo har konverteret lyd og
        genereret billeder. Kildelinks og licens findes under “Start her”.
      </p>
    </section>
  );
}
