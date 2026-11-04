const { test } = require('node:test');
const assert = require('node:assert/strict');
const { detectRegion } = require('../src/region/detectRegion');

for (const [country, language, expected] of [
  ['MX', 'en', 'MX'], ['MX', 'es', 'MX'], ['US', 'en', 'US'],
  ['US', 'es', 'US'], [null, 'es', 'MX'], [null, 'en', 'MX'],
]) {
  test(`region ${country}, language ${language} => ${expected}`, () => {
    assert.equal(detectRegion({ locales: [{ regionCode: country, languageCode: language }] }), expected);
  });
}
test('no locale info defaults to Mexico', () => assert.equal(detectRegion(), 'MX'));
test('English US language tag never overrides Mexico time zone or unknown location', () => {
  const locales = [{ languageTag: 'en-US', languageCode: 'en' }];
  assert.equal(detectRegion({ locales }), 'MX');
  assert.equal(detectRegion({ locales, calendars: [{ timeZone: 'America/Mexico_City' }] }), 'MX');
  assert.equal(detectRegion({ locales, timeZone: 'America/Tijuana' }), 'MX');
});
test('clear US time zone is secondary to explicit device region', () => {
  assert.equal(detectRegion({ timeZone: 'America/New_York' }), 'US');
  assert.equal(detectRegion({ locales: [{ regionCode: 'MX' }], timeZone: 'America/New_York' }), 'MX');
  assert.equal(detectRegion({ locales: [{ regionCode: 'US' }], timeZone: 'America/Mexico_City' }), 'US');
  assert.equal(detectRegion({ timeZone: 'America/Toronto' }), 'MX');
});
test('saved manual choice always wins', () => {
  for (const savedRegion of ['MX', 'US']) {
    assert.equal(detectRegion({ savedRegion, locales: [{ regionCode: savedRegion === 'MX' ? 'US' : 'MX' }] }), savedRegion);
  }
  assert.equal(detectRegion({ savedRegion: 'invalid' }), 'MX');
});
