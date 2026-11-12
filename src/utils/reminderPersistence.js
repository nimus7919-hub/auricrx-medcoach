/**
 * Reminder persistence helpers: normalize cloud payloads, merge local/remote,
 * and guard against wiping remote data with an empty local push.
 */

function normalizeRemindersPayload(payload) {
  if (payload == null) return [];
  let value = payload;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && (item.id != null || item.name));
}

/**
 * Merge local and remote reminder lists by id.
 * When local is empty and remote has items, prefer remote (post-logout restore).
 * When both have the same id, prefer the side with a newer updatedAt when present;
 * otherwise prefer remote so cloud restores win after reinstall, then keep unique locals.
 */
function mergeReminders(local = [], remote = []) {
  const localList = normalizeRemindersPayload(local);
  const remoteList = normalizeRemindersPayload(remote);

  if (!localList.length && remoteList.length) return remoteList.slice();
  if (!remoteList.length) return localList.slice();

  const byId = new Map();
  for (const item of localList) {
    byId.set(String(item.id), item);
  }
  for (const item of remoteList) {
    const key = String(item.id);
    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, item);
      continue;
    }
    const localTs = Date.parse(existing.updatedAt || existing.updated_at || 0) || 0;
    const remoteTs = Date.parse(item.updatedAt || item.updated_at || 0) || 0;
    byId.set(key, remoteTs >= localTs ? { ...existing, ...item } : { ...item, ...existing });
  }
  return Array.from(byId.values());
}

/**
 * Never push an empty list until cloud hydration finished, and never overwrite
 * known non-empty remote data with an accidental empty local state.
 * Explicit user clears (hydrated + previously had local data) may push [].
 */
function shouldPushReminders({ cloudReady, reminders, remoteHadData, allowEmptyPush }) {
  if (!cloudReady) return false;
  const list = normalizeRemindersPayload(reminders);
  if (list.length > 0) return true;
  if (allowEmptyPush) return true;
  if (remoteHadData) return false;
  return false;
}

/**
 * Upsert a medication created from a reminder without creating duplicates.
 * Matches by reminderId, id, or case-insensitive name.
 */
function upsertMedicationFromReminder(meds = [], medicationData) {
  if (!medicationData) return Array.isArray(meds) ? meds.slice() : [];
  const prev = Array.isArray(meds) ? meds : [];
  const reminderId = medicationData.reminderId != null ? String(medicationData.reminderId) : null;
  const id = medicationData.id != null ? String(medicationData.id) : null;
  const nameKey = String(medicationData.name || medicationData.medicationName || '')
    .trim()
    .toLowerCase();

  const index = prev.findIndex(med => {
    if (!med) return false;
    if (reminderId && String(med.reminderId) === reminderId) return true;
    if (id && String(med.id) === id) return true;
    if (reminderId && String(med.id) === reminderId) return true;
    if (nameKey && String(med.name || '').trim().toLowerCase() === nameKey) return true;
    return false;
  });

  if (index < 0) return [...prev, medicationData];

  const existing = prev[index];
  const next = prev.slice();
  next[index] = {
    ...existing,
    ...medicationData,
    id: existing.id,
    dbId: existing.dbId || medicationData.dbId,
    reminderId: reminderId || existing.reminderId || medicationData.id,
    fromReminder: true,
  };
  return next;
}

module.exports = {
  normalizeRemindersPayload,
  mergeReminders,
  shouldPushReminders,
  upsertMedicationFromReminder,
};
