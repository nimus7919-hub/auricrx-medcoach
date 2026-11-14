/**
 * Pre-visit AI intake — server flags and the single retention constant.
 * PREVISIT_INTAKE_ENABLED defaults to false (feature is dark until explicitly turned on).
 * PREVISIT_INTAKE_PROVIDER defaults to "mock". A real LLM is opt-in.
 * RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT is one constant (default 30) because
 * Freddy has not confirmed the window yet; override via env without code changes.
 */

function truthy(value) {
  return value === 'true' || value === '1';
}

function finiteDays(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

const RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT = finiteDays(
  process.env.PREVISIT_INTAKE_RAW_CHAT_RETENTION_DAYS,
  30
);

const MAX_FOLLOW_UPS = 8;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 1000;

function isPreVisitIntakeEnabled(env = process.env) {
  return truthy(env.PREVISIT_INTAKE_ENABLED);
}

function getPreVisitIntakeProvider(env = process.env) {
  const raw = String(env.PREVISIT_INTAKE_PROVIDER || 'mock').trim().toLowerCase();
  return raw === 'openai' ? 'openai' : 'mock';
}

module.exports = {
  RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT,
  MAX_FOLLOW_UPS,
  MAX_MESSAGE_LENGTH,
  MAX_COMMENT_LENGTH,
  isPreVisitIntakeEnabled,
  getPreVisitIntakeProvider,
  truthy,
};
