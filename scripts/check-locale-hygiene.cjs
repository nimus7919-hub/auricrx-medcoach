#!/usr/bin/env node
/**
 * Locale hygiene: the app language must follow the language setting, so a locale file may never
 * contain another language's text.
 *
 *  1. en and es define exactly the same keys.
 *  2. No value is a bilingual "A / B" pair (Spanish / English side by side).
 *  3. English values contain no Spanish-only characters (accents, inverted punctuation).
 *  4. No value has garbled accents (mojibake such as "Ã³", "�" or "?" inside a word).
 *
 * Run: node scripts/check-locale-hygiene.cjs     (exit 1 on any problem)
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');
const LOCALES = ['en', 'es', 'zh', 'pt', 'fr', 'de'];

// Same-language " / " (alternatives, units, "day/night") that is not a translation pair.
const SLASH_ALLOWLIST = new Set([
  'ai.sinusCongestion', 'ai.cough', 'ai.arthritis', 'ai.reflux', 'ai.sprainBruise', 'ai.skinIrritation',
  'settings.dayNight', 'ui.recentExisting', 'ui.imssSeguroCredencial', 'ui.insuranceMedicareCard',
  'ui.ayushmanInsuranceCard', 'localized.ConsentHost.text95', 'localized.Pharmacies.text128',
  'localized.Settings.text189', 'localized.appConstants.STRINGS.dayNight', 'premiumUpgrade.features.wearableSync',
  'preVisitIntake.review.severityValue', 'localized.herbs.HERBS.item6.names', 'localized.herbs.HERBS.item23.names',
  // Same-language field separators (not translation pairs):
  'smartNotif.placeMessage', 'usRef.npiLine', 'usRef.costLine', 'usRef.retrieved', 'usRef.sourceDataDate',
]);
const SLASH_ALLOWLIST_PREFIXES = ['wallpaper.']; // "Cough / Chest cold" style same-language alternatives

// Proper nouns and product vocabulary that legitimately keep Spanish spelling inside English text.
const ENGLISH_SPANISH_CHAR_ALLOWLIST = [
  /^settings\.languages\./, /^countryLabels\./, /^localized\.dateTimePicker\./,
  /Línea de la Vida/, /Quién es Quién/, /Bitácora|bitácora|[Cc]édula|AuricRX Médicos/,
];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj || {})) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function load(locale) {
  return flatten(JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${locale}.json`), 'utf8')));
}

function checkLocaleHygiene() {
  const problems = [];
  const data = Object.fromEntries(LOCALES.map(locale => [locale, load(locale)]));

  const enKeys = new Set(Object.keys(data.en));
  const esKeys = new Set(Object.keys(data.es));
  for (const key of enKeys) if (!esKeys.has(key)) problems.push(`key-missing-in-es: ${key}`);
  for (const key of esKeys) if (!enKeys.has(key)) problems.push(`key-missing-in-en: ${key}`);

  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(data[locale])) {
      if (typeof value !== 'string') continue;
      if (value.includes(' / ') && !SLASH_ALLOWLIST.has(key) && !SLASH_ALLOWLIST_PREFIXES.some(p => key.startsWith(p))) problems.push(`bilingual-pair[${locale}]: ${key} = ${JSON.stringify(value)}`);
      if (/Ã[\u0080-\u00BF¡-ÿ]|Â[\u00A0-\u00BF]|\uFFFD|[A-Za-z]\?[a-z]/.test(value) && !/https?:\/\//.test(value)) {
        problems.push(`garbled-accent[${locale}]: ${key} = ${JSON.stringify(value)}`);
      }
    }
  }

  for (const [key, value] of Object.entries(data.en)) {
    if (typeof value !== 'string' || !/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(value)) continue;
    if (ENGLISH_SPANISH_CHAR_ALLOWLIST.some(rule => rule.test(key) || rule.test(value))) continue;
    problems.push(`spanish-in-en: ${key} = ${JSON.stringify(value)}`);
  }
  return problems;
}

module.exports = { checkLocaleHygiene };

if (require.main === module) {
  const problems = checkLocaleHygiene();
  if (problems.length) {
    console.error(`Locale hygiene failed (${problems.length}):\n` + problems.map(p => `  - ${p}`).join('\n'));
    process.exit(1);
  }
  console.log('Locale hygiene OK: en/es keys match, no bilingual pairs, no Spanish text in English, no garbled accents.');
}
