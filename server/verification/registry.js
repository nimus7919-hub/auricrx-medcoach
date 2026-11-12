const { lookupSepCedula } = require('./sepCedula');
const { lookupNpi } = require('./npiRegistry');
const { isMockVerificationAllowed, lookupMock } = require('./mockRegistry');

async function lookupRegistry(request, opts = {}) {
  const env = opts.env || process.env;
  if (isMockVerificationAllowed(env)) {
    return lookupMock(request);
  }
  if (request.country === 'US') {
    return lookupNpi(request, opts);
  }
  return lookupSepCedula(request, opts);
}

function addMonthsIso(fromIso, months) {
  const d = new Date(fromIso);
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out.toISOString();
}

function computeExpiryFromVerifiedAt(verifiedAt) {
  return addMonthsIso(verifiedAt, 12);
}

function isExpired(profile, now = new Date()) {
  if (!profile) return true;
  if (profile.verificationStatus === 'expired') return true;
  if (profile.verificationStatus !== 'verified') return false;
  if (!profile.expiresAt) return false;
  const exp = new Date(profile.expiresAt).getTime();
  if (Number.isNaN(exp)) return false;
  return exp <= now.getTime();
}

function isDueForRecheck(profile, withinDays = 30, now = new Date()) {
  if (!profile || profile.verificationStatus !== 'verified' || !profile.expiresAt) return false;
  const exp = new Date(profile.expiresAt).getTime();
  if (Number.isNaN(exp)) return false;
  return exp - now.getTime() <= withinDays * 24 * 60 * 60 * 1000;
}

module.exports = {
  lookupRegistry,
  computeExpiryFromVerifiedAt,
  isExpired,
  isDueForRecheck,
  isMockVerificationAllowed,
};
