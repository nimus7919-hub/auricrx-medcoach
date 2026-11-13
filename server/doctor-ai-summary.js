/**
 * Descriptive-only doctor AI summary endpoint.
 * System prompt + banned-term filter; falls back to non-AI template.
 */

const {
  DOCTOR_AI_SYSTEM_PROMPT,
  filterDoctorAiOutput,
  buildDescriptiveTemplateSummary,
  containsBannedClinicalTerms,
} = require('./doctor-ai-summary-lib');

async function maybeCallModel({ facts, locale, apiKey, fetchImpl }) {
  if (!apiKey) return null;
  const fetchFn = fetchImpl || fetch;
  const userContent =
    locale === 'en'
      ? `Summarize these facts descriptively only:\n${JSON.stringify(facts)}`
      : `Resuma estos hechos solo de forma descriptiva:\n${JSON.stringify(facts)}`;

  const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.DOCTOR_AI_SUMMARY_MODEL || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: DOCTOR_AI_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json?.choices?.[0]?.message?.content || null;
}

async function buildDoctorDescriptiveSummary({
  facts,
  locale = 'es',
  apiKey = process.env.OPENAI_API_KEY || process.env.DOCTOR_AI_API_KEY,
  fetchImpl,
  rawModelText,
}) {
  const loc = locale === 'en' ? 'en' : 'es';
  let modelText = rawModelText;
  if (modelText == null) {
    try {
      modelText = await maybeCallModel({ facts, locale: loc, apiKey, fetchImpl });
    } catch {
      modelText = null;
    }
  }
  if (!modelText) {
    return {
      ok: true,
      source: 'template',
      text: buildDescriptiveTemplateSummary(facts, loc),
      bannedMatches: [],
    };
  }
  const filtered = filterDoctorAiOutput(modelText, facts, loc);
  return {
    ok: true,
    source: filtered.source,
    text: filtered.text,
    bannedMatches: filtered.bannedMatches,
  };
}

function mountDoctorAiSummaryRoutes(app, { verifyDoctorAuth }) {
  app.post('/api/doctor/summary/descriptive', verifyDoctorAuth, async (req, res) => {
    try {
      const uid = req.userId || req.user?.uid;
      if (!uid) return res.status(401).json({ ok: false, error: 'unauthorized' });
      const { facts, language } = req.body || {};
      if (!facts || typeof facts !== 'object') {
        return res.status(400).json({ ok: false, error: 'facts_required' });
      }
      const probe = JSON.stringify(facts);
      if (containsBannedClinicalTerms(probe)) {
        return res.status(400).json({ ok: false, error: 'facts_contain_banned_terms' });
      }
      const result = await buildDoctorDescriptiveSummary({
        facts,
        locale: language === 'en' ? 'en' : 'es',
      });
      return res.json(result);
    } catch (err) {
      console.error('doctor ai summary error:', err);
      return res.status(500).json({ ok: false, error: 'summary_failed' });
    }
  });
}

module.exports = {
  DOCTOR_AI_SYSTEM_PROMPT,
  buildDoctorDescriptiveSummary,
  mountDoctorAiSummaryRoutes,
  filterDoctorAiOutput,
  buildDescriptiveTemplateSummary,
  containsBannedClinicalTerms,
};
