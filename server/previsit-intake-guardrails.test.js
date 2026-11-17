const assert = require('assert');
const {
  filterModelText,
  filterSummary,
  buildVerbatimTemplateSummary,
  buildDescriptiveSummary,
  parseReportedSeverity,
  findIntakeBannedTerms,
  genericIntakePushCopy,
  questionFor,
  QUESTIONS,
} = require('./previsit-intake-lib');

function test(name, fn) {
  fn();
  console.log(`✓ ${name}`);
}

test('good stomach-pain summary has no banned terms', () => {
  const summary = buildDescriptiveSummary(
    {
      mainConcern: 'My stomach hurts.',
      location: 'in the pit of the stomach',
      duration: 'three days',
      severity: '6',
    },
    'en',
    '2026-11-14T00:00:00.000Z'
  );
  assert.strictEqual(summary.mainConcern, 'My stomach hurts.');
  assert.strictEqual(summary.location, 'in the pit of the stomach');
  assert.strictEqual(summary.duration, 'three days');
  assert.strictEqual(summary.severityReported, 6);
  assert.strictEqual(findIntakeBannedTerms(JSON.stringify(summary)).length, 0);
  const filtered = filterSummary(summary, [], 'en', summary.generatedAt);
  assert.strictEqual(filtered.ok, true);
  assert.strictEqual(filtered.source, 'ai');
});

test('rejects dyspepsia / no warning signs and falls back to verbatim quotes', () => {
  const turns = [
    { role: 'patient', text: 'My stomach hurts.' },
    { role: 'patient', text: 'in the pit of the stomach' },
  ];
  const bad = {
    mainConcern: 'Dyspepsia. Pain in the pit of the stomach. No warning signs.',
    location: 'epigastrium',
    duration: null,
    severityReported: null,
    alsoMentioned: [],
    questionsForDoctor: [],
  };
  const result = filterSummary(bad, turns, 'en', '2026-11-14T00:00:00.000Z');
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.source, 'template');
  assert.ok(result.bannedMatches.length > 0);
  assert.strictEqual(result.summary.mainConcern, 'My stomach hurts.');
  assert.strictEqual(result.summary.location, 'in the pit of the stomach');
  assert.ok(!/dyspepsia/i.test(JSON.stringify(result.summary)));
  assert.ok(!/warning signs/i.test(JSON.stringify(result.summary)));
});

test('rejects likely gastritis / not urgent / take an antacid', () => {
  const result = filterSummary(
    {
      mainConcern: 'This is likely gastritis and is not urgent. No red flags. Take an antacid and come in if it worsens.',
      location: null,
      duration: null,
      severityReported: null,
      alsoMentioned: [],
      questionsForDoctor: [],
    },
    [{ role: 'patient', text: 'My stomach hurts.' }],
    'en',
    '2026-11-14T00:00:00.000Z'
  );
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.summary.mainConcern, 'My stomach hurts.');
  assert.ok(result.bannedMatches.length > 0);
});

test('rejects Spanish parece gastritis / sin datos de alarma / tome un antiácido', () => {
  const result = filterSummary(
    {
      mainConcern: 'parece gastritis, sin datos de alarma, tome un antiácido',
      location: null,
      duration: null,
      severityReported: null,
      alsoMentioned: [],
      questionsForDoctor: [],
    },
    [{ role: 'patient', text: 'Me duele el estómago.' }],
    'es',
    '2026-11-14T00:00:00.000Z'
  );
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.summary.mainConcern, 'Me duele el estómago.');
  assert.ok(result.bannedMatches.length > 0);
});

test('rejects questions that ask the patient to self-screen for red flags', () => {
  const en = filterModelText('Any warning signs or red flags I should know about?');
  const es = filterModelText('¿Tienes datos de alarma?');
  assert.strictEqual(en.ok, false);
  assert.strictEqual(es.ok, false);
});

test('fixed allowed questions pass the filter in en and es', () => {
  for (const locale of ['en', 'es']) {
    for (const key of Object.keys(QUESTIONS[locale])) {
      const q = questionFor(key, locale);
      const result = filterModelText(q);
      assert.strictEqual(result.ok, true, `${locale}.${key} flagged: ${result.bannedMatches}`);
    }
  }
});

test('fallback template contains only quoted patient text and fixed headings/fields', () => {
  const turns = [
    { role: 'assistant', text: questionFor('mainConcern', 'en') },
    { role: 'patient', text: 'My stomach hurts.' },
    { role: 'patient', text: 'upper stomach' },
  ];
  const summary = buildVerbatimTemplateSummary(turns, 'en', '2026-11-14T00:00:00.000Z');
  assert.strictEqual(summary.mainConcern, 'My stomach hurts.');
  assert.strictEqual(summary.location, 'upper stomach');
  assert.strictEqual(summary.duration, null);
  assert.strictEqual(summary.severityReported, null);
  const blob = JSON.stringify(summary);
  assert.ok(!/diagnos|triage|warning|urgent|gastritis|dyspepsia/i.test(blob));
});

test('severity is only the patient-stated 1-10 number', () => {
  assert.strictEqual(parseReportedSeverity('6'), 6);
  assert.strictEqual(parseReportedSeverity('6/10'), 6);
  assert.strictEqual(parseReportedSeverity('un 7'), 7);
  assert.strictEqual(parseReportedSeverity('it hurts a lot'), null);
  assert.strictEqual(parseReportedSeverity('11'), null);
});

test('generic push copy has no name, symptom, or severity', () => {
  for (const lang of ['en', 'es', 'es-MX']) {
    const copy = genericIntakePushCopy(lang);
    assert.ok(copy.title);
    assert.ok(copy.body);
    assert.ok(!/\{\{/.test(copy.body));
    assert.ok(!/\b\d{1,2}\s*\/\s*10\b/.test(copy.body));
    assert.ok(!/stomach|estómago|glucosa|symptom|dolor/i.test(copy.body));
    assert.strictEqual(findIntakeBannedTerms(`${copy.title} ${copy.body}`).length, 0);
  }
});

console.log('previsit-intake-guardrails tests passed');
