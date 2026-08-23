import { DANISH_WEEKDAYS } from './doomsday';

const centuryAnchors = [
  { years: '1800–1899', day: 'fredag' },
  { years: '1900–1999', day: 'onsdag' },
  { years: '2000–2099', day: 'tirsdag' },
  { years: '2100–2199', day: 'søndag' },
];

export function DoomsdayIntro() {
  return (
    <section className="lesson-card method-guide" aria-labelledby="doomsday-method-title">
      <p className="eyebrow">Metoden fra begyndelsen</p>
      <h2 id="doomsday-method-title">Sådan finder du ugedagen</h2>
      <p className="method-lead">
        “Dommedag” er bare navnet på den ugedag, som en række lette datoer deler i et bestemt år.
        Når du har fundet årets dommedag, går du fra en nærliggende huskedato til den dato, du leder
        efter.
      </p>

      <div className="method-steps">
        <article>
          <b>1</b>
          <div>
            <h3>Find århundredets faste anker</h3>
            <p>Det er dit udgangspunkt. For år i 2000-tallet begynder du altid på tirsdag.</p>
            <div className="anchor-table" aria-label="Århundredernes ankerdage">
              {centuryAnchors.map((anchor) => (
                <span key={anchor.years}>
                  <small>{anchor.years}</small>
                  <strong>{anchor.day}</strong>
                </span>
              ))}
            </div>
          </div>
        </article>
        <article>
          <b>2</b>
          <div>
            <h3>Brug årets sidste to cifre</h3>
            <p>
              Del tallet i hele grupper på 12 og en rest. Tæl én dag for hver gruppe, én dag for
              hvert år i resten og én ekstra dag for hver fire år i resten. Flyt det antal dage frem
              fra århundredets anker.
            </p>
          </div>
        </article>
        <article>
          <b>3</b>
          <div>
            <h3>Vælg en huskedato i måneden</h3>
            <p>
              De lige måneder er nemme: 4/4, 6/6, 8/8, 10/10 og 12/12. Derudover kan du huske
              parrene 9/5 og 5/9 samt 11/7 og 7/11. Alle falder på årets dommedag.
            </p>
          </div>
        </article>
        <article>
          <b>4</b>
          <div>
            <h3>Gå til måldatoen</h3>
            <p>
              Tæl fra huskedatoen til den ønskede dato. Hele uger ændrer ingenting, så du skal højst
              flytte seks pladser på ugehjulet.
            </p>
          </div>
        </article>
      </div>

      <aside className="worked-example">
        <div>
          <span>Eksempel</span>
          <strong>23. august 2026</strong>
        </div>
        <ol>
          <li>2000-tallets anker er tirsdag.</li>
          <li>26 giver 2 hele grupper på 12, 2 år i rest og 0 ekstra skudårsskridt: 4 skridt.</li>
          <li>Fire skridt fra tirsdag giver lørdag — årets dommedag.</li>
          <li>8. august er en huskedato. 23. august er 15 dage senere, altså én dag videre.</li>
          <li>Én dag efter lørdag er søndag.</li>
        </ol>
      </aside>

      <div className="weekday-wheel" aria-label="Ugedagshjul">
        {DANISH_WEEKDAYS.map((day, index) => (
          <span key={day}>
            <b>{index}</b>
            {day.slice(0, 3)}
          </span>
        ))}
      </div>
    </section>
  );
}
