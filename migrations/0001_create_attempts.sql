CREATE TABLE IF NOT EXISTS attempts (
  owner TEXT NOT NULL,
  id TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (length(payload) <= 65536),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner, id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_owner_time
  ON attempts (owner, attempted_at, id);

