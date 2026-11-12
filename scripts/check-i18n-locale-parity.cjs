#!/usr/bin/env node
/**
 * Fails if any locale is missing keys present in the base locale (en).
 * Also checks placeholder parity for shared keys.
 */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const I18N_DIR = path.join(ROOT, 'src/i18n');
const BASE = 'en';
const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'zh'];

function flatten(object, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(object)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, next, result);
    } else if (typeof value === 'string') {
      result[next] = value;
    }
  }
  return result;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{\{\s*([^}]+)\s*\}\}/g)].map((m) => m[1].trim()).sort();
}

const locales = Object.fromEntries(
  LOCALES.map((lng) => [
    lng,
    flatten(JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lng}.json`), 'utf8'))),
  ])
);

const baseKeys = Object.keys(locales[BASE]);
const missing = {};

for (const lng of LOCALES) {
  if (lng === BASE) continue;
  const absent = baseKeys.filter((key) => typeof locales[lng][key] !== 'string');
  if (absent.length) missing[lng] = absent;
  for (const key of baseKeys) {
    if (typeof locales[lng][key] !== 'string') continue;
    assert.deepEqual(
      placeholders(locales[BASE][key]),
      placeholders(locales[lng][key]),
      `Interpolation mismatch ${lng}: ${key}`
    );
  }
}

if (Object.keys(missing).length) {
  for (const [lng, keys] of Object.entries(missing)) {
    console.error(`Missing ${keys.length} keys in ${lng}.json (showing up to 40):`);
    console.error(keys.slice(0, 40).join('\n'));
  }
  process.exitCode = 1;
} else {
  // Spot-check critical dashboard / compliance strings
  assert.equal(locales.es['tiles.familyCircle'], 'Círculo Familiar');
  assert.equal(locales.es['tiles.preventionPlanner'], 'Plan de Prevención');
  assert.equal(locales.es['tiles.labOrganizer'], 'Organizador de Laboratorios');
  assert.equal(locales.es['tiles.dailyHabits'], 'Hábitos Diarios');
  assert.equal(locales.es['tiles.healthAnalytics'], 'Mi Resumen de Salud');
  assert.equal(locales.es['ui.intelligentHealthInsightsAnalysis'], 'Información general de salud con IA');
  assert.equal(locales.en['tiles.healthAnalytics'], 'My Health Summary');
  assert.equal(locales.es['localized.Reminders.Reminders.text1253'], 'Llegará en 10 segundos.');
  assert.ok(locales.es['labOrganizer.title']);
  assert.ok(locales.es['familyCircleUpgrade.title']);
  assert.equal(locales.es['localized.dateTimePicker.localeMap.es'], 'es-MX');
  console.log(`PASS: locale parity — ${baseKeys.length} keys present in ${LOCALES.join(', ')}`);
}
