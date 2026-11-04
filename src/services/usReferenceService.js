import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE } from '../config/api';
import { getRegion } from './region';
export async function usReference(kind, params, signal) {
  if (getRegion() !== 'US') throw new Error('US_REGION_REQUIRED');
  const response = await authenticatedFetch(`${API_BASE}/api/us/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal });
  if (!response.ok) throw new Error(response.status === 400 ? 'Check your search. Pharmacies require a five-digit ZIP or city and two-letter state. NADAC requires an 11-digit NDC.' : 'Reference source unavailable. Please retry. An unavailable source does not establish anything about a medicine or combination.');
  return response.json();
}
export const costPlusSearchUrl = name => `https://costplusdrugs.com/medications/?query=${encodeURIComponent(name || '')}`;
