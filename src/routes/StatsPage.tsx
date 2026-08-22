import { useLearningData } from '../app/DataProvider';
import { subjects } from '../app/subjects';

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function StatsPage() {
  const { snapshot } = useLearningData();
  const attempts = snapshot.attempts;
  const accuracy = attempts.length
    ? attempts.filter((attempt) => attempt.correct).length / attempts.length
    : 0;
  const hintRate = attempts.length
    ? attempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0) / attempts.length
    : 0;
  const weak = [...snapshot.mastery].sort((a, b) => a.strength - b.strength).slice(0, 5);
  return (
    <div className="page stats-page">
      <header className="page-heading">
        <p className="eyebrow">Kun dine lokale data</p>
        <h1>Statistik</h1>
        <p>Et roligt overblik over kvalitet, hjælp og tempo — ikke et pointsystem.</p>
      </header>
      <section className="metric-grid">
        <article>
          <span>Forsøg</span>
          <strong>{attempts.length}</strong>
          <small>i alt</small>
        </article>
        <article>
          <span>Præcision</span>
          <strong>{Math.round(accuracy * 100)}%</strong>
          <small>alle øvelser</small>
        </article>
        <article>
          <span>Median</span>
          <strong>
            {(median(attempts.map((attempt) => attempt.responseTimeMs)) / 1000).toFixed(1)}s
          </strong>
          <small>svartid</small>
        </article>
        <article>
          <span>Hints</span>
          <strong>{hintRate.toFixed(1)}</strong>
          <small>pr. forsøg</small>
        </article>
      </section>
      <section className="mastery-table">
        <h2>Faglig aktivitet</h2>
        {subjects.map((subject) => {
          const records = snapshot.mastery.filter((record) => record.discipline === subject.id);
          const avg = records.length
            ? records.reduce((sum, record) => sum + record.strength, 0) / records.length
            : 0;
          return (
            <div key={subject.id}>
              <span className={`subject-dot ${subject.accent}`} />
              <strong>{subject.title}</strong>
              <div className="strength-track">
                <i style={{ width: `${avg * 100}%` }} />
              </div>
              <span>{records.length ? `${Math.round(avg * 100)}%` : 'Ingen data'}</span>
            </div>
          );
        })}
      </section>
      <section className="weak-units">
        <h2>Svage læringsenheder</h2>
        {weak.length ? (
          <ul>
            {weak.map((record) => (
              <li key={record.learningUnitId}>
                <code>{record.learningUnitId}</code>
                <span>{Math.round(record.strength * 100)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Ingen enheder er vurderet endnu. Det er et ærligt tomt udgangspunkt.</p>
        )}
      </section>
    </div>
  );
}
