import { Link } from 'react-router-dom';
import { CubeViewer } from './CubeViewer';
import { RouxMoveDrill } from './RouxMoveDrill';

export function RouxPage() {
  return (
    <div className="page subject-page roux-page">
      <header className="subject-hero ice">
        <div>
          <p className="eyebrow">Intuition før algoritmer</p>
          <h1>Roux</h1>
          <p>Byg venstre blok, højre blok og løs resten med så få udenadsting som muligt.</p>
        </div>
        <div className="cube-hero">
          <CubeViewer compact />
        </div>
      </header>
      <div className="roux-layout">
        <section className="cube-stage roux-reference-stage">
          <div className="stage-heading">
            <div>
              <p className="eyebrow">Fælles testgreb</p>
              <h2>Hvid GO-side op · grøn mod dig</h2>
            </div>
            <span className="status-pill good">GoCube klar</span>
          </div>
          <div className="roux-reference-mark" aria-hidden="true">
            <span>GRØN</span>
            <i>HVID GO ↑</i>
          </div>
          <p>
            Hold den hvide GO-side opad og den grønne centerflade mod dig. Så følger R, L, U, D, F
            og B den almindelige notation, og GoCubens rå ydertræk skal bruge samme bogstav.
          </p>
          <Link className="button primary" to="/fag/roux/diagnostik">
            Forbind og kontrollér GoCube
          </Link>
          <Link className="button secondary" to="/fag/roux/first-block">
            Begynd First Block
          </Link>
          <Link className="button secondary" to="/fag/roux/second-block">
            Fortsæt med Second Block
          </Link>
          <Link className="button secondary" to="/fag/roux/notation">
            Lær cubens notation
          </Link>
        </section>
        <aside className="roux-progress">
          <p className="eyebrow">Læringsrækkefølge</p>
          <ol>
            <li className="active">
              <b>01</b>
              <div>
                <strong>First Block</strong>
                <span>Åben nu: find par og byg 1×2×3 intuitivt.</span>
              </div>
            </li>
            <li className="active">
              <b>02</b>
              <div>
                <strong>Second Block</strong>
                <span>Åben nu: byg højre blok med kun to korte værktøjer.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>Begynderhjørner</strong>
                <span>To-look før fuld CMLL.</span>
              </div>
            </li>
            <li>
              <b>04</b>
              <div>
                <strong>Last Six Edges</strong>
                <span>Orientér og afslut.</span>
              </div>
            </li>
          </ol>
        </aside>
      </div>
      <RouxMoveDrill />
      <section className="hardware-callout">
        <div>
          <p className="eyebrow">Fysisk GoCube</p>
          <h2>To profiler: løs for mig og lær mig Roux</h2>
          <p>
            Roux-motoren skal både kunne føre en vilkårlig blanding helt hjem og stoppe ved starten
            af en valgt fase. Derefter skal den genkende First Block, Second Block, CMLL og LSE og
            forklare næste meningsfulde skridt. Alt skal bygge på den samme fysisk verificerede
            tilstand.
          </p>
          <div className="notation-policy">
            <strong>Fast notationsregel</strong>
            <span>
              Undervisning bruger standardnotation med bogstav, prime og 2. Kun “Løs for mig” må
              oversætte et trin til centerfarve og én eller to drejninger.
            </span>
          </div>
          <div className="platform-guidance">
            <span>
              <strong>Løs for mig</strong>
              Brug hele solverens repertoire og vis den bedste verificerede løsning, den finder.
            </span>
            <span>
              <strong>Lær mig Roux</strong>
              Begynd med få algoritmer; tilføj først nye, når de gamle er sikre og gevinsten er
              tydelig.
            </span>
          </div>
          <div className="platform-guidance">
            <span>
              <strong>Mac Mini</strong>
              Brug Chrome eller Edge. Beacio skal ikke installeres på Mac.
            </span>
            <span>
              <strong>iPhone/iPad</strong>
              Installér Beacio-appen og aktivér dens Safari-udvidelse.
            </span>
          </div>
        </div>
        <Link className="button primary" to="/fag/roux/diagnostik">
          Åbn GoCube-diagnostik
        </Link>
      </section>
    </div>
  );
}
