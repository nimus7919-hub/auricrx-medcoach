const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const sanitizeLine = (line) => {
  return line
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2022]/g, 'â€¢')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
};

(async () => {
  const [,, inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/md-to-pdf.js <input.md> <output.pdf>');
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const mdLines = raw.split(/\r?\n/).map(sanitizeLine);
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 50;
  const lineHeight = 16;
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = height - margin;

  const addPage = () => {
    page = pdfDoc.addPage([595.28, 841.89]);
    cursorY = height - margin;
  };

  const lineTokens = (text) => text.split(' ').filter(Boolean);

  const writeLine = (text, options = {}) => {
    const { font = fontRegular, size = 11, color = rgb(0, 0, 0), indent = 0 } = options;
    const maxWidth = width - margin * 2 - indent;
    const ensureSpace = () => {
      if (cursorY <= margin + lineHeight) addPage();
    };

    const draw = (lineText) => {
      ensureSpace();
      page.drawText(lineText, { x: margin + indent, y: cursorY, size, font, color });
      cursorY -= lineHeight;
    };

    const words = lineTokens(text);
    if (words.length === 0) {
      draw('');
      return;
    }

    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
        if (line) draw(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) draw(line);
  };

  const spacer = (factor = 1) => {
    if (cursorY <= margin + lineHeight) addPage();
    cursorY -= lineHeight * factor;
  };

  for (const rawLine of mdLines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      spacer(0.5);
      continue;
    }
    if (line.startsWith('---')) {
      spacer(0.2);
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7)
      });
      spacer(0.3);
      continue;
    }
    if (line.startsWith('# ')) {
      spacer(0.3);
      writeLine(line.replace(/^#\s+/, ''), { font: fontBold, size: 18 });
      spacer(0.2);
      continue;
    }
    if (line.startsWith('## ')) {
      spacer(0.2);
      writeLine(line.replace(/^##\s+/, ''), { font: fontBold, size: 14 });
      spacer(0.1);
      continue;
    }
    if (line.startsWith('- ')) {
      writeLine('â€¢ ' + line.slice(2));
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      writeLine(line);
      continue;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      writeLine(line.replace(/^\*\*|\*\*$/g, ''), { font: fontBold });
      continue;
    }
    writeLine(line);
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log('PDF generated at', outputPath, 'pages:', pdfDoc.getPageCount());
})();
