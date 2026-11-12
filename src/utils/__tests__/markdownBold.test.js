/** Mirrors MarkdownText.parseBoldSegments without importing RN. */
function parseBoldSegments(text) {
  if (!text) return [{ text: '', bold: false }];
  const segments = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last).replace(/\*\*/g, ''), bold: false });
  }
  if (!segments.length) segments.push({ text: '', bold: false });
  return segments;
}

describe('Alfred markdown bold parsing', () => {
  it('renders bold segments and strips leftover markers', () => {
    expect(parseBoldSegments('Hola **mundo** listo')).toEqual([
      { text: 'Hola ', bold: false },
      { text: 'mundo', bold: true },
      { text: ' listo', bold: false },
    ]);
    expect(parseBoldSegments('texto **sin cierre')).toEqual([
      { text: 'texto sin cierre', bold: false },
    ]);
  });
});
