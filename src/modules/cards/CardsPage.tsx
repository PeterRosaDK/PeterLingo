import { BcsIntro } from './BcsIntro';
import { BcsStackOverview } from './BcsStackOverview';
import { CardsPractice } from './CardsPractice';
import { PlayingCard } from './PlayingCard';

export function CardsPage() {
  return (
    <div className="page subject-page cards-page">
      <header className="subject-hero coral">
        <div>
          <p className="eyebrow">Osterlinds BCS bliver til MBCS</p>
          <h1>Kortene kommer tilbage</h1>
          <p>
            Først bliver Richard Osterlinds regneregel sikker. Derefter bliver kort og position til
            ét øjeblikkeligt svar.
          </p>
        </div>
        <div className="card-fan" aria-hidden="true">
          <PlayingCard card="1S" size="small" stacked dealt />
          <PlayingCard card="7D" size="small" stacked dealt />
          <PlayingCard card="13S" size="small" stacked dealt />
        </div>
      </header>

      <BcsIntro />
      <BcsStackOverview />
      <CardsPractice />
    </div>
  );
}
