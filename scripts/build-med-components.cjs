/* One-time, idempotent catalog enrichment. Run: node scripts/build-med-components.cjs
 * Strengths describe products, not dosing instructions. Brand-only names remain unknown.
 * Reference: https://www.sidss.salud.gob.mx/contenidos/PDF/Cuadro_Basico_y_Catalogo_de_Medicamentos.pdf
 */
const fs = require('node:fs');
const path = require('node:path');
const normalize = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
const basics = `Paracetamol 500 mg;Paracetamol 750 mg;Metamizol 500 mg;Ibuprofeno 200 mg;Ibuprofeno 400 mg;Ibuprofeno 600 mg;Naproxeno 250 mg;Naproxeno 500 mg;Diclofenaco 50 mg;Diclofenaco 100 mg;Ketorolaco 10 mg;Meloxicam 7.5 mg;Meloxicam 15 mg;Celecoxib 200 mg;Loratadina 10 mg;Cetirizina 10 mg;Desloratadina 5 mg;Clorfenamina 4 mg;Omeprazol 20 mg;Pantoprazol 40 mg;Esomeprazol 20 mg;Ranitidina 150 mg;Famotidina 20 mg;Hidróxido de aluminio 200 mg + Hidróxido de magnesio 200 mg;Butilhioscina 10 mg;Loperamida 2 mg;Amoxicilina 500 mg;Amoxicilina 875 mg + Ácido clavulánico 125 mg;Azitromicina 500 mg;Ciprofloxacino 500 mg;Cefalexina 500 mg;Trimetoprima 160 mg + Sulfametoxazol 800 mg;Nitrofurantoína 100 mg;Metronidazol 500 mg;Doxiciclina 100 mg;Clindamicina 300 mg;Losartán 50 mg;Enalapril 10 mg;Captopril 25 mg;Amlodipino 5 mg;Nifedipino 30 mg;Metoprolol 100 mg;Propranolol 40 mg;Hidroclorotiazida 25 mg;Losartán 50 mg + Hidroclorotiazida 12.5 mg;Telmisartán 40 mg;Valsartán 80 mg;Metformina 500 mg;Metformina 850 mg;Metformina 1000 mg;Glibenclamida 5 mg;Glibenclamida 2.5 mg + Metformina 500 mg;Sitagliptina 100 mg;Sitagliptina 50 mg + Metformina 1000 mg;Linagliptina 5 mg;Dapagliflozina 10 mg;Empagliflozina 10 mg;Insulina glargina 100 UI/ml;Insulina NPH 100 UI/ml;Atorvastatina 20 mg;Simvastatina 20 mg;Rosuvastatina 10 mg;Pravastatina 10 mg;Ácido acetilsalicílico 100 mg;Clopidogrel 75 mg;Levotiroxina 100 mcg;Salbutamol inhalador 100 mcg;Beclometasona inhalador 50 mcg;Budesonida 160 mcg + Formoterol 4.5 mcg;Prednisona 5 mg;Dexametasona 0.5 mg;Albendazol 400 mg;Fluconazol 150 mg;Aciclovir 400 mg;Sertralina 50 mg;Fluoxetina 20 mg;Alopurinol 100 mg;Ácido fólico 5 mg;Sulfato ferroso 200 mg;Vitamina D3 1000 UI;Carbonato de calcio 500 mg;Tamsulosina 0.4 mg;Sildenafil 50 mg;Ondansetrón 8 mg;Metoclopramida 10 mg`.split(';');
const aliases = new Map();
for (const name of basics) {
  for (const part of name.split(' + ')) {
    const ingredient = part.replace(/\s+\d.*$/, '').replace(/ inhalador$/, '');
    aliases.set(normalize(ingredient), ingredient);
  }
}
// Explicit translations only: never infer an ingredient from a brand.
const translations = {
  acetaminophen: 'Paracetamol', acetaminofen: 'Paracetamol', caffeine: 'Cafeína', cafeina: 'Cafeína',
  naproxen: 'Naproxeno', 'naproxen sodium': 'Naproxeno sódico',
  ibuprofen: 'Ibuprofeno', diclofenac: 'Diclofenaco', ketorolac: 'Ketorolaco',
  meloxicam: 'Meloxicam', loratadine: 'Loratadina', cetirizine: 'Cetirizina',
  chlorphenamine: 'Clorfenamina', chlorpheniramine: 'Clorfenamina', omeprazole: 'Omeprazol',
  pantoprazole: 'Pantoprazol', esomeprazole: 'Esomeprazol', amoxicillin: 'Amoxicilina',
  'clavulanic acid': 'Ácido clavulánico', azithromycin: 'Azitromicina', ciprofloxacin: 'Ciprofloxacino',
  cephalexin: 'Cefalexina', trimethoprim: 'Trimetoprima', sulfamethoxazole: 'Sulfametoxazol',
  metronidazole: 'Metronidazol', doxycycline: 'Doxiciclina', clindamycin: 'Clindamicina',
  losartan: 'Losartán', amlodipine: 'Amlodipino', nifedipine: 'Nifedipino', metoprolol: 'Metoprolol',
  hydrochlorothiazide: 'Hidroclorotiazida', metformin: 'Metformina', atorvastatin: 'Atorvastatina',
  simvastatin: 'Simvastatina', rosuvastatin: 'Rosuvastatina', pravastatin: 'Pravastatina',
  prednisone: 'Prednisona', dexamethasone: 'Dexametasona', albendazole: 'Albendazol',
  fluconazole: 'Fluconazol', acyclovir: 'Aciclovir', sertraline: 'Sertralina', fluoxetine: 'Fluoxetina',
  allopurinol: 'Alopurinol', 'folic acid': 'Ácido fólico', pyrilamine: 'Pirilamina', pamabrom: 'Pamabrom',
  amikacin: 'Amikacina', ceftriaxone: 'Ceftriaxona', levonorgestrel: 'Levonorgestrel', tadalafil: 'Tadalafil',
  tiamina: 'Tiamina', piridoxina: 'Piridoxina', cianocobalamina: 'Cianocobalamina',
};
for (const [alias, name] of Object.entries(translations)) {
  aliases.set(alias, name);
  aliases.set(normalize(name), name);
}
// English gliptin INNs have a regular Spanish -ina ending.
for (const stem of ['vildaglipt', 'sitaglipt', 'linaglipt', 'saxaglipt', 'aloglipt', 'teneliglipt', 'gemiglipt', 'evoglipt', 'omariglipt']) {
  const spanish = stem[0].toUpperCase() + stem.slice(1) + 'ina';
  aliases.set(stem + 'in', spanish);
  aliases.set(stem + 'ina', spanish);
}
const ingredientPattern = new RegExp(`\\b(?:${[...aliases.keys()].sort((a,b) => b.length-a.length).join('|')})\\b`, 'g');
function parseComponents(name) {
  const text = normalize(name).replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(mg|mcg|g)\b/g, '$1 $3 / $2 $3');
  // Match ingredient names independently of separators. Text after the final
  // strength (brands and pack descriptions such as 'galvus met caja') is ignored.
  const ingredients = [...text.matchAll(ingredientPattern)];
  // Keep concentrations together; slash is also an ingredient separator elsewhere.
  const strengths = [...text.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:mcg|µg|mg|g|ui|iu|%)(?:\s*\/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:ml|g))?\b/g)];
  const ordered = strengths.length === ingredients.length;
  return ingredients.map((match, i) => {
    const next = ingredients[i + 1]?.index ?? text.length;
    const local = strengths.filter(s => s.index >= match.index + match[0].length && s.index < next);
    // Equal-length lists include "A, B brand 275 mg, 300 mg" and strength-first labels.
    const strength = ordered ? strengths[i]?.[0] : local.length === 1 ? local[0][0] : '';
    return `${aliases.get(match[0])}${strength ? ` ${strength.replace(/\s+/g, ' ').replace(/iu/g, 'UI').replace(/ui/g, 'UI')}` : ''}`;
  });
}
function build() {
  const file = path.join(__dirname, '../assets/medicationData.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = fs.statSync(file).size;
  const withComponentsBefore = data.filter(r => r.components?.length).length;
  for (const row of data) {
    if (row.source !== 'generic') row.components = parseComponents(String(row.Medicinas || row.medicinas || ''));
  }
  const seen = new Set(data.map(row => normalize(String(row.Medicinas || row.medicinas || ''))));
  let added = 0;
  function add(name, components = parseComponents(name)) {
    if (seen.has(normalize(name))) return;
    data.push({ Medicinas: name, components, source: 'generic' });
    seen.add(normalize(name));
    added++;
  }
  for (const name of basics) add(name);
  add('Sales de rehidratación oral', ['Glucosa anhidra 13.5 g/L', 'Cloruro de sodio 2.6 g/L', 'Cloruro de potasio 1.5 g/L', 'Citrato trisódico dihidratado 2.9 g/L']);
  add('Complejo B: Tiamina 100 mg + Piridoxina 5 mg + Cianocobalamina 50 mcg', ['Tiamina 100 mg', 'Piridoxina 5 mg', 'Cianocobalamina 50 mcg']);
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(JSON.stringify({ total: data.length, withComponentsBefore, withComponentsAfter: data.filter(r => r.components?.length).length, added, bytesBefore: before, bytesAfter: fs.statSync(file).size }));
}
if (require.main === module) build();
module.exports = { parseComponents };
