import fs from 'fs';
import path from 'path';
import { THIRD_PARTY_ART_CREDITS } from '../../legal/thirdPartyArtCredits';

const ROOT = path.resolve(__dirname, '../../..');
const notices = fs.readFileSync(path.join(ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');

describe('third-party art credits', () => {
  it('matches THIRD_PARTY_NOTICES.md (title, author, license and source for each entry)', () => {
    for (const c of THIRD_PARTY_ART_CREDITS) {
      expect(notices).toContain(c.title);
      expect(notices).toContain(c.author);
      expect(notices).toContain(c.license);
      expect(notices).toContain(c.sourceUrl);
      if (c.licenseUrl) expect(notices).toContain(c.licenseUrl);
    }
  });

  it('credits every body map layer and uses unique ids', () => {
    const layers = new Set(THIRD_PARTY_ART_CREDITS.flatMap((c) => c.layers));
    expect([...layers].sort()).toEqual(['bones', 'muscles', 'organs', 'skin', 'vessels']);
    expect(new Set(THIRD_PARTY_ART_CREDITS.map((c) => c.id)).size).toBe(THIRD_PARTY_ART_CREDITS.length);
    for (const c of THIRD_PARTY_ART_CREDITS) expect(c.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  });

  it('keeps credit text off the body map and intake screens', () => {
    const dirs = ['src/components/bodyMap', 'src/screens/preVisitIntake'];
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) {
          if (f.name !== 'art') walk(p);
        } else if (/\.(tsx?|jsx?)$/.test(f.name)) files.push(p);
      }
    };
    dirs.forEach((d) => walk(path.join(ROOT, d)));
    const banned = [/OpenStax/, /LadyofHats/, /MothsART/, /CC BY-SA/, /Wikimedia/, /openSourceLicenses\./, /thirdPartyArtCredits/];
    for (const f of files) {
      // Comments may cite sources; only code and UI strings must stay credit-free.
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const re of banned) expect({ file: path.relative(ROOT, f), hit: re.test(src) }).toEqual({ file: path.relative(ROOT, f), hit: false });
    }
  });
});
