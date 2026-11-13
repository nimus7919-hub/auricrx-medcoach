const assert = require('assert');
const {
  buildDoctorDescriptiveSummary,
  filterDoctorAiOutput,
  buildDescriptiveTemplateSummary,
  containsBannedClinicalTerms,
} = require('./doctor-ai-summary');

function test(name, fn) {
  const result = fn();
  if (result && typeof result.then === 'function') {
    return result
      .then(() => console.log(`✓ ${name}`))
      .catch((err) => {
        console.error(`✗ ${name}`);
        throw err;
      });
  }
  console.log(`✓ ${name}`);
  return undefined;
}

const facts = {
  entryCount: 3,
  symptomCount: 1,
  missedDoseCount: 0,
  limitCrossedCount: 1,
  documentCount: 0,
  symptomTexts: ['dolor de cabeza'],
};

async function run() {
  await test('template fallback when no API key', async () => {
    const result = await buildDoctorDescriptiveSummary({ facts, locale: 'es', apiKey: '' });
    assert.strictEqual(result.source, 'template');
    assert.ok(result.text.includes('Registros: 3'));
    assert.strictEqual(containsBannedClinicalTerms(result.text), false);
  });

  await test('filters banned model output', async () => {
    const result = await buildDoctorDescriptiveSummary({
      facts,
      locale: 'en',
      rawModelText: 'Patient is critical and deteriorating',
    });
    assert.strictEqual(result.source, 'template');
    assert.ok(result.bannedMatches.length > 0);
    assert.ok(result.text.includes('Entries: 3'));
  });

  await test('passes clean descriptive AI text', () => {
    const filtered = filterDoctorAiOutput('Entries: 3. Symptoms logged: 1.', facts, 'en');
    assert.strictEqual(filtered.source, 'ai');
    assert.strictEqual(filtered.ok, true);
  });

  await test('template has no banned terms', () => {
    const text = buildDescriptiveTemplateSummary(facts, 'es');
    assert.strictEqual(containsBannedClinicalTerms(text), false);
  });

  console.log('doctor-ai-summary tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
