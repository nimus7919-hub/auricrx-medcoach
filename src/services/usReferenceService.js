import uiI18n from '../i18n';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE } from '../config/api';
import { getRegion } from './region';
export async function usReference(kind, params, signal) {
  if (getRegion() !== 'US') throw new Error('US_REGION_REQUIRED');
  const response = await authenticatedFetch(`${API_BASE}/api/us/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal });
  if (!response.ok) throw new Error(uiI18n.t(response.status === 400 ? 'usRef.errors.badRequest' : 'usRef.errors.unavailable'));
  return response.json();
}
export const costPlusSearchUrl = name => `https://costplusdrugs.com/medications/?query=${encodeURIComponent(name || '')}`;
