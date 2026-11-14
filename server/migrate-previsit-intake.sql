-- Pre-visit AI intake (descriptive only).
-- Raw conversation lives in pre_visit_turns and is purged at raw_chat_delete_at
-- (appointment start + RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT).
-- Confirmed summary + patient comment are kept on pre_visit_intakes.
--
-- DO NOT run this against production from an agent or deploy hook.
-- Apply manually on a staging / unused database first.

CREATE TABLE IF NOT EXISTS pre_visit_intakes (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_display_name TEXT NOT NULL,
  appointment_id TEXT NOT NULL,
  appointment_start_iso TIMESTAMPTZ NOT NULL,
  appointment_request_id TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'es')),
  status TEXT NOT NULL CHECK (status IN (
    'in_progress',
    'awaiting_confirmation',
    'confirmed',
    'discarded'
  )),
  consent JSONB NOT NULL,
  follow_ups_asked INTEGER NOT NULL DEFAULT 0,
  summary JSONB,
  patient_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  shared_at TIMESTAMPTZ,
  raw_chat_delete_at TIMESTAMPTZ NOT NULL,
  raw_chat_deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pre_visit_intakes_patient_appt
  ON pre_visit_intakes (patient_id, appointment_id, status);

CREATE INDEX IF NOT EXISTS pre_visit_intakes_doctor_status
  ON pre_visit_intakes (doctor_id, status);

CREATE INDEX IF NOT EXISTS pre_visit_intakes_purge
  ON pre_visit_intakes (raw_chat_delete_at)
  WHERE raw_chat_deleted_at IS NULL AND status = 'confirmed';

CREATE TABLE IF NOT EXISTS pre_visit_turns (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL REFERENCES pre_visit_intakes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'assistant', 'system')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS pre_visit_turns_intake
  ON pre_visit_turns (intake_id, created_at);
