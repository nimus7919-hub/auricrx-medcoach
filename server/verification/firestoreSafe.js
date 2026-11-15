/**
 * Firestore rejects documents that contain `undefined`. Registry lookups can
 * time out or throw and leave optional fields like `raw` unset. Convert those
 * values to null (or omit them) before any evidence write.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && (value.constructor === Object || Object.getPrototypeOf(value) === Object.prototype);
}

/**
 * Recursively replace `undefined` with `null` (and walk arrays/plain objects).
 * Dates, buffers, and other non-plain objects are left as-is.
 */
function sanitizeForFirestore(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeForFirestore);
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = sanitizeForFirestore(child);
    }
    return out;
  }
  return value;
}

/** True if any nested value is still `undefined` (used in tests). */
function hasUndefined(value, seen = new Set()) {
  if (value === undefined) return true;
  if (value === null || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => hasUndefined(item, seen));
  if (!isPlainObject(value)) return false;
  return Object.values(value).some((child) => hasUndefined(child, seen));
}

module.exports = { sanitizeForFirestore, hasUndefined };
