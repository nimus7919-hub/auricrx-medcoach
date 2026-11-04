-- Run before deploying if the API DB role cannot CREATE/ALTER tables.
CREATE TABLE IF NOT EXISTS us_consents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), notice_version TEXT NOT NULL,
  terms BOOLEAN NOT NULL, privacy BOOLEAN NOT NULL, health BOOLEAN NOT NULL, share BOOLEAN NOT NULL,
  terms_version TEXT NOT NULL, collection_version TEXT NOT NULL, sharing_version TEXT NOT NULL
);
ALTER TABLE us_consents ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS adult BOOLEAN;
CREATE UNIQUE INDEX IF NOT EXISTS us_consents_event ON us_consents(user_id, event_id);
