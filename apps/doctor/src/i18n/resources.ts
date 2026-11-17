import enCore from '../../../../packages/doctor-core/i18n/en.json';
import esCore from '../../../../packages/doctor-core/i18n/es.json';
import enApp from './en.json';
import esApp from './es.json';

type Tree = { [k: string]: unknown };
const isTree = (v: unknown): v is Tree => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Deep merge (b wins). The doctor app overrides individual keys inside shared doctor-core
 * namespaces (e.g. doctorMode.onboarding.cedula) without replacing the whole namespace.
 */
export function deepMerge(a: Tree, b: Tree): Tree {
  const out: Tree = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = isTree(a[k]) && isTree(b[k]) ? deepMerge(a[k] as Tree, b[k] as Tree) : b[k];
  }
  return out;
}

/** Only Spanish and English ship in the doctor app. */
export const resources = {
  en: { translation: deepMerge(enCore as Tree, enApp as Tree) },
  es: { translation: deepMerge(esCore as Tree, esApp as Tree) },
};
