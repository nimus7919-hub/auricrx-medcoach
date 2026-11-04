// Curated ingredient/class membership. Never infer an ingredient from a brand.
// NCCIH documents the herb/class relationship; aliases identify members of that class.
// Update the source, date, aliases and regression checks together when reviewing a rule.
export const INGREDIENTS = {
  warfarin: ['warfarin', 'warfarina', 'varfarina', 'warfarine'],
  acenocoumarol: ['acenocoumarol', 'acenocumarol', 'acénocoumarol'],
  apixaban: ['apixaban', 'apixabán', 'apixabana'],
  rivaroxaban: ['rivaroxaban', 'rivaroxabán', 'rivaroxabana'],
  dabigatran: ['dabigatran', 'dabigatrán', 'dabigatrana', 'dabigatran etexilate', 'etexilato de dabigatran'],
  heparin: ['heparin', 'heparina', 'héparine'],
  enoxaparin: ['enoxaparin', 'enoxaparina', 'énoxaparine'],
  aspirin: ['aspirin', 'aspirina', 'aspirine', 'acetylsalicylic acid', 'acido acetilsalicilico', 'acide acetylsalicylique', 'acetylsalicylsaure', '阿司匹林', '乙酰水杨酸'],
  clopidogrel: ['clopidogrel'],
  metformin: ['metformin', 'metformina', 'metformine', '二甲双胍'],
  insulin: ['insulin', 'insulina', 'insuline', '胰岛素', 'insulin glargine', 'insulina glargina', 'insulin lispro', 'insulina lispro', 'insulin aspart', 'insulina aspart'],
  glibenclamide: ['glibenclamide', 'glibenclamida', 'glyburide'],
  gliclazide: ['gliclazide', 'gliclazida'],
  glimepiride: ['glimepiride', 'glimepirida'],
  empagliflozin: ['empagliflozin', 'empagliflozina'],
  dapagliflozin: ['dapagliflozin', 'dapagliflozina'],
  sitagliptin: ['sitagliptin', 'sitagliptina'],
  furosemide: ['furosemide', 'furosemida', 'furosémide'],
  hydrochlorothiazide: ['hydrochlorothiazide', 'hidroclorotiazida'],
  spironolactone: ['spironolactone', 'espironolactona'],
  diazepam: ['diazepam', '地西泮'],
  lorazepam: ['lorazepam'],
  alprazolam: ['alprazolam'],
  clonazepam: ['clonazepam'],
  midazolam: ['midazolam'],
  zolpidem: ['zolpidem'],
  cyclosporine: ['cyclosporine', 'ciclosporin', 'ciclosporina', 'ciclosporine', '环孢素'],
  tacrolimus: ['tacrolimus'],
  mycophenolate: ['mycophenolate mofetil', 'micofenolato de mofetilo', 'mycophenolic acid', 'acido micofenolico'],
  azathioprine: ['azathioprine', 'azatioprina'],
  prednisone: ['prednisone', 'prednisona'],
  prednisolone: ['prednisolone', 'prednisolona'],
  dexamethasone: ['dexamethasone', 'dexametasona', '地塞米松'],
  hydrocortisone: ['hydrocortisone', 'hidrocortisona'],
  methylprednisolone: ['methylprednisolone', 'metilprednisolona'],
  digoxin: ['digoxin', 'digoxina', 'digoxine', '地高辛'],
  ethinylestradiol: ['ethinylestradiol', 'ethinyl estradiol', 'etinilestradiol', 'éthinylestradiol'],
  amitriptyline: ['amitriptyline', 'amitriptilina'],
  bupropion: ['bupropion', 'bupropión', 'bupropiona'],
  phenytoin: ['phenytoin', 'fenitoina', 'phénytoïne'],
  carbamazepine: ['carbamazepine', 'carbamazepina', '卡马西平'],
  ivabradine: ['ivabradine', 'ivabradina'],
  indinavir: ['indinavir'],
  nevirapine: ['nevirapine', 'nevirapina'],
  irinotecan: ['irinotecan', 'irinotecán', 'irinotecano'],
  imatinib: ['imatinib', 'imatinibe'],
  docetaxel: ['docetaxel'],
  simvastatin: ['simvastatin', 'simvastatina', 'sinvastatina', 'simvastatine'],
  caffeine: ['caffeine', 'cafeina', 'caféine', 'koffein', '咖啡因'],
  chloroquine: ['chloroquine', 'cloroquina'],
  saquinavir: ['saquinavir'],
  losartan: ['losartan', 'losartán'],
  valsartan: ['valsartan', 'valsartán'],
  telmisartan: ['telmisartan', 'telmisartán'],
  enalapril: ['enalapril'],
  lisinopril: ['lisinopril'],
  captopril: ['captopril'],
  amlodipine: ['amlodipine', 'amlodipino', 'amlodipina'],
  nifedipine: ['nifedipine', 'nifedipino', 'nifedipina'],
  verapamil: ['verapamil', 'verapamilo'],
  diltiazem: ['diltiazem'],
  metoprolol: ['metoprolol'],
  atenolol: ['atenolol'],
  paracetamol: ['paracetamol', 'acetaminophen', 'acetaminofen', 'acetaminofén'],
  clozapine: ['clozapine', 'clozapina'],
  sertraline: ['sertraline', 'sertralina'],
  fluoxetine: ['fluoxetine', 'fluoxetina'],
  escitalopram: ['escitalopram'],
  venlafaxine: ['venlafaxine', 'venlafaxina'],
  tramadol: ['tramadol'],
};

