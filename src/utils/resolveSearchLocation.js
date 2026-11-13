/**
 * Decide whether a nearby pharmacy/lab search may run.
 * Never invents a default city — permission must be granted and coords present.
 */
function resolveSearchLocation({ permissionStatus, coords, positionError } = {}) {
  if (permissionStatus !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }
  if (positionError) {
    return { ok: false, reason: 'unavailable' };
  }
  if (
    !coords ||
    typeof coords.latitude !== 'number' ||
    typeof coords.longitude !== 'number' ||
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude)
  ) {
    return { ok: false, reason: 'unavailable' };
  }
  // Reject the old 0,0 placeholder / null-island fallback.
  if (coords.latitude === 0 && coords.longitude === 0) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, coords: { latitude: coords.latitude, longitude: coords.longitude } };
}

module.exports = { resolveSearchLocation };
