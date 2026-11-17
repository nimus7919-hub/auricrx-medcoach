-- Pre-visit intake: per-intake, per-language cache of the doctor-facing translation.
-- Run manually (this repo does not auto-run migrations). The server works without it
-- (it falls back to a process-local cache), but then translations are re-requested after each restart.
-- Rows are derived from the raw chat, so the server deletes them whenever the raw chat is
-- deleted (30-day retention purge, patient "delete chat", discard).
CREATE TABLE IF NOT EXISTS pre_visit_intake_translations (
  intake_id   text        NOT NULL,
  lang        text        NOT NULL CHECK (lang IN ('en', 'es')),
  source_hash text        NOT NULL,
  payload     jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (intake_id, lang)
);
