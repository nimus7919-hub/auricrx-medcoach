// A single separator followed by three digits is treated as thousands grouping.
function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  let text = value.trim().replace(/^(?:MXN|USD|EUR|MX\$|US\$|[$??])\s*/i, '')
    .replace(/\s*(?:MXN|USD|EUR|[$??])$/i, '').trim();
  if (!text || !/^[0-9][0-9.,\s]*$/.test(text)) return null;
  text = text.replace(/\s+/g, '');
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.';
    const grouping = decimal === ',' ? '.' : ',';
    const parts = text.split(decimal);
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[1])) return null;
    const groups = parts[0].split(grouping);
    if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(group => !/^\d{3}$/.test(group))) return null;
    text = groups.join('') + '.' + parts[1];
  } else if (comma >= 0 || dot >= 0) {
    const parts = text.split(comma >= 0 ? ',' : '.');
    if (parts.length === 2 && /^\d{1,2}$/.test(parts[1])) {
      text = parts[0] + '.' + parts[1];
    } else if (/^\d{1,3}$/.test(parts[0]) && parts.slice(1).every(group => /^\d{3}$/.test(group))) {
      text = parts.join('');
    } else return null;
  }
  const price = Number(text);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

module.exports = { parsePrice };
