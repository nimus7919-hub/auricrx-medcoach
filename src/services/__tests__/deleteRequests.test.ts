/**
 * Regression: HTTP verbs were being replaced by translated strings
 * (method: uiI18n.t("ai.delete") -> "Eliminar" in Spanish), which broke every delete request.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const SKIP = new Set(['node_modules', '.git', 'server', 'backup_', 'android', 'ios', 'dist']);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('backup_') || entry.name.includes('.backup')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !/__tests__|\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

describe('HTTP methods are never translated', () => {
  const files = [...sourceFiles(path.join(ROOT, 'src')), ...sourceFiles(path.join(ROOT, 'components')), ...sourceFiles(path.join(ROOT, 'services'))].filter(f => fs.existsSync(f));

  it('no fetch method option comes from i18n', () => {
    const offenders: string[] = [];
    for (const file of files) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/\bmethod\s*:\s*(?:uiI18n|i18n|t)\s*\(/.test(line)) offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('account, medication and supplement deletes use DELETE', () => {
    const expectations: Array<[string, RegExp]> = [
      ['src/services/authService.js', /\/api\/account',\s*\{\s*method:\s*'DELETE'/],
      ['components/Medications.js', /method:\s*'DELETE'/],
      ['components/Supplements.js', /method:\s*'DELETE'/],
    ];
    for (const [file, pattern] of expectations) {
      expect(fs.readFileSync(path.join(ROOT, file), 'utf8')).toMatch(pattern);
    }
  });

  it('the Spanish translation of ai.delete is a UI label, not a verb we may send', () => {
    const es = require('../../i18n/es.json');
    expect(es.ai.delete).not.toBe('DELETE');
  });
});
