import { DoomsdayIntro } from './DoomsdayIntro';
import { DoomsdayPractice } from './DoomsdayPractice';

export function DoomsdayPage() {
  return (
    <div className="page subject-page doomsday-page">
      <header className="subject-hero citrine">
        <div>
          <p className="eyebrow">Mental kalender</p>
          <h1>Doomsday</h1>
          <p>Lær først hvert lille led. Sæt dem derefter sammen til en hel dato.</p>
        </div>
        <div className="lesson-orbit" aria-label="Doomsday-metodens hoveddele">
          <span>1</span>
          <strong>Ugedag og år</strong>
          <i>→</i>
          <span>2</span>
          <strong>Måned og skudår</strong>
          <i>→</i>
          <span>3</span>
          <strong>Hele datoen</strong>
        </div>
      </header>

      <DoomsdayIntro />
      <DoomsdayPractice />
    </div>
  );
}
