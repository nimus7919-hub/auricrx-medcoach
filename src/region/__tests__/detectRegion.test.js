const { detectRegion } = require('../detectRegion');

describe('detectRegion', () => {
  it('honors an explicit saved region', () => {
    expect(detectRegion({
      locales: [{ regionCode: 'US' }],
      timeZone: 'America/Mexico_City',
      savedRegion: 'MX',
    })).toBe('MX');
  });

  it('prefers timezone over en-US locale regionCode so Mexico City devices stay MX', () => {
    expect(detectRegion({
      locales: [{ regionCode: 'US' }],
      calendars: [{ timeZone: 'America/Mexico_City' }],
    })).toBe('MX');
  });

  it('detects US from US timezones', () => {
    expect(detectRegion({
      locales: [{ regionCode: 'MX' }],
      calendars: [{ timeZone: 'America/New_York' }],
    })).toBe('US');
  });

  it('defaults ambiguous signals to Mexico, but still honors US regionCode when timezone is non-US/MX', () => {
    expect(detectRegion({ locales: [], calendars: [] })).toBe('MX');
    expect(detectRegion({ locales: [{ regionCode: 'FR' }], timeZone: 'Europe/Madrid' })).toBe('MX');
    expect(detectRegion({ locales: [{ regionCode: 'US' }], timeZone: 'Europe/Madrid' })).toBe('US');
  });
});

