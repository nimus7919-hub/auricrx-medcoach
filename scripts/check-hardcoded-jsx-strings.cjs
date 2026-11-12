#!/usr/bin/env node
/**
 * Flags obvious hardcoded user-facing English string literals in JSX
 * within priority feature screens (Dashboard + new five features).
 *
 * Heuristic only — allowlists known intentional English (brand, codes, icons).
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'src/screens/Dashboard.js',
  'src/screens/DashboardHelpModal.js',
  'src/screens/FamilyCircleScreen.tsx',
  'src/screens/FamilyCircleUpgradeScreen.tsx',
  'src/screens/InviteFamilyMemberScreen.tsx',
  'src/screens/AcceptInviteScreen.tsx',
  'src/screens/AddFamilyMemberScreen.tsx',
  'src/screens/SharePreviewScreen.tsx',
  'src/screens/PreventionPlannerScreen.tsx',
  'src/screens/LabDocumentOrganizerScreen.tsx',
  'src/screens/DailyHabitsScreen.tsx',
  'src/screens/HerbsReviewScreen.js',
];

const ALLOW = [
  /^[0-9\s:./\-_%+#@]+$/,
  /^[✓✕×•·⚠️ℹ️🩺🌟👨‍👩‍👧‍👦🛡️🔬📝👤📋🔔📤💾⏰]+$/,
  /^(OK|PRO|PDF|ID|US|MX|AI|N\/A|Health Connect)$/i,
  /^AuricRX/,
  /^https?:\/\//,
  /^#[0-9A-Fa-f]{3,8}$/,
  /^(flex|row|column|center|stretch|absolute|relative)$/,
];

// Strings that must never appear hardcoded in these files
const FORBIDDEN = [
  'Family Circle',
  'Prevention Planner',
  'Lab Organizer',
  'Daily Habits',
  'Medicine Lookup',
  'Manage family health profiles and share information',
  'Track screenings and preventive care',
  'Organize lab results and track trends',
  'Track daily health habits and routines',
  'Medicine info, recalls, prices and pharmacies',
  'Health Analytics',
  'Análisis de Salud',
  'Enter name',
  'Regular Profile',
  'Profile Type',
  'Birth Year (optional)',
  'What the evidence says',
  'Lo que dice la evidencia',
];

const suspicious = [];
const forbiddenHits = [];

function looksEnglishSentence(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (!/\s/.test(trimmed)) return false;
  // Skip pure template-looking / code-like
  if (/^[{}[\]().,;]+$/.test(trimmed)) return false;
  if (ALLOW.some((re) => re.test(trimmed) && !FORBIDDEN.includes(trimmed))) return false;
  // Prefer title-case or sentence-like English
  return /[A-Za-z]{3,}/.test(trimmed) && /[a-z]/.test(trimmed);
}

for (const rel of TARGETS) {
  const filename = path.join(ROOT, rel);
  if (!fs.existsSync(filename)) continue;
  const source = fs.readFileSync(filename, 'utf8');
  for (const phrase of FORBIDDEN) {
    if (source.includes(`"${phrase}"`) || source.includes(`'${phrase}'`) || source.includes(`\`${phrase}`)) {
      // allow only inside comments
      const withoutComments = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      if (withoutComments.includes(`"${phrase}"`) || withoutComments.includes(`'${phrase}'`) || withoutComments.includes(`\`${phrase}`)) {
        forbiddenHits.push(`${rel}: forbidden hardcoded "${phrase}"`);
      }
    }
  }

  let ast;
  try {
    ast = parser.parse(source, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript', 'classProperties'],
    });
  } catch (error) {
    console.error(`Parse failed ${rel}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  traverse(ast, {
    JSXText(nodePath) {
      const raw = nodePath.node.value.replace(/\s+/g, ' ').trim();
      if (FORBIDDEN.includes(raw)) forbiddenHits.push(`${rel}: JSXText "${raw}"`);
      else if (looksEnglishSentence(raw)) suspicious.push(`${rel}:${nodePath.node.loc?.start.line || '?'}: JSXText "${raw}"`);
    },
    JSXAttribute(nodePath) {
      const name = nodePath.node.name?.name;
      if (!['title', 'subtitle', 'placeholder', 'accessibilityLabel', 'accessibilityHint'].includes(name)) return;
      const valueNode = nodePath.node.value;
      if (!valueNode) return;
      if (valueNode.type === 'StringLiteral') {
        const raw = valueNode.value;
        if (FORBIDDEN.includes(raw)) forbiddenHits.push(`${rel}: ${name}="${raw}"`);
        else if (looksEnglishSentence(raw)) suspicious.push(`${rel}:${valueNode.loc?.start.line || '?'}: ${name}="${raw}"`);
      }
    },
  });
}

if (forbiddenHits.length) {
  console.error('FAIL: forbidden hardcoded strings:\n' + forbiddenHits.join('\n'));
  process.exitCode = 1;
} else if (suspicious.length > 25) {
  // Soft signal: too many suspicious leftovers likely means sweep incomplete
  console.error(`FAIL: ${suspicious.length} suspicious hardcoded JSX strings (showing 40):\n` + suspicious.slice(0, 40).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: no forbidden hardcoded feature strings; ${suspicious.length} low-priority suspicious JSX texts noted.`);
  if (suspicious.length) console.log(suspicious.slice(0, 15).join('\n'));
}
