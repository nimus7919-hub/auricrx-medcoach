const { getDefaultSearchCoords, MEXICO_CITY, NEW_YORK_CITY } = require('../locationDefaults');

describe('locationDefaults', () => {
  it('defaults to Mexico City for MX and unknown regions', () => {
    expect(getDefaultSearchCoords('MX')).toEqual(MEXICO_CITY);
    expect(getDefaultSearchCoords(undefined)).toEqual(MEXICO_CITY);
    expect(getDefaultSearchCoords('CA')).toEqual(MEXICO_CITY);
  });

  it('uses a US city only when region is US', () => {
    expect(getDefaultSearchCoords('US')).toEqual(NEW_YORK_CITY);
  });
});
