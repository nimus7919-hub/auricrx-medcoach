const fs = require('fs');
const path = require('path');

const targetDir = path.join('indautor Req', 'AuricRX_MedCoach_Deposito_v1', '03_Codigo_Muestras');
const files = [
  { src: 'services/enhancedMedicationSearch.js', dest: 'enhancedMedicationSearch.js' },
  { src: 'services/pharmacySearch.ts', dest: 'pharmacySearch.ts' },
  { src: 'components/MedicationRefillModal.tsx', dest: 'MedicationRefillModal.tsx' },
  { src: 'src/services/smartNotifications.ts', dest: 'smartNotifications.ts' },
  { src: 'src/services/healthMetrics.ts', dest: 'healthMetrics.ts' },
  { src: 'src/services/aiHealthService.ts', dest: 'aiHealthService.ts' },
  { src: 'src/screens/MedicalDocumentsScreen_Simplified.tsx', dest: 'MedicalDocumentsScreen_Simplified.tsx' },
  { src: 'src/screens/SmartNotificationsScreen.tsx', dest: 'SmartNotificationsScreen.tsx' },
  { src: 'src/screens/AIHealthScreen.tsx', dest: 'AIHealthScreen.tsx' },
  { src: 'server/index.js', dest: 'server_index.js' },
  { src: 'server/neon.js', dest: 'neon.js' },
  { src: 'server/trial-schema-neon-ready.sql', dest: 'trial-schema-neon-ready.sql' },
];

const replacements = [
  { pattern: /sk-[A-Za-z0-9]{16,}/g, replacement: '<REDACTED>' },
  { pattern: /AIza[0-9A-Za-z_-]{10,}/g, replacement: '<REDACTED>' },
  { pattern: /pk\.[0-9A-Za-z]{10,}/g, replacement: '<REDACTED>' }
];

for (const file of files) {
  const content = fs.readFileSync(file.src, 'utf8');
  let sanitized = content;
  for (const { pattern, replacement } of replacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  const ext = path.extname(file.dest).toLowerCase();
  const headerLines = ext === '.sql'
    ? ['-- Extracto representativo para deposito INDAUTOR.', '-- Secretos/identificadores han sido removidos o sustituidos por "<REDACTED>".', '']
    : ['// Extracto representativo para deposito INDAUTOR.', '// Secretos/identificadores han sido removidos o sustituidos por "<REDACTED>".', ''];
  const header = headerLines.join('\n');
  const output = `${header}\n${sanitized}`;
  fs.writeFileSync(path.join(targetDir, file.dest), output, 'utf8');
}

console.log('Sanitized files copied to', targetDir);
