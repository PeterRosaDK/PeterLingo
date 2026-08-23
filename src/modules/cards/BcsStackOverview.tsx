import { BCS_STACK, accessibleCardName } from './bcs';
import { PlayingCard } from './PlayingCard';

export function BcsStackOverview() {
  return (
    <details className="lesson-card bcs-stack-overview">
      <summary>Vis hele BCS-rækkefølgen · 52 kort</summary>
      <div className="stack-instructions">
        <div>
          <p className="eyebrow">Sådan stabler du et fysisk spil</p>
          <h2>Es spar øverst, konge spar nederst</h2>
          <p>
            Position 1 er kortet øverst i spillet. Læg kortene med bagsiden opad: begynd med nummer
            52 på bordet, læg 51 ovenpå og fortsæt baglæns, indtil nummer 1 ligger øverst.
          </p>
        </div>
        <ol>
          <li>Find først alle 52 kort og fjern jokere.</li>
          <li>Arbejd baglæns fra nummer 52 til nummer 1.</li>
          <li>Kontrollér til sidst es spar øverst og konge spar nederst.</li>
        </ol>
      </div>

      <ol className="bcs-stack-grid" aria-label="Den komplette BCS-rækkefølge">
        {BCS_STACK.map((card, index) => (
          <li key={card}>
            <b>{index + 1}</b>
            <PlayingCard card={card} size="small" />
            <span>{accessibleCardName(card)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
