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

function RouxBlockPicture() {
  return (
    <div className="roux-block-picture" aria-label="To sideblokke med et frit midterlag">
      <span className="left-block">First Block</span>
      <i>M</i>
      <span className="right-block">Second Block</span>
      <b>U · fri top</b>
    </div>
  );
}

export function CubeNotationHelpPage() {
  return (
    <div className="page notation-help-page">
      <header className="page-heading">
        <p className="eyebrow">Roux · hjælp fra begyndelsen</p>
        <h1>Sådan virker Roux</h1>
        <p>
          Målet er stadig en helt løst cube. Roux vælger bare en anden vej dertil: først to solide
          blokke på siderne, derefter de øverste hjørner og til sidst de seks kanter, som endnu er
          frie.
        </p>
      </header>

      <section
        className="notation-reference roux-beginner-intro"
        aria-labelledby="why-blocks-title"
      >
        <div>
          <p className="eyebrow">Den grundlæggende idé</p>
          <h2 id="why-blocks-title">Byg to blokke—ikke en hel side</h2>
          <p>
            Hvis du løser en hel side med det samme, følger der normalt også et helt lag med, som du
            bagefter skal passe på. I Roux samler du i stedet en 1×2×3-klods på hver side. Det
            efterlader toppen og den lodrette midterskive fri som et arbejdsrum. Du kan derfor
            flytte de sidste brikker med færre store omveje uden at ødelægge blokkene.
          </p>
          <p>
            “1×2×3” beskriver blot blokkens form: én brik tyk, to brikker høj og tre brikker lang.
            Du behøver ikke kunne navnet på alle brikker for at begynde—se efter farver, der hører
            sammen omkring centerfelterne.
          </p>
        </div>
        <RouxBlockPicture />
      </section>

      <section
        className="notation-section roux-method-overview"
        aria-labelledby="roux-method-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fra blandet til løst</p>
            <h2 id="roux-method-title">De fire faser, trin for trin</h2>
          </div>
        </div>
        <ol>
          <li>
            <b>1</b>
            <span>
              <strong>First Block</strong>
              <small>
                Find brikkerne omkring det orange center og den gule bund, og saml den første
                1×2×3-blok til venstre. Du må prøve dig frem; denne fase er mest intuitiv.
              </small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>Second Block</strong>
              <small>
                Byg en tilsvarende rød-gul blok til højre, mens den første bliver liggende. Toppen
                fungerer som arbejdsbord; to korte indstik hjælper, når et par er klar.
              </small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>CMLL</strong>
              <small>
                Løs kun de fire hjørnebrikker øverst: vend først deres hvide felter opad, og flyt
                dem derefter til de rigtige pladser. De seks kantbrikker må stadig være blandede.
              </small>
            </span>
          </li>
          <li>
            <b>4</b>
            <span>
              <strong>Last Six Edges</strong>
              <small>
                Vend og placér de sidste seks kantbrikker. Blokkene og hjørnerne er allerede
                færdige, så især M-midterskiven og U-toppen kan arbejde uden at rive blokkene op.
              </small>
            </span>
          </li>
        </ol>
        <div className="roux-learning-balance">
          <article>
            <strong>Det intuitive</strong>
            <p>
              First Block og meget af Second Block læres ved at finde farvepar og bygge små former.
              Du lærer at se muligheder frem for at huske en opskrift til alt.
            </p>
          </article>
          <article>
            <strong>De små algoritmer</strong>
            <p>
              CMLL kræver i starten Sune og T-perm. LSE bruger to genkendelige M–U-mønstre. Det
              lille repertoire giver en fuld begynderrute og kan senere udvides med hurtigere
              algoritmer én ad gangen.
            </p>
          </article>
        </div>
      </section>

      <section
        className="notation-section roux-orientation-explainer"
        aria-labelledby="orientation-reason-title"
      >
        <p className="eyebrow">Ét fast udgangspunkt</p>
        <h2 id="orientation-reason-title">Hvorfor hvid/GO op og grøn frem?</h2>
        <p className="notation-rule">
          En cube kan holdes på mange måder. I begynderforløbet vælger vi altid hvid/GO op og grøn
          frem, så “venstre blok”, farverne og bogstaverne betyder det samme på alle skærme. Det er
          støttehjul, ikke en begrænsning i Roux: når mønstrene sidder fast, kan du lære at starte
          med andre farver og vælge bedre blokke.
        </p>
      </section>

      <div className="notation-chapter-heading">
        <p className="eyebrow">Notation</p>
        <h2>Cubens alfabet</h2>
        <p>Et bogstav vælger et lag. Tegnet bagefter fortæller retningen eller antal drejninger.</p>
      </div>

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
        <Link className="button primary" to="/fag/roux">
          Tilbage til Roux
        </Link>
      </div>
    </div>
  );
}
