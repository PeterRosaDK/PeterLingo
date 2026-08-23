const suitValues = [
  { symbol: '♠', name: 'Spar', value: 1, colour: 'black' },
  { symbol: '♥', name: 'Hjerter', value: 2, colour: 'red' },
  { symbol: '♣', name: 'Klør', value: 3, colour: 'black' },
  { symbol: '♦', name: 'Ruder', value: 4, colour: 'red' },
];

export function BcsIntro() {
  return (
    <section className="lesson-card bcs-intro" aria-labelledby="bcs-intro-title">
      <p className="eyebrow">BCS fra begyndelsen</p>
      <h2 id="bcs-intro-title">Først ordene — så reglen</h2>
      <p className="method-lead">
        Richard Osterlinds Breakthrough Card System (BCS) er en fast, cirkulær rækkefølge af alle 52
        kort. Reglen fortæller, hvilket kort der kommer efter det kort, du ser. Senere lærer du
        rækkefølgen udenad som Memorized Breakthrough Card System (MBCS), men lige nu må du gerne
        regne dig frem.
      </p>

      <div className="bcs-foundations">
        <article>
          <h3>Kortets værdi</h3>
          <p>Es er 1, kortene 2–10 beholder deres tal, knægt er 11, dame 12 og konge 13.</p>
          <div className="rank-line" aria-label="Billedkortenes værdier">
            <span>Es = 1</span>
            <span>Knægt = 11</span>
            <span>Dame = 12</span>
            <span>Konge = 13</span>
          </div>
        </article>
        <article>
          <h3>Hvad er kulørværdien?</h3>
          <p>
            Hver kulør får et fast hjælpetal, som kun bruges i BCS-regnestykket. Det siger ikke, at
            en kulør er bedre end en anden.
          </p>
          <div className="suit-value-grid">
            {suitValues.map((suit) => (
              <span className={suit.colour} key={suit.name}>
                <i>{suit.symbol}</i>
                <strong>{suit.name}</strong>
                <b>{suit.value}</b>
              </span>
            ))}
          </div>
        </article>
      </div>

      <div className="bcs-rule">
        <h3>Find det næste kort i fire trin</h3>
        <ol>
          <li>
            <b>1</b>
            <span>Fordobl kortets værdi</span>
          </li>
          <li>
            <b>2</b>
            <span>Er resultatet over 13, så træk 13 fra</span>
          </li>
          <li>
            <b>3</b>
            <span>Læg kulørtallet til, og begynd forfra efter 13</span>
          </li>
          <li>
            <b>4</b>
            <span>Brug det færdige tal til at vælge den nye kulør</span>
          </li>
        </ol>
      </div>

      <div className="suit-rule-grid" aria-label="Regler for den nye kulør">
        <span>
          <b>1–3</b>
          Samme kulør
        </span>
        <span>
          <b>4–6</b>
          Samme farve, anden kulør
        </span>
        <span>
          <b>7–9</b>
          Forrige i cirklen
        </span>
        <span>
          <b>10–13</b>
          Næste i cirklen
        </span>
      </div>
      <p className="suit-cycle">Kulørcirklen er: spar → hjerter → klør → ruder → spar.</p>

      <aside className="worked-example coral-example">
        <div>
          <span>Mini-eksempel</span>
          <strong>Hvad følger efter es spar?</strong>
        </div>
        <ol>
          <li>Es har værdien 1, og spar har kulørværdien 1.</li>
          <li>1 × 2 + 1 = 3.</li>
          <li>3 ligger i gruppen 1–3, så kuløren bliver den samme.</li>
          <li>Det næste kort er derfor 3 spar.</li>
        </ol>
      </aside>

      <div className="bcs-to-mbcs">
        <article>
          <span>BCS</span>
          <h3>Fra ét kort til det næste</h3>
          <p>
            Du ser et kendt kort og bruger Osterlinds regel til at finde naboen. Fordi rækkefølgen
            er cirkulær, ødelægger et almindeligt cut ikke forbindelsen mellem kortene.
          </p>
        </article>
        <article>
          <span>MBCS</span>
          <h3>Direkte mellem kort og position</h3>
          <p>
            Du lærer den samme BCS-rækkefølge udenad. Målet er at kende både kortets nummer og
            kortet på et givet nummer straks — uden først at gå gennem kæden.
          </p>
        </article>
        <article>
          <span>Vigtigt</span>
          <h3>Cut og fjernelse er ikke det samme</h3>
          <p>
            Ved et cut flyttes en samlet topbunke til bunden, så alle 52 kort bliver i den cirkulære
            rækkefølge. Fjernede kort lægges ikke tilbage og ændrer derfor, hvad der reelt er
            tilbage i spillet.
          </p>
        </article>
      </div>
    </section>
  );
}
