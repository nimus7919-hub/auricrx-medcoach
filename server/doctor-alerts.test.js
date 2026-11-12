const assert = require('assert');
const {
  compareValue,
  extractReadings,
  evaluateThresholdCrossings,
  genericPushCopy,
} = require('./doctor-alerts');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

test('compareValue operators', () => {
  assert.strictEqual(compareValue(10, 'gt', 9), true);
  assert.strictEqual(compareValue(10, 'gte', 10), true);
  assert.strictEqual(compareValue(9, 'lt', 10), true);
  assert.strictEqual(compareValue(10, 'lte', 10), true);
});

test('extractReadings from BP/glucose/weight', () => {
  assert.deepStrictEqual(
    extractReadings({ type: 'blood_pressure', systolic: 140, diastolic: 90, pulse: 70, patientId: 'p' }),
    { systolic: 140, diastolic: 90, pulse: 70 }
  );
  assert.deepStrictEqual(
    extractReadings({ type: 'glucose', glucoseMgDl: 110, patientId: 'p' }),
    { glucose: 110 }
  );
});

test('evaluateThresholdCrossings is neutral (no severity)', () => {
  const entry = { type: 'blood_pressure', patientId: 'p1', systolic: 160 };
  const limits = [
    { enabled: true, patientId: 'p1', readingType: 'systolic', comparator: 'gt', value: 150 },
  ];
  const crossings = evaluateThresholdCrossings(entry, limits);
  assert.strictEqual(crossings.length, 1);
  assert.strictEqual(crossings[0].observedValue, 160);
  assert.ok(!('severity' in crossings[0]));
  assert.ok(!('label' in crossings[0]));
});

test('generic push copy has no patient name or value placeholders', () => {
  for (const lang of ['es', 'en', 'pt', 'fr', 'de', 'zh']) {
    const copy = genericPushCopy(lang);
    assert.ok(copy.title);
    assert.ok(copy.body);
    assert.ok(!/\{\{/.test(copy.body));
    assert.ok(!/\b160\b/.test(copy.body));
    assert.ok(!/Juan|Maria|patient_1/i.test(copy.body));
  }
  const es = genericPushCopy('es');
  assert.ok(/l[ií]mite/i.test(es.body));
});

console.log('doctor-alerts tests passed');
