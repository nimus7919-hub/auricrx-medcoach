import uiI18n from "../i18n";
import { API_BASE } from '../config/api';
import { premiumTheme } from '../theme/colors';

export const BACKEND_URL = `${API_BASE}/ask`;

export const API_BASE_URL = API_BASE;

export const STRINGS = { get en() { return uiI18n.t("localized.appConstants.STRINGS", { lng: 'en', returnObjects: true }); }, get es() { return uiI18n.t("localized.appConstants.STRINGS", { lng: 'es', returnObjects: true }); }, get zh() { return uiI18n.t("localized.appConstants.STRINGS", { lng: 'zh', returnObjects: true }); } };

export const PALETTES = Object.fromEntries(['whiteGold', 'gold', 'blue', 'teal', 'black'].map(id => [id, { ...premiumTheme(!['whiteGold', 'gold'].includes(id)), id }]));

export const STORAGE = {
  lang: 'AURIC_LANG',
  theme: 'AURIC_THEME',
  night: 'AURIC_NIGHT',
  mood: 'AURIC_MOOD',
  reminders: 'AURIC_REMINDERS',
  reminderTombstones: 'AURIC_REMINDER_TOMBSTONES',
  rxPhotos: 'AURIC_RX_PHOTOS',
  voiceNotes: 'AURIC_VOICE_NOTES',
  meds: 'AURIC_MEDS',
  selectedAIDoctor: 'AURIC_SELECTED_AI_DOCTOR',
};
