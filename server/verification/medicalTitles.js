function stripAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const GENERAL_MEDICAL_PATTERNS = [
  /\bmedico\s+cirujano\b/i,
  /\bmedicina\b/i,
  /\bmedico\b/i,
  /\bsurgery\b/i,
  /\bphysician\b/i,
  /\bdoctor\s+of\s+medicine\b/i,
  /\bm\.?\s*d\.?\b/i,
];

const SPECIALTY_HINTS = [
  /\bespecialidad\b/i,
  /\bespecialista\b/i,
  /\bresidencia\b/i,
  /\bcardio/i,
  /\bpedia/i,
  /\bginec/i,
  /\bobstetric/i,
  /\btraumato/i,
  /\bortho/i,
  /\bdermato/i,
  /\bneuro/i,
  /\bpsiquiatr/i,
  /\banestesi/i,
  /\bradiolog/i,
  /\boncolog/i,
  /\bendocrin/i,
  /\bgastro/i,
  /\bnefrolog/i,
  /\burolog/i,
  /\boftalmolog/i,
  /\botorrino/i,
  /\bgeriatr/i,
  /\bmedicina\s+interna\b/i,
  /\bmedicina\s+familiar\b/i,
  /\bmedicina\s+critica\b/i,
  /\bmedicina\s+de\s+urgencia/i,
  /\bcirugia\b/i,
];

function isMedicalGeneralTitle(titulo) {
  const t = stripAccents(titulo);
  if (!t) return false;
  if (/\benfermer/.test(t) && !/\bmedico/.test(t)) return false;
  if (/\bdentista|odontolog|cirujano\s+dentista/.test(t)) return false;
  return GENERAL_MEDICAL_PATTERNS.some((re) => re.test(t));
}

function isMedicalSpecialtyTitle(titulo) {
  const t = stripAccents(titulo);
  if (!t) return false;
  if (isMedicalGeneralTitle(t) && SPECIALTY_HINTS.some((re) => re.test(t))) return true;
  return SPECIALTY_HINTS.some((re) => re.test(t)) && /\bmedico|medicina|cirugia|cirujano/.test(t);
}

function isPhysicianTaxonomyCode(code) {
  const c = String(code || '').trim().toUpperCase();
  return /^207[A-Z0-9]{6}X?$/.test(c) || c.startsWith('207');
}

function isPhysicianTaxonomyDesc(desc) {
  const d = stripAccents(desc);
  if (!d) return false;
  if (/student|technician|assistant|nurse|pharmacy|chiropractic|optometr|podiatr|dentist|counselor|social\s+worker/.test(d)) {
    return false;
  }
  return (
    /physician|internist|surgery|surgical|family\s+medicine|pediatrics|psychiatry|cardiology|dermatology|neurology|radiology|anesthesiology|emergency\s+medicine|obstetrics|gynecology|orthopaedic|orthopedic|urology|ophthalmology|otolaryngology|pathology|oncology|endocrinology|gastroenterology|nephrology|rheumatology|pulmonology|hospitalist|osteopath/.test(
      d
    ) || /m\.?\s*d\.?|d\.?\s*o\.?/.test(d)
  );
}

module.exports = {
  isMedicalGeneralTitle,
  isMedicalSpecialtyTitle,
  isPhysicianTaxonomyCode,
  isPhysicianTaxonomyDesc,
};
