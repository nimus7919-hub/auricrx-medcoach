#!/usr/bin/env node
/**
 * Fails CI if i18n strings or alert/summary templates contain banned
 * clinical-judgment terms (ES + EN). See docs/COMPLIANCE_GUARDRAILS.md.
 *
 * Scans:
 * - packages/doctor-core/i18n/*.json
 * - apps/doctor/src/i18n/*.json
 * - src/i18n/*.json doctorMode + preVisitIntake + bodyMap subtrees
 * - packages/doctor-core/src/compliance/descriptiveSummary.ts (template literals via export test)
 * - server/doctor-alerts.js push copy
 * - server/doctor-ai-summary.js templates
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Keep in sync with packages/doctor-core/src/compliance/bannedTerms.ts
const BANNED = {
  en: [
    'diagnosis', 'diagnose', 'diagnosed', 'diagnostic',
    'deteriorating', 'deteriorate', 'deterioration',
    'worsening', 'worsen', 'worsened',
    'critical', 'urgent', 'urgency',
    'abnormal', 'abnormally',
    'triage', 'triaged',
    'risk score', 'high risk', 'low risk', 'at risk',
    'prediction', 'predict', 'predicted', 'prognosis',
    'recommend treatment', 'treatment recommendation',
    'recommend dose', 'dose recommendation', 'prescribed dose',
    'should take', 'seek emergency', 'hypertensive emergency',
    'medical emergency', 'life-threatening', 'life threatening',
  ],
  es: [
    'diagnóstico', 'diagnostico', 'diagnosticar', 'diagnosticado', 'diagnóstica', 'diagnostica',
    'deterioro', 'deteriorando', 'deteriorándose', 'deteriorandose',
    'empeorando', 'empeoramiento', 'empeorar',
    'crítico', 'critico', 'crítica', 'critica',
    'urgente', 'urgencia',
    'anormal', 'anómalo', 'anomalo', 'anómala', 'anomala',
    'triaje', 'triage',
    'puntuación de riesgo', 'puntuacion de riesgo',
    'alto riesgo', 'bajo riesgo', 'en riesgo',
    'predicción', 'prediccion', 'predecir', 'pronóstico', 'pronostico',
    'recomendar tratamiento', 'recomendación de tratamiento', 'recomendacion de tratamiento',
    'recomendar dosis', 'recomendación de dosis', 'recomendacion de dosis',
    'debe tomar', 'busque emergencia', 'urgencia hipertensiva',
    'emergencia médica', 'emergencia medica', 'peligro de muerte', 'amenaza la vida',
  ],
};

const ALLOW_PATH_MARKERS = [
  'COMPLIANCE_GUARDRAILS',
  'bannedTerms',
  'check-compliance-terms',
  'aiFilter',
  'doctor-ai-summary', // prompt + filter must name banned terms
  'compliance/__tests__',
  'complianceBanned',
];

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBanned(text) {
  const normalized = normalize(text);
  const found = [];
  const all = [...BANNED.en, ...BANNED.es].sort((a, b) => b.length - a.length);
  for (const term of all) {
    const needle = normalize(term);
    if (!needle) continue;
    if (needle.includes(' ')) {
      if (normalized.includes(needle)) found.push(term);
    } else {
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i');
      if (re.test(normalized)) found.push(term);
    }
  }
  return [...new Set(found)];
}

function walkStrings(obj, prefix = '') {
  const out = [];
  if (obj == null) return out;
  if (typeof obj === 'string') {
    out.push({ key: prefix || '(root)', value: obj });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...walkStrings(v, `${prefix}[${i}]`)));
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      out.push(...walkStrings(v, next));
    }
  }
  return out;
}

function shouldSkipFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  return ALLOW_PATH_MARKERS.some((m) => rel.includes(m));
}

function collectTargets() {
  const files = [];
  const addGlob = (dir, re) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) addGlob(full, re);
      else if (re.test(name)) files.push(full);
    }
  };

  addGlob(path.join(ROOT, 'packages/doctor-core/i18n'), /\.json$/);
  addGlob(path.join(ROOT, 'apps/doctor/src/i18n'), /\.json$/);
  for (const loc of ['en', 'es', 'fr', 'de', 'pt', 'zh']) {
    files.push(path.join(ROOT, 'src/i18n', `${loc}.json`));
  }
  files.push(path.join(ROOT, 'server/doctor-alerts.js'));
  files.push(path.join(ROOT, 'server/doctor-ai-summary.js'));
  files.push(path.join(ROOT, 'packages/doctor-core/src/compliance/descriptiveSummary.ts'));
  files.push(path.join(ROOT, 'packages/doctor-core/src/compliance/alertCopy.ts'));
  files.push(path.join(ROOT, 'packages/doctor-core/src/phase1/appointmentRequest.ts'));
  return files.filter((f) => fs.existsSync(f));
}

function scanJsonDoctorMode(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // Patient locales are huge — only scan doctorMode (+ top-level doctor app keys already small)
  if (filePath.includes(`${path.sep}src${path.sep}i18n${path.sep}`)) {
    return [
      ...walkStrings(raw.doctorMode || {}, 'doctorMode'),
      // Pre-visit intake (patient side) — descriptive-only copy, see docs/doctor/pre-visit-intake.md
      ...walkStrings(raw.preVisitIntake || {}, 'preVisitIntake'),
      // Layered body pain map (patient-reported locations only)
      ...walkStrings(raw.bodyMap || {}, 'bodyMap'),
    ];
  }
  return walkStrings(raw);
}

function scanTextFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  // Extract string literals roughly
  const strings = [];
  const re = /(['"`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[2] && m[2].length > 2) strings.push({ key: `literal@${m.index}`, value: m[2] });
  }
  // Also genericPushCopy bodies
  return strings;
}

const issues = [];

for (const file of collectTargets()) {
  if (shouldSkipFile(file)) continue;
  const rel = path.relative(ROOT, file);
  let entries = [];
  try {
    if (file.endsWith('.json')) entries = scanJsonDoctorMode(file);
    else entries = scanTextFile(file);
  } catch (err) {
    console.error(`Failed to read ${rel}:`, err.message);
    process.exit(2);
  }
  for (const { key, value } of entries) {
    const hits = findBanned(value);
    if (hits.length) {
      issues.push({ file: rel, key, hits, sample: value.slice(0, 120) });
    }
  }
}

if (issues.length) {
  console.error('Compliance term check FAILED. Banned clinical-judgment terms found:\n');
  for (const issue of issues) {
    console.error(`- ${issue.file} :: ${issue.key}`);
    console.error(`  terms: ${issue.hits.join(', ')}`);
    console.error(`  text: ${JSON.stringify(issue.sample)}`);
  }
  console.error(`\n${issues.length} issue(s). See docs/COMPLIANCE_GUARDRAILS.md`);
  process.exit(1);
}

console.log('check-compliance-terms: OK (no banned clinical-judgment terms in scanned strings)');
