/**
 * Accent- and case-insensitive full-name matching.
 * Every token in the submitted legal name must appear in the registry name
 * (and vice-versa for strict mode), so partial surname-only matches fail.
 */

const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function normalizeNamePart(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function nameTokens(value: string): string[] {
  const normalized = normalizeNamePart(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function joinNameParts(...parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Returns true when every token from `submitted` appears in `registry`
 * and every token from `registry` appears in `submitted`.
 * Order-independent; accents/case ignored.
 */
export function namesMatchStrict(submitted: string, registry: string): boolean {
  const a = new Set(nameTokens(submitted));
  const b = new Set(nameTokens(registry));
  if (a.size === 0 || b.size === 0) return false;
  if (a.size !== b.size) return false;
  for (const token of a) {
    if (!b.has(token)) return false;
  }
  return true;
}

export interface NameMatchResult {
  matched: boolean;
  submittedNormalized: string;
  registryNormalized: string;
  missingFromRegistry: string[];
  extraInRegistry: string[];
}

export function compareNames(submitted: string, registry: string): NameMatchResult {
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
