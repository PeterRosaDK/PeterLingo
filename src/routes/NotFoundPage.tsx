import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <div className="page empty-page">
      <span>404</span>
      <h1>Den øvelse findes ikke</h1>
      <Link className="button primary" to="/">
        Tilbage til i dag
      </Link>
    </div>
  );
}
