const fs = require('fs');
const path = require('path');

const langs = ['en', 'es', 'pt', 'fr', 'de', 'zh'];
let output = '// Auto-generated file - Legal documents as strings\n// DO NOT EDIT MANUALLY\n\n';

langs.forEach(lang => {
  const file = path.join(__dirname, `TermsOfService-${lang}.md`);
  const content = fs.readFileSync(file, 'utf8');
  const constName = `terms${lang.toUpperCase()}`;
  output += `export const ${constName} = ${JSON.stringify(content)};\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'legalTexts.ts'), output);
console.log('✅ Created legalTexts.ts successfully!');

