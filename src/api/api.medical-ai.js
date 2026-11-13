import { authenticatedFetch } from '../services/authenticatedFetch';
import uiI18n from "../i18n";
// src/api/api.medical-ai.js
import { API_BASE } from "../config/api";
import { createUserFacingError, ERROR_CATEGORY, logTechnicalError } from '../utils/userFacingError';

export async function askMedicalAI(message, character = 'alfred') {
  // Optional debug to verify the URL used by the app
  console.log("API_BASE:", API_BASE);

  const res = await authenticatedFetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, character, language: uiI18n.resolvedLanguage || uiI18n.language }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logTechnicalError('askMedicalAI', { status: res.status, body: text.slice(0, 300) });
    if (res.status === 401 || res.status === 403) {
      throw createUserFacingError(ERROR_CATEGORY.SESSION_EXPIRED, { status: res.status });
    }
    throw createUserFacingError(ERROR_CATEGORY.SERVER_UNAVAILABLE, { status: res.status });
  }

  const data = await res.json();
  if (!data.ok) {
    logTechnicalError('askMedicalAI/api', data);
    throw createUserFacingError(ERROR_CATEGORY.GENERIC, data.error);
  }
  return data.reply;
}
