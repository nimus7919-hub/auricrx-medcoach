// Standalone vector artwork; no fonts or app assets are required.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let Resvg;
try { ({ Resvg } = require('@resvg/resvg-js')); } catch {}

const edge = (y, x1, y1, x2, y2) => x1 + (y - y1) * (x2 - x1) / (y2 - y1);
// These same vertices define the inner contour in the A path below.
const counter = { apex: [235, 350], left: [120, 780], right: [370, 780] };
const previews = [];
function letterA(scale, tx, ty, outputScale = 1, outputOffset = [0, 0]) {
  const y = 590;
  const left = v => edge(v, ...counter.apex, ...counter.left);
  const right = v => edge(v, ...counter.apex, ...counter.right);
  const width = (right(y) - left(y)) * scale * 0.58;
  const h = width / 2.6;
  const cy = y * scale + ty;
  const center = (left(y) + right(y)) / 2 * scale + tx;
  const x = center - width / 2;
  const end = center + width / 2;
  const top = y - h / scale / 2;
  const minimumClearance = Math.min(
    x - (left(top) * scale + tx),
    right(top) * scale + tx - end
  ) * outputScale;
  assert(minimumClearance >= 14);
  previews.push({
    cy: cy * outputScale + outputOffset[1],
    left: (left(y) * scale + tx) * outputScale + outputOffset[0],
    right: (right(y) * scale + tx) * outputScale + outputOffset[0],
    x: x * outputScale + outputOffset[0],
    end: end * outputScale + outputOffset[0],
  });
  console.log(JSON.stringify({ pillWidth: width * outputScale, pillHeight: h * outputScale, minimumClearance }));
  return `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="url(#gold)" stroke="url(#edge)" stroke-width="0.7">
    <path d="M260 190 L475 780 Q480 794 506 797 L506 807 L344 807 L344 797 Q381 794 ${counter.right.join(" ")} L${counter.apex.join(" ")} L${counter.left.join(" ")} Q114 794 150 797 L150 807 L37 807 L37 797 Q62 794 65 780 Z"/>
  </g>
  <rect x="${x}" y="${cy-h/2}" width="${end-x}" height="${h}" rx="${h/2}" fill="url(#pillGold)"/>
  <clipPath id="pillClip"><rect x="${x}" y="${cy-h/2}" width="${end-x}" height="${h}" rx="${h/2}"/></clipPath>
  <g clip-path="url(#pillClip)">
    <rect x="${(x+end)/2}" y="${cy-h/2}" width="${(end-x)/2}" height="${h}" fill="url(#pillWhite)"/>
    <path d="M${x+h/2} ${cy-h*.29} H${end-h/2}" stroke="#fff8d9" stroke-opacity=".7" stroke-width="1.4"/>
  </g>`;
}

const defs = `<defs>
  <radialGradient id="bg"><stop stop-color="#20365A"/><stop offset=".58" stop-color="#102447"/><stop offset="1" stop-color="#0B1B3F"/></radialGradient>
  <radialGradient id="glow" cx="48%" cy="30%" r="58%"><stop stop-color="#D7A74B" stop-opacity=".16"/><stop offset="1" stop-color="#D7A74B" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2=".85" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="#B37A25"/><stop offset=".18" stop-color="#FFE7A3"/><stop offset=".36" stop-color="#D9A443"/><stop offset=".49" stop-color="#FFF0BC"/><stop offset=".56" stop-color="#E8BC64"/><stop offset=".8" stop-color="#A66B20"/><stop offset="1" stop-color="#F3CF80"/>
  </linearGradient>
  <linearGradient id="edge"><stop stop-color="#FFF0BA"/><stop offset="1" stop-color="#AA742C"/></linearGradient>
  <linearGradient id="pillGold" x2="0" y2="1"><stop stop-color="#FFF1B3"/><stop offset=".35" stop-color="#F7CF65"/><stop offset=".7" stop-color="#D6A032"/><stop offset="1" stop-color="#AB7421"/></linearGradient>
  <linearGradient id="pillWhite" x2="0" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".4" stop-color="#FFFDF4"/><stop offset="1" stop-color="#C8CBD0"/></linearGradient>
</defs>`;