const anticoagulants = ['warfarin', 'acenocoumarol', 'apixaban', 'rivaroxaban', 'dabigatran', 'heparin', 'enoxaparin'];
const sedatives = ['diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'midazolam', 'zolpidem'];
const corticosteroids = ['prednisone', 'prednisolone', 'dexamethasone', 'hydrocortisone', 'methylprednisolone'];
const immunosuppressants = ['cyclosporine', 'tacrolimus', 'mycophenolate', 'azathioprine', ...corticosteroids];
const rule = (herb, slug, ingredients, basis) => ({
  herb, ingredients, basis, source: 'NCCIH',
  url: `https://www.nccih.nih.gov/health/${slug}`, checked: '2026-11-03',
});

const sourcedRule = (herb, source, url, ingredients, basis) => ({
  herb, source, url, ingredients, basis, checked: '2026-11-03',
});
const antihypertensives = ['losartan', 'valsartan', 'telmisartan', 'enalapril', 'lisinopril', 'captopril',
  'amlodipine', 'nifedipine', 'verapamil', 'diltiazem', 'metoprolol', 'atenolol',
  'hydrochlorothiazide', 'furosemide', 'spironolactone'];
const antidiabetics = ['metformin', 'insulin', 'glibenclamide', 'gliclazide', 'glimepiride',
  'empagliflozin', 'dapagliflozin', 'sitagliptin'];
const hibiscusUrl = 'https://medlineplus.awsqa.nlm.nih.gov/druginfo/natural/211.html';

export const HERB_INTERACTIONS = [
  rule('chamomile', 'chamomile', ['warfarin'], 'Reported warfarin interaction'),
  rule('chamomile', 'chamomile', sedatives, 'Theoretical sedative interaction'),
  rule('chamomile', 'chamomile', ['ethinylestradiol'], 'Preliminary evidence for oral contraceptives; route must be oral or unspecified'),
  rule('garlic', 'garlic', [...anticoagulants, 'aspirin'], 'Garlic supplements; medicines that affect bleeding'),
  rule('ginkgo_biloba', 'ginkgo', anticoagulants, 'Anticoagulant class; warfarin explicitly named'),
  rule('dandelion', 'dandelion', [...anticoagulants, 'aspirin', 'clopidogrel', 'metformin', 'insulin', 'glibenclamide', 'gliclazide', 'glimepiride', 'empagliflozin', 'dapagliflozin', 'sitagliptin', 'furosemide', 'hydrochlorothiazide', 'spironolactone'], 'Theoretical antidiabetes, anticoagulant, antiplatelet and diuretic interactions'),
  rule('aloe_vera', 'aloe-vera', ['digoxin'], 'Oral aloe latex overuse and cardiac glycosides'),
  rule('astragalus', 'astragalus', immunosuppressants, 'Immunosuppressant class'),
  rule('echinacea', 'echinacea', [...immunosuppressants, 'caffeine'], 'Theoretical immunosuppressant and caffeine interactions'),
  rule('liquorice', 'licorice-root', corticosteroids, 'Reported corticosteroid interactions'),
  rule('lavender', 'lavender', sedatives, 'Theoretical sedative interaction'),
  rule('st_johns_wort', 'st-johns-wort', ['amitriptyline', 'bupropion', 'ethinylestradiol', 'cyclosporine', 'phenytoin', 'carbamazepine', 'digoxin', 'ivabradine', 'indinavir', 'nevirapine', 'irinotecan', 'imatinib', 'docetaxel', 'warfarin', 'simvastatin'], 'Ingredients named by NCCIH; oral contraceptive member ethinylestradiol'),
  rule('st_johns_wort', 'st-johns-wort', ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'tramadol'], 'Serotonergic drug class; potential serious serotonin-related effects'),
  sourcedRule('garlic', 'NIH/NLM · estudio clínico', 'https://pubmed.ncbi.nlm.nih.gov/11740713/',
    ['saquinavir'], 'Human pharmacokinetic study of garlic supplements and unboosted saquinavir'),
  sourcedRule('hibiscus', 'MedlinePlus · ficha histórica', hibiscusUrl,
    [...antihypertensives, ...antidiabetics, 'chloroquine', 'simvastatin', 'paracetamol'],
    'Possible additive BP/glucose effects; reduced chloroquine absorption; uncertain clinical relevance for simvastatin/paracetamol'),
  sourcedRule('hibiscus', 'NIH/NLM · estudio en animales', 'https://pubmed.ncbi.nlm.nih.gov/21480802/',
    ['hydrochlorothiazide'], 'Rat/rabbit pharmacokinetic and diuretic interaction; not confirmed in humans'),
  sourcedRule('parsley', 'MedlinePlus', 'https://medlineplus.gov/ency/patientinstructions/000292.htm',
    ['warfarin', 'acenocoumarol'], 'Vitamin K antagonist class; large dietary changes, not a prohibition of culinary intake'),
  sourcedRule('notoginseng', 'NIH/NLM · ensayo pequeño', 'https://pubmed.ncbi.nlm.nih.gov/33370633/',
    ['aspirin'], 'Specific Panax notoginseng saponins with aspirin; not extrapolated to every preparation'),
  sourcedRule('angelica_sinensis', 'MSK', 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs/dong-quai',
    [...anticoagulants, 'aspirin', 'clopidogrel', 'clozapine'], 'Possible anticoagulant effect; aspirin/clopidogrel animal data; clozapine case reports involving formulas'),
  sourcedRule('ganoderma', 'MSK', 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs/reishi-mushroom',
    [...anticoagulants, 'aspirin', 'clopidogrel', ...immunosuppressants], 'Possible bleeding and immunosuppressant interactions; reishi preparations vary'),
  sourcedRule('holy_basil', 'OMS · datos experimentales', 'https://www.e-lactancia.org/media/papers/Plantas_medicinales_WHO_monographs-vol_2-2002.pdf#page=218',
    ['paracetamol'], 'WHO precaution based on eugenol experiments in glutathione-depleted mice; clinical relevance unknown'),
];

