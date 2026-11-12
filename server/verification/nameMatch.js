/** Accent- and case-insensitive full-name matching (JS twin of doctor-core). */

const COMBINING_MARKS = /[\u0300-\u036f]/g;

function normalizeNamePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(value) {
  const normalized = normalizeNamePart(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

function joinNameParts(...parts) {
  return parts
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .join(' ');
}

function namesMatchStrict(submitted, registry) {
  const a = new Set(nameTokens(submitted));
  const b = new Set(nameTokens(registry));
  if (a.size === 0 || b.size === 0) return false;
  if (a.size !== b.size) return false;
  for (const token of a) {
    if (!b.has(token)) return false;
  }
  return true;
}

function compareNames(submitted, registry) {
  const submittedTokens = nameTokens(submitted);
  const registryTokens = nameTokens(registry);
  const submittedSet = new Set(submittedTokens);
  const registrySet = new Set(registryTokens);
  const missingFromRegistry = submittedTokens.filter((t) => !registrySet.has(t));
  const extraInRegistry = registryTokens.filter((t) => !submittedSet.has(t));
  return {
    matched: namesMatchStrict(submitted, registry),
    submittedNormalized: submittedTokens.join(' '),
    registryNormalized: registryTokens.join(' '),
    missingFromRegistry: [...new Set(missingFromRegistry)],
    extraInRegistry: [...new Set(extraInRegistry)],
  };
}

module.exports = {
  normalizeNamePart,
  nameTokens,
  joinNameParts,
  namesMatchStrict,
  compareNames,
};
