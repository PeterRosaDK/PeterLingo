import { Link } from 'react-router-dom';
import { OUTER_CUBE_NOTATION } from './cubeNotation';

function CubeNet({ active }: { active?: string }) {
  return (
    <div className="notation-net" aria-hidden="true">
      {['U', 'L', 'F', 'R', 'B', 'D'].map((face) => (
        <span className={`${active === face ? 'active' : ''} notation-face-${face}`} key={face}>
          {face}
        </span>
      ))}
    </div>
  );
}

function MiddleSliceDiagram({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="middle-slice-diagram" aria-hidden="true">
      <div>
        {Array.from({ length: 9 }, (_, index) => (
          <i className={index % 3 === 1 ? 'active' : ''} key={index} />
        ))}
      </div>
      <span>{inverse ? '↑' : '↓'}</span>
    </div>
  );
}

export function CubeNotationHelpPage() {
  return (
    <div className="page notation-help-page">
      <header className="page-heading">
        <p className="eyebrow">Roux · hurtig hjælp</p>
        <h1>Cubens alfabet</h1>
        <p>
          Et bogstav fortæller, hvilket lag du drejer. Et lille tegn bagefter fortæller retningen
          eller antallet af kvartdrejninger.
        </p>
      </header>

      <section className="notation-reference">
        <div>
          <p className="eyebrow">Vores fælles greb</p>
          <h2>Hvid GO-side op · grøn side mod dig</h2>
          <p>
            Dette standardgreb gør bogstaverne entydige: grøn er F foran, blå er B bagpå, rød er R
            til højre, orange er L til venstre, hvid/GO er U ovenpå, og gul er D nedenunder. Behold
            grebet gennem hele kalibreringen. Drej ikke hele cuben, medmindre appen senere viser en
            hel-cube-rotation udtrykkeligt.
          </p>
        </div>
        <CubeNet active="F" />
      </section>

      <section className="notation-section" aria-labelledby="suffix-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Retningen</p>
            <h2 id="suffix-title">R, R′ og R2 er ikke det samme</h2>
          </div>
        </div>
        <p className="notation-rule">
          Forestil dig, at du ser lige ind på den side, bogstavet nævner. Uden tegn drejer du 90°
          med uret; prime-tegnet drejer 90° mod uret; tallet 2 er en halv omgang.
        </p>
        <div className="notation-symbol-grid">
          <article>
            <strong>R</strong>
            <span className="turn-symbol" aria-hidden="true">
              ↻
            </span>
            <h3>En kvart omgang med uret</h3>
            <p>Se direkte på siden på din højre hånd, og drej laget 90° med uret.</p>
          </article>
          <article>
            <strong>R′</strong>
            <span className="turn-symbol" aria-hidden="true">
              ↺
            </span>
            <h3>En kvart omgang mod uret</h3>
            <p>
              Tegnet hedder <em>prime</em>. I rå tekst skrives det ofte <code>R'</code>.
            </p>
          </article>
          <article>
            <strong>R2</strong>
            <span className="turn-symbol half" aria-hidden="true">
              ↻↻
            </span>
            <h3>En halv omgang</h3>
            <p>Drej siden på din højre hånd 180°. Her er retningen ligegyldig.</p>
          </article>
        </div>
        <div className="prime-warning">
          <strong>Er det R1?</strong>
          <p>
            Nej. Det lille tegn i <b>R′</b> er en apostrof/prime, ikke tallet 1. PeterLingo bruger
            det tydelige tegn ′ på skærmen.
          </p>
        </div>
      </section>

      <section className="notation-section" aria-labelledby="faces-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Seks ydersider</p>
            <h2 id="faces-title">Bogstavet vælger en placering</h2>
          </div>
        </div>
        <p className="notation-rule">
          Bogstaverne kommer fra de engelske navne. De gælder, så længe du beholder referencegrebet;
          hvis du drejer hele cuben i hænderne, flytter højre, venstre, op og ned sig også.
        </p>
        <div className="face-legend">
          {OUTER_CUBE_NOTATION.map((face) => (
            <article key={face.notation}>
              <CubeNet active={face.notation} />
              <div>
                <strong>{face.notation}</strong>
                <h3>
                  {face.english} · {face.danish}
                </h3>
                <p>{face.position}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="notation-section middle-slice-section" aria-labelledby="middle-title">
        <div>
          <p className="eyebrow">Roux-specialiteten</p>
          <h2 id="middle-title">M er det lodrette midterlag i standardgrebet</h2>
          <p>
            M-laget ligger mellem det orange L-lag til venstre og det røde R-lag til højre.
            Retningen for <b>M</b> følger et L-træk; <b>M′</b> går den modsatte vej. Drej kun
            midten—hold de to yderlag stille.
          </p>
          <p className="guidance">
            GoCube kan rapportere et fysisk M-træk som to næsten samtidige ydertræk. Derfor måler
            kalibreringen M og M′ særskilt, før PeterLingo oversætter dem.
          </p>
        </div>
        <div className="middle-examples">
          <article>
            <MiddleSliceDiagram />
            <strong>M</strong>
            <span>midten som L</span>
          </article>
          <article>
            <MiddleSliceDiagram inverse />
            <strong>M′</strong>
            <span>modsat M</span>
          </article>
        </div>
      </section>

      <section className="notation-example" aria-labelledby="algorithm-title">
        <div>
          <p className="eyebrow">En lille opskrift</p>
          <h2 id="algorithm-title">Sådan læses en algoritme</h2>
          <p>
            <b>R U R′ U′</b> betyder fire træk efter hinanden fra venstre mod højre. Mellemrum
            adskiller trækkene; de skal ikke udføres samtidig.
          </p>
        </div>
        <div className="algorithm-steps" aria-label="R U R prime U prime">
          {['R', 'U', 'R′', 'U′'].map((move, index) => (
            <span key={`${move}-${index}`}>
              <small>{index + 1}</small>
              {move}
            </span>
          ))}
        </div>
      </section>

      <div className="button-row notation-actions">
        <Link className="button primary" to="/fag/roux/opsaetning">
          Til Opsætning
        </Link>
        <Link className="button secondary" to="/fag/roux/traening">
          Til Træning
        </Link>
      </div>
    </div>
  );
}
