const fs = require('fs');
const path = require('path');
const labels = { en: 'Scan', es: 'Escanear', de: 'Scannen', fr: 'Numériser', pt: 'Digitalizar', zh: '扫描' };
for (const [language, scan] of Object.entries(labels)) {
  const file = path.join(__dirname, '..', 'src', 'i18n', `${language}.json`);
  let source = fs.readFileSync(file, 'utf8');
  if (!JSON.parse(source).documentScanner) {
    source = source.replace('{', `{\n  "documentScanner": ${JSON.stringify({ scan })},`);
    fs.writeFileSync(file, source);
  }
}
const screen = path.join(__dirname, '..', 'src', 'screens', 'MedicalDocumentsScreen.tsx');
fs.writeFileSync(screen, fs.readFileSync(screen, 'utf8').replaceAll('t("medicalDocuments.takePhoto")', 't("documentScanner.scan")'));
