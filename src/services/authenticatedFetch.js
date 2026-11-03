import uiI18n from "../i18n";
import { auth } from '../config/firebase';

export async function authenticatedFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error(uiI18n.t("ui.notAuthenticated"));
  const token = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}
