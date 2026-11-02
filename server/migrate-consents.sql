CREATE TABLE IF NOT EXISTS consents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notice_version TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'google')),
  terms BOOLEAN NOT NULL,
  privacy BOOLEAN NOT NULL,
  health BOOLEAN NOT NULL
);
CREATE INDEX IF NOT EXISTS consents_user_latest ON consents(user_id, id DESC);
