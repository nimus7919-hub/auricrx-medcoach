/**
 * Reminder persistence helpers: normalize cloud payloads, merge local/remote,
 * durable offline deletes (tombstones), and guard against wiping remote data
 * with an empty local push.
 */

const TOMBSTONE_STORAGE_KEY = 'AURIC_REMINDER_TOMBSTONES';

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
 * Normalize a tombstone map: { [id]: { deletedAt: ISO string } }
 */
function normalizeTombstones(raw) {
  if (!raw) return {};
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (Array.isArray(value)) {
    const map = {};
    value.forEach((id) => {
      if (id != null) map[String(id)] = { deletedAt: new Date(0).toISOString() };
    });
    return map;
  }
  if (typeof value !== 'object') return {};
  const map = {};
  Object.keys(value).forEach((id) => {
    const entry = value[id];
    if (entry == null) return;
    if (typeof entry === 'string') {
      map[String(id)] = { deletedAt: entry };
    } else if (typeof entry === 'object') {
      map[String(id)] = {
        deletedAt: entry.deletedAt || entry.deleted_at || new Date().toISOString(),
      };
    }
  });
  return map;
}

function tombstoneIds(tombstones = {}) {
  return new Set(Object.keys(normalizeTombstones(tombstones)));
}

/**
 * Record local deletions so a later pull cannot resurrect them before push.
 */
function addReminderTombstones(existing, ids, deletedAt = new Date().toISOString()) {
  const map = normalizeTombstones(existing);
  (Array.isArray(ids) ? ids : [ids]).forEach((id) => {
    if (id == null) return;
    map[String(id)] = { deletedAt };
  });
  return map;
}

/**
 * After a successful push of `pushedReminders`, drop tombstones for ids that
 * are no longer on the server (absent from the pushed payload). Keep any
 * tombstones for ids that somehow remain in the pushed list (should not happen).
 */
function pruneReminderTombstones(existing, pushedReminders = []) {
  const map = normalizeTombstones(existing);
  const pushedIds = new Set(
    normalizeRemindersPayload(pushedReminders).map((r) => String(r.id))
  );
  const next = {};
  Object.keys(map).forEach((id) => {
    // Keep tombstone only if the id somehow still appears in what we pushed
    // (defensive). Otherwise the server no longer has it — safe to forget.
    if (pushedIds.has(id)) {
      next[id] = map[id];
    }
  });
  return next;
}

/**
 * Merge local and remote reminder lists by id.
 * Tombstoned ids are never re-added from remote.
 * When local is empty and remote has items, prefer remote (post-logout restore),
 * still filtering tombstones.
 */
function mergeReminders(local = [], remote = [], options = {}) {
  const localList = normalizeRemindersPayload(local);
  const remoteList = normalizeRemindersPayload(remote);
  const deleted = tombstoneIds(options.deletedIds || options.tombstones || {});

  const filterDeleted = (list) => list.filter((item) => !deleted.has(String(item.id)));

  const localFiltered = filterDeleted(localList);
  const remoteFiltered = filterDeleted(remoteList);

  if (!localFiltered.length && remoteFiltered.length) return remoteFiltered.slice();
  if (!remoteFiltered.length) return localFiltered.slice();

  const byId = new Map();
  for (const item of localFiltered) {
    byId.set(String(item.id), item);
  }
  for (const item of remoteFiltered) {
    const key = String(item.id);
    if (deleted.has(key)) continue;
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
 * Pending tombstones also allow an empty push so offline deletes reach the server.
 */
function shouldPushReminders({ cloudReady, reminders, remoteHadData, allowEmptyPush, hasPendingDeletes }) {
  if (!cloudReady) return false;
  const list = normalizeRemindersPayload(reminders);
  if (list.length > 0) return true;
  if (allowEmptyPush) return true;
  if (hasPendingDeletes) return true;
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
  TOMBSTONE_STORAGE_KEY,
  normalizeRemindersPayload,
  normalizeTombstones,
  addReminderTombstones,
  pruneReminderTombstones,
  mergeReminders,
  shouldPushReminders,
  upsertMedicationFromReminder,
};
