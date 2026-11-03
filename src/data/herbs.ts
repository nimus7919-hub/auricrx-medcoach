// Compatibility entry retained for existing imports. No separate medical data.
export { HERBS, herbs } from './herbCatalog.js';
export type Herb = (typeof import('./herbCatalog.js').HERBS)[number];
