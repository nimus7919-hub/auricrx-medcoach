import { API_BASE } from '../config/api';
import { authenticatedFetch } from './authenticatedFetch';

export function contributeMedication(name, components, selectedName) {
  if (!name?.trim() || name === selectedName) return;
  void authenticatedFetch(`${API_BASE}/api/meds`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), components: components || [] }),
  }).catch(() => {});
}

export function medicationFields(med) {
  const components = med.components.length ? med.components.map(c =>
    typeof c === 'string' ? { name: c, strength: '', unit: 'Mg' } :
    { name: '', strength: '', unit: 'Mg', ...c }) : [{ name: '', strength: '', unit: 'Mg' }];
  return { components, isSingleComponent: components.length <= 1, selectedMedicationName: med.name };
}
