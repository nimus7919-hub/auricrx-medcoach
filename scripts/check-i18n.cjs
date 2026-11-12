/* Translation sanity check; deliberately avoids app/Babel config and environment files. */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const i18next = require('i18next');
const root = path.resolve(__dirname, '..');
const resources = Object.fromEntries(['en', 'es'].map(language => [language, { translation: JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', language + '.json'), 'utf8')) }]));
const get = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);
const flatten = (object, prefix = '', result = {}) => {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string') result[prefix + key] = value;
    else flatten(value, prefix + key + '.', result);
  }
  return result;
};
const english = flatten(resources.en.translation);
const spanish = flatten(resources.es.translation);
const placeholders = value => [...value.matchAll(/\{\{\s*([^}]+)\s*\}\}/g)].map(match => match[1]).sort();
for (const [key, value] of Object.entries(english)) {
  assert.equal(typeof spanish[key], 'string', `Missing Spanish translation: ${key}`);
  assert.deepEqual(placeholders(value), placeholders(spanish[key]), `Interpolation mismatch: ${key}`);
}
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (/backup|indautor Req|^\.env|^\.git|node_modules/i.test(entry.name) || entry.name === 'config') continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (/\.(js|jsx|ts|tsx)$/.test(filename) && !filename.endsWith('.d.ts')) files.push(filename);
  }
}
walk(path.join(root, 'src'));
walk(path.join(root, 'components'));
let calls = 0;
const unresolvedStatic = [];
for (const filename of files) {
  const source = fs.readFileSync(filename, 'utf8');
  const ast = parser.parse(source, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
  traverse(ast, {
    CallExpression({ node }) {
      const callee = node.callee;
      if (!(callee.name === 't' || callee.name === 'i18nT' || callee.type === 'MemberExpression' && callee.object.name === 'uiI18n' && callee.property.name === 't')) return;
      if (node.arguments[0]?.type !== 'StringLiteral') return;
      const key = node.arguments[0].value;
      const returnsObject = node.arguments[1]?.properties?.some(property => property.key?.name === 'returnObjects' && property.value.value === true);
      for (const language of ['en', 'es']) {
        const value = get(resources[language].translation, key);
        assert.notEqual(value, undefined, `${path.relative(root, filename)}: missing ${language} key ${key}`);
        if (!returnsObject) {
          assert.equal(typeof value, 'string', `Object rendered as a label: ${key}`);
          // A key rendered as-is means the translation is missing/unresolved at runtime.
          if (value === key) unresolvedStatic.push(`${language}:${key} (${path.relative(root, filename)})`);
        }
      }
      calls++;
    }
  });
}
assert.equal(unresolvedStatic.length, 0, `Unresolved keys equal to their path:\n${unresolvedStatic.join('\n')}`);

// Dynamic / critical keys that must resolve (founder-reported Lab Organizer + Habits)
const CRITICAL_KEYS = [
  'labOrganizer.title',
  'labOrganizer.documents',
  'labOrganizer.values',
  'labOrganizer.glossary',
  'labOrganizer.questions',
  'labOrganizer.documentsDescription',
  'labOrganizer.noDocuments',
  'labOrganizer.documentsInfo',
  'labOrganizer.banner',
  'dailyHabits.title',
  'dailyHabits.sweetDrinksInfo',
  'dailyHabits.sweetDrinksDescription',
  'common.close',
  'common.cancel',
  'common.error',
  'common.save',
  ...['glucose', 'hemoglobin', 'cholesterol', 'creatinine', 'triglycerides', 'tsh', 'hba1c', 'alt', 'ast', 'wbc']
    .map((id) => `labOrganizer.glossaryTerms.${id}`),
];

async function checkSwitching() {
  const instance = i18next.createInstance();
  await instance.init({
    resources,
    lng: 'en',
    fallbackLng: false,
    initImmediate: false,
    interpolation: { escapeValue: false },
    // Match app behavior: missing keys render as the key path
    parseMissingKeyHandler: (key) => key,
  });

  // Prove the failure mode we guard against
  assert.equal(instance.t('this.key.does.not.exist'), 'this.key.does.not.exist');

  for (const language of ['en', 'es']) {
    await instance.changeLanguage(language);
    for (const key of CRITICAL_KEYS) {
      const value = instance.t(key);
      assert.notEqual(value, key, `Unresolved ${language} key rendered as-is: ${key}`);
      assert.equal(typeof value, 'string');
      assert.ok(value.trim().length > 0, `Empty ${language} translation: ${key}`);
    }
  }

  const subtitles = ['Intelligent reminders & notifications', 'Track health metrics, adherence and info', 'General health information with AI', 'Medical documents for doctor visits', 'Manage family health profiles and share information', 'Track screenings and preventive care', 'Organize lab results for your doctor visits', 'Track daily health habits and routines'];
  await instance.changeLanguage('en');
  for (const text of subtitles) {
    const key = Object.keys(english).find(key => english[key] === text);
    assert.ok(key, `Missing home subtitle: ${text}`);
    assert.equal(instance.t(key), text);
    await instance.changeLanguage('es');
    assert.equal(instance.t(key), spanish[key]);
    assert.notEqual(instance.t(key), text);
    await instance.changeLanguage('en');
  }
  await instance.changeLanguage('es');
  assert.equal(instance.t('medicalDocuments.labResults'), 'Resultados de Laboratorio');
  assert.equal(instance.t('medicalDocuments.document'), 'Documento');
  assert.equal(instance.t('labOrganizer.title'), 'Organizador de Laboratorios');
  assert.equal(instance.t('dailyHabits.title'), 'Hábitos Diarios');
  assert.equal(instance.t('dailyHabits.sweetDrinksInfo'), 'Sobre Bebidas Azucaradas');
  for (const [key, text] of Object.entries(english)) {
    if (!key.startsWith('ui.') || !placeholders(text).length) continue;
    const values = Object.fromEntries(placeholders(text).map(name => [name, 'CHECK']));
    assert.ok(!instance.t(key, values).includes('{{'), `Unresolved interpolation: ${key}`);
  }
  console.log(`PASS: ${files.length} source files parse; ${calls} static translation calls; ${Object.keys(english).length} bilingual keys; runtime en/es switching, critical keys, and interpolation.`);
}
checkSwitching().catch(error => { console.error(error.message); process.exitCode = 1; });
