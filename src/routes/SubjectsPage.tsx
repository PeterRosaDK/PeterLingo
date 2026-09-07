import { Link } from 'react-router-dom';
import { subjects } from '../app/subjects';

export function SubjectsPage() {
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Direkte træning</p>
        <h1>Ti fag, samme rytme</h1>
        <p>Gå direkte til et spor uden at ændre dagens adaptive plan.</p>
      </header>
      <div className="subject-list">
        {subjects.map((subject, index) => (
          <Link
            className={`subject-list-item ${subject.accent}`}
            to={subject.route}
            key={subject.id}
          >
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div>
              <p className="eyebrow">{subject.eyebrow}</p>
              <h2>{subject.title}</h2>
              <p>{subject.description}</p>
            </div>
            <span>Åbn →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
