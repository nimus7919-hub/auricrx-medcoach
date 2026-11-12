/** Default search coordinates when GPS permission is denied or unavailable. */
const MEXICO_CITY = { latitude: 19.4326, longitude: -99.1332 };
const NEW_YORK_CITY = { latitude: 40.7128, longitude: -74.006 };

function getDefaultSearchCoords(region) {
  return region === 'US' ? { ...NEW_YORK_CITY } : { ...MEXICO_CITY };
}

module.exports = {
  MEXICO_CITY,
  NEW_YORK_CITY,
  getDefaultSearchCoords,
};
