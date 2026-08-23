import { useLearningData } from '../../app/DataProvider';
import { PI_DECIMALS } from './piData';
import { PiPractice } from './PiPractice';
import { piLearningProfile } from './progress';

export function PiPage() {
  const { snapshot } = useLearningData();
  const profile = piLearningProfile(snapshot.attempts, snapshot.mastery);

  return (
    <div className="page subject-page pi-page">
      <header className="subject-hero violet">
        <div>
          <p className="eyebrow">Først 30 · derefter fem ad gangen</p>
          <h1>Pi</h1>
          <p>100 er en milepæl, ikke et loft. Du udvider kun rækken, når fundamentet er sikkert.</p>
        </div>
        <div className="pi-mark">π</div>
      </header>
      <PiPractice />
      <details className="lesson-card pi-reference">
        <summary>Vis cifrene frem til næste læringsgrænse</summary>
        <p>
          Oversigten stopper ved {profile.visibleThrough}, så ukendt stof ikke bliver til en mur af
          cifre. Der ligger allerede verificeret indhold til 500 decimaler bag progressionen.
        </p>
        <div className="digit-ribbon" aria-label={`Decimal 1–${profile.visibleThrough} af pi`}>
          {PI_DECIMALS.slice(0, profile.visibleThrough)
            .split('')
            .map((digit, index) => (
              <span
                className={index < profile.workingBoundary ? 'known' : 'focus'}
                key={index}
                title={`Position ${index + 1}`}
              >
                {digit}
                {(index + 1) % 10 === 0 && <small>{index + 1}</small>}
              </span>
            ))}
        </div>
      </details>
    </div>
  );
}
