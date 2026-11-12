// Locale language tags (especially en-US) describe language, not physical location.
const MEXICO_ZONES = new Set([
  'America/Mexico_City', 'America/Cancun', 'America/Merida', 'America/Monterrey',
  'America/Matamoros', 'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Ojinaga',
  'America/Mazatlan', 'America/Hermosillo', 'America/Bahia_Banderas', 'America/Tijuana',
  'America/Ensenada', 'America/Santa_Isabel', 'Mexico/General', 'Mexico/BajaNorte', 'Mexico/BajaSur',
]);
const US_ZONES = new Set([
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Detroit', 'America/Anchorage', 'America/Juneau',
  'America/Boise', 'America/Adak', 'America/Nome', 'America/Sitka', 'America/Metlakatla',
  'America/Yakutat', 'Pacific/Honolulu',
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'US/Arizona',
  'US/Alaska', 'US/Aleutian', 'US/Hawaii', 'US/East-Indiana', 'US/Indiana-Starke', 'US/Michigan',
]);

function detectRegion({ locales = [], calendars = [], timeZone, savedRegion } = {}) {
  if (savedRegion === 'MX' || savedRegion === 'US') return savedRegion;
  // Timezone reflects physical location better than locale regionCode (en-US on a Mexico City phone).
  const zone = calendars?.[0]?.timeZone || timeZone;
  if (MEXICO_ZONES.has(zone)) return 'MX';
  if (US_ZONES.has(zone) || /^America\/(Indiana|Kentucky|North_Dakota)\//.test(zone || '')) return 'US';
  const country = locales?.[0]?.regionCode?.toUpperCase();
  if (country === 'MX' || country === 'US') return country;
  // Spanish and all ambiguous/missing signals default to Mexico.
  return 'MX';
}

module.exports = { detectRegion };