for (const variant of ['a', 'ar']) {
  const a = variant === 'a' ? letterA(1.12, 208, -42) : letterA(.86, 95, 70, .82, [512 - 513 * .82, 512 - 499 * .82]);
  const r = variant === 'ar' ? `<path transform="translate(0 47)" fill="url(#gold)" stroke="url(#edge)" stroke-width=".6" d="M535 233 H707 C828 233 859 294 859 362 C859 434 815 476 750 489 C787 511 806 560 831 614 L859 675 Q873 702 900 706 V717 H810 C789 694 776 663 755 614 L714 527 Q697 493 663 493 H648 V681 Q648 704 689 706 V717 H535 V706 Q570 704 570 681 V269 Q570 246 535 244 Z M648 251 V474 H683 C750 474 777 437 777 365 C777 293 755 251 696 251 Z"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="title"><title id="title">AuricRX ${variant.toUpperCase()} gold capsule monogram</title>${defs}<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/><circle cx="512" cy="512" r="458" fill="none" stroke="url(#gold)" stroke-width="2"/>${variant === 'ar' ? `<g transform="translate(512 512) scale(.82) translate(-513 -499)">${a}${r}</g>` : a}</svg>`;
  fs.writeFileSync(path.join(__dirname, `icon-${variant}.svg`), svg);
  if (!Resvg) {
    // Windows fallback: render the exact SVG in installed Chrome, then
    // downsample with Pillow. Temp browser data stays outside the project.
    const os = require('node:os');
    const { execFileSync } = require('node:child_process');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'auric-icons-'));
    const html = path.join(temp, 'preview.html');
    fs.writeFileSync(html, `<style>html,body{margin:0;width:1024px;height:1024px;overflow:hidden}</style>${svg}`);
    const output = path.join(__dirname, `icon-${variant}.png`);
    execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${path.join(temp, 'profile')}`, '--window-size=1024,1024', `--screenshot=${output}`, require('node:url').pathToFileURL(html).href], { stdio: 'ignore', timeout: 60000 });
    execFileSync('python', ['-c', 'from PIL import Image; import sys; im=Image.open(sys.argv[1]); assert im.size==(1024,1024); im.resize((192,192),Image.Resampling.LANCZOS).save(sys.argv[2])', output, path.join(__dirname, `icon-${variant}-192.png`)]);
    continue;
  }
  for (const size of [1024, 192]) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
    fs.writeFileSync(path.join(__dirname, `icon-${variant}${size === 192 ? '-192' : ''}.png`), png);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
}

// Verify the actual raster, including antialiasing, rather than geometry alone.
require('node:child_process').execFileSync('python', ['-c', `
import json, math, sys
from PIL import Image
from pathlib import Path
for variant, pill in zip(('a', 'ar'), json.loads(sys.argv[2])):
    im = Image.open(Path(sys.argv[1]) / ('icon-' + variant + '.png')).convert('RGB')
    row = round(pill['cy'])
    gaps = []
    for start, end in ((pill['left'] + 2, pill['x'] - 2), (pill['end'] + 2, pill['right'] - 2)):
        samples = [im.getpixel((x, row)) for x in range(math.ceil(start), math.floor(end) + 1)]
        assert len(samples) >= 14, (variant, 'gap too small', len(samples))
        assert all(b > r and b > g for r, g, b in samples), (variant, 'non-navy gap')
        gaps.append(len(samples))
    for x in (round(pill['x'] + 3), round(pill['end'] - 3)):
        r, g, b = im.getpixel((x, row))
        assert r > b, (variant, 'missing capsule')
    if variant == 'ar':
        # Ring inner edge is r=457; require at least 27 px of navy margin.
        for y in range(1024):
            for x in range(1024):
                radius = math.hypot(x - 512, y - 512)
                if 430 <= radius <= 454:
                    r, g, b = im.getpixel((x, y))
                    assert b > r and b > g, ('AR enters ring margin', x, y)
    print(f'{variant}: row {row}, navy gap samples left/right={gaps}; raster checks passed')
`, __dirname, JSON.stringify(previews)], { stdio: 'inherit' });
