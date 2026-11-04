const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');

const modules = ['src/screens/HerbsReviewScreen.js', 'src/data/herbInteractions.js',
  'src/data/herbDetailsEs.js',
  'src/data/herbCatalog.js', 'src/navigation/AppNavigator.js', 'src/screens/HerbsScreen.tsx',
  'src/data/herbs.js', 'src/data/herbs.ts'];
for (const file of modules) parser.parse(fs.readFileSync(file, 'utf8'), {
  sourceType: 'module', plugins: ['jsx', 'typescript'],
});
const sandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync('src/data/herbInteractions.js', 'utf8')
  .replace(/export /g, '') + '\nmodule.exports = { findHerbInteractions, getMedicationIngredients, HERB_INTERACTIONS };', sandbox);
const { findHerbInteractions: find, HERB_INTERACTIONS: rules } = sandbox.module.exports;
const med = (name, ...components) => ({ name, components: components.map(name => ({ name })) });
assert.equal(find('chamomile', [med('Marca local', 'Warfarina')]).length, 1);
assert.equal(find('chamomile', [med('Marca local', 'warfarina 5 mg')]).length, 1);
assert.equal(find('garlic', [med('Combinado', 'Ácido acetilsalicílico', 'Warfarina')]).length, 1);
assert.equal(find('garlic', [med('Combinado', 'paracetamol + ácido acetilsalicílico')]).length, 1);
assert.equal(find('chamomile', [{ name: 'Warfarina' }]).length, 0, 'Never infer active ingredients from medicine names');
assert.equal(find('chamomile', [med('Unrelated', 'notwarfarin')]).length, 0);
assert.equal(find('chamomile', [med('Pain relief', 'Paracetamol')]).length, 0);
assert.equal(find('ginger', [med('Anticoagulant', 'Warfarina')]).length, 0, 'No guessed ginger interactions');
assert.equal(find('aloe_vera', [med('Cardiac medicine', 'Digoxina')]).length, 1);
assert.equal(find('st_johns_wort', [med('Mood medicine', 'Bupropión')]).length, 1);
assert.equal(find('liquorice', [med('Corticosteroid', 'Prednisona')]).length, 1);
assert.equal(find('chamomile', [{ ...med('Patch', 'etinilestradiol'), route: 'transdermal' }]).length, 0);
assert.equal(find('lavender', [med('Sedative', 'Lorazepam')]).length, 1);
assert.equal(find('garlic', []).length, 0);
assert.equal(find('garlic', null).length, 0);
assert.equal(find('hibiscus', [med('Presión', 'Losartán 50 mg')]).length, 1);
assert.equal(find('hibiscus', [med('Antipalúdico', 'Cloroquina')]).length, 1);
assert.equal(find('hibiscus', [med('Diurético', 'Hidroclorotiazida')]).length, 2, 'Clinical caution and animal evidence have separate sources');
assert.equal(find('garlic', [med('Antiviral', 'Saquinavir')]).length, 1);
assert.equal(find('parsley', [med('Anticoagulante', 'Warfarina')]).length, 1);
assert.equal(find('notoginseng', [med('Antiagregante', 'Ácido acetilsalicílico')]).length, 1);
assert.equal(find('ganoderma', [med('Trasplante', 'Tacrolimus')]).length, 1);
assert.equal(find('st_johns_wort', [med('Ánimo', 'Sertralina')]).length, 1);
assert.equal(find('holy_basil', [med('Dolor', 'Acetaminofén')]).length, 1);
assert.equal(find('hibiscus', [{ name: 'Losartán' }]).length, 0);
assert.equal(find('hibiscus', [med('No coincide', 'notlosartan')]).length, 0);
assert.equal(find('cilantro', [med('Dolor', 'Paracetamol')]).length, 0);
assert.equal(find('st_johns_wort', [med('Combinación', 'amitriptilina + sertralina')])[0].matchedIngredients.length, 2);
const records = JSON.parse(fs.readFileSync('src/data/herbReview.json', 'utf8'));
assert.equal(records.length, 40);
assert.equal(new Set(records.map(record => record.key)).size, 40);
for (const rule of rules) {
  assert.match(rule.url, /^https:\/\/(www\.nccih\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov|medlineplus\.gov|medlineplus\.awsqa\.nlm\.nih\.gov|www\.mskcc\.org|www\.e-lactancia\.org)\//);
  assert.equal(rule.checked, '2026-11-03');
  assert(rule.ingredients.length);
}
let referenceKeys;
for (const language of ['es', 'en', 'fr', 'de', 'pt', 'zh']) {
  const data = JSON.parse(fs.readFileSync(`src/i18n/${language}.json`, 'utf8'));
  const labels = data.herbReview;
  assert(!JSON.stringify(labels).includes('?'), `${language}: unexpected encoding replacement`);
  assert(!JSON.stringify(labels).includes('\uFFFD'), `${language}: invalid UTF-8 replacement`);
  referenceKeys ||= Object.keys(labels).sort();
  assert.deepEqual(Object.keys(labels).sort(), referenceKeys);
  for (const record of records) {
    assert(record.names[language]);
    assert(labels[record.safety]);
    assert(!Object.hasOwn(record, 'poisonous'));
    for (const key of [record.summaryKey, record.evidence, ...record.precautionKeys].filter(Boolean)) assert(labels[key], key);
    for (const key of record.interactionKeys) assert(labels[`class_${key}`], key);
  }
  assert(!data.herbs.details.poisonous);
  assert(!/afrodis|aphrodis|\bFDA\b|\bGRAS\b/i.test(JSON.stringify(data.localized?.herbs || {})));
}
const es = JSON.parse(fs.readFileSync('src/i18n/es.json', 'utf8')).herbReview;
assert.equal(es.alert, 'Según {{source}}, {{herb}} podría interactuar con {{medication}} de tu lista. Habla con tu médico o farmacéutico antes de combinarlos. No suspendas ni cambies tu medicamento por tu cuenta.');
assert.equal(es.damiana, 'Tradicionalmente se ha usado en la medicina popular para temas digestivos y de ánimo.');
const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8')).herbReview;
assert.equal(en.noMatches, "We found no interactions in our sources, but that doesn't guarantee it's safe. Ask your pharmacist.");
assert.equal(en.alert, "According to {{source}}, {{herb}} may interact with {{medication}} on your list. Talk to your doctor or pharmacist before combining them. Don't stop or change your medication on your own.");
assert.equal(es.footer, 'Información general con fines educativos. No es un diagnóstico ni una recomendación de tratamiento y no sustituye el consejo de un profesional de la salud. Los productos herbolarios pueden causar efectos adversos e interactuar con medicamentos. Si estás embarazada, amamantando, tienes una enfermedad o tomas medicamentos, consulta a tu médico o farmacéutico antes de usarlos.');
assert.equal(en.footer, "General educational information. Not a diagnosis or treatment recommendation and not a substitute for advice from a health professional. Herbal products can cause side effects and interact with medicines. If you're pregnant, breastfeeding, have a condition or take medicines, check with your doctor or pharmacist before using them.");
const catalog = fs.readFileSync('src/data/herbCatalog.js', 'utf8');
for (const match of catalog.matchAll(/require\('([^']+)'\)/g)) {
  assert(fs.existsSync(require('node:path').resolve('src/data', match[1])), match[1]);
}
const detailSandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync('src/data/herbDetailsEs.js', 'utf8').replace(/export /g, '') +
  '\nmodule.exports = HERB_DETAILS_ES;', detailSandbox);
const details = detailSandbox.module.exports;
assert.deepEqual(Object.keys(details).sort(), records.map(record => record.key).sort());
for (const record of records) {
  const detail = details[record.key];
  assert.match(detail.uses, /^Tradicionalmente se ha usado para /);
  assert.match(detail.evidence, /^(Insuficiente|Limitada|Moderada)/);
  assert(detail.precautions.length > 70 && detail.interactions.length > 70);
  assert(detail.sources.length > 0);
  for (const source of detail.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.equal(source.checked, '2026-11-03');
  }
  assert(!/\bsegura\b|venenosa|afrodis|\uFFFD|\?\?/i.test(JSON.stringify(detail)));
}
assert.equal(details.cilantro.safety, 'Sin riesgos importantes conocidos en cantidades de alimentos');
assert(!catalog.includes("require('../../assets/herbs/cilantro.png')"));
assert(!catalog.includes("'yerba_mansa':"), 'Uncertain plant image must use placeholder');
assert(!catalog.includes("'aristolochia':"), 'Species-uncertain illustration must use placeholder');
assert(catalog.includes('Coriandrum_sativum_003.JPG'));
console.log('PASS: module syntax, 40 Spanish details, six language resources, sourced rules and ingredient matching regressions.');
