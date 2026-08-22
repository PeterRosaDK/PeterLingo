import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="PeterLingo forside">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="14" />
        <path d="M12 13h13c7 0 11 4 11 9.5S32 32 24.5 32H20v5h-8V13Zm8 7v5h5c2 0 3-1 3-2.5S27 20 25 20h-5Z" />
        <circle cx="36" cy="36" r="5" />
      </svg>
      <span>PeterLingo</span>
    </Link>
  );
}