export function normalizeIngredient(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|iu|ui|%)(?:\s*\/.*)?$/i, '')
    .trim().replace(/\s+/g, ' ');
}
const aliases = new Map(Object.entries(INGREDIENTS).flatMap(([id, values]) =>
  values.map(value => [normalizeIngredient(value), id])));

export function getMedicationIngredients(medication) {
  const values = [medication.activeIngredient, medication.active_ingredient,
    ...(Array.isArray(medication.activeIngredients) ? medication.activeIngredients : []),
    ...(Array.isArray(medication.components) ? medication.components : [])];
  return values.flatMap(value => {
    const name = typeof value === 'string' ? value : value?.name;
    // Split combinations only at explicit separators. No substring or brand matches.
    return typeof name === 'string' ? name.split(/\s*(?:\+|;|\/)\s*/).map(part => part.trim()).filter(Boolean) : [];
  });
}

export function findHerbInteractions(herbKey, medications = []) {
  const matches = [];
  for (const medication of Array.isArray(medications) ? medications : []) {
    if (!medication || typeof medication !== 'object') continue;
    const ids = new Set(getMedicationIngredients(medication).map(value => aliases.get(normalizeIngredient(value))).filter(Boolean));
    const route = normalizeIngredient(medication.route || medication.administrationRoute || '');
    for (const entry of HERB_INTERACTIONS.filter(item => item.herb === herbKey)) {
      const matched = entry.ingredients.filter(id => ids.has(id) &&
        !(id === 'ethinylestradiol' && route && !['oral', 'via oral', 'por via oral', 'by mouth'].includes(route)));
      if (!matched.length) continue;
      // Merge all matched components for the same medicine/source.
      const existing = matches.find(item => item.medication === medication && item.url === entry.url);
      if (existing) {
        existing.matchedIngredients = [...new Set([...existing.matchedIngredients, ...matched])];
      } else {
        matches.push({ ...entry, medication, matchedIngredients: matched });
      }
    }
  }
  return matches;
}
