import uiI18n from "../i18n";
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
  const source = Array.isArray(med.components) ? med.components : [];
  const components = source.length ? source.map(c =>
    typeof c === 'string' ? componentFields(c) :
    { name: '', strength: '', unit: uiI18n.t("reminders.units.mg"), ...c }) : [{ name: '', strength: '', unit: uiI18n.t("reminders.units.mg") }];
  return { components, isSingleComponent: components.length <= 1, selectedMedicationName: med.name };
}

function componentFields(value) {
  const match = /^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|g|UI|IU|%)(\/.*)?$/i.exec(value.trim());
  // Concentrations remain intact in the name: the form has no denominator field.
  if (!match || match[4]) return { name: value, strength: '', unit: uiI18n.t("reminders.units.mg") };
  const units = { mg: uiI18n.t("reminders.units.mg"), mcg: uiI18n.t("unitLabels.Mcg"), 'µg': uiI18n.t("unitLabels.Mcg"), g: uiI18n.t("reminders.units.g"), ui: uiI18n.t("unitLabels.IU"), iu: uiI18n.t("unitLabels.IU"), '%': '%' };
  return { name: match[1], strength: match[2], unit: units[match[3].toLowerCase()] };
}
