const { resolveSearchLocation } = require('../resolveSearchLocation');

describe('resolveSearchLocation', () => {
  it('blocks search when permission is denied or location is off', () => {
    expect(resolveSearchLocation({ permissionStatus: 'denied' })).toEqual({
      ok: false,
      reason: 'permission_denied',
    });
    expect(resolveSearchLocation({
      permissionStatus: 'granted',
      positionError: new Error('GPS off'),
    }).ok).toBe(false);
    expect(resolveSearchLocation({
      permissionStatus: 'granted',
      coords: { latitude: 0, longitude: 0 },
    }).ok).toBe(false);
  });

  it('allows search only with granted permission and real coordinates', () => {
    expect(resolveSearchLocation({
      permissionStatus: 'granted',
      coords: { latitude: 19.4326, longitude: -99.1332 },
    })).toEqual({
      ok: true,
      coords: { latitude: 19.4326, longitude: -99.1332 },
    });
  });

  it('does not invent a default city', () => {
    const denied = resolveSearchLocation({ permissionStatus: 'denied' });
    expect(denied.coords).toBeUndefined();
    const missing = resolveSearchLocation({ permissionStatus: 'granted' });
    expect(missing.ok).toBe(false);
    expect(missing.coords).toBeUndefined();
  });
});
