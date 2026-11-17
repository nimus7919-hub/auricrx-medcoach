const { compareNames } = require('./nameMatch');

/**
 * Mock registry for local/dev tests only.
 * Impossible when NODE_ENV is production/prod — even if DOCTOR_ALLOW_MOCK_VERIFICATION=true.
 * NEVER returns an auto-approve signal; callers always queue pending_review.
 */
function isMockVerificationAllowed(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') return false;
  return String(env.DOCTOR_ALLOW_MOCK_VERIFICATION || '') === 'true';
}

async function lookupMock(request) {
  const id = String(request.cedulaNumber || request.npiNumber || '')
    .trim()
    .toUpperCase();
  const checkedAt = new Date().toISOString();
  const referenceId = `mock_${Date.now()}_${id.slice(0, 8) || 'empty'}`;
  const country = request.country || 'MX';

  if (!id || id.length < 4) {
    return {
      provider: 'mock-cedula',
      country,
      outcome: 'not_found',
      checkedAt,
      referenceId,
      message: 'Mock: id too short',
      records: [],
    };
  }
  if (id.includes('UNAVAIL')) {
    return {
      provider: 'mock-cedula',
      country,
      outcome: 'lookup_unavailable',
      checkedAt,
      referenceId,
      message: 'Mock: lookup unavailable',
      records: [],
    };
  }
  const registryName = id.includes('FAIL') ? 'Other Person' : request.legalFullName;
  const nameMatch = compareNames(request.legalFullName, registryName);
  const outcome = id.includes('FAIL') ? 'mismatch' : nameMatch.matched ? 'match' : 'mismatch';
  return {
    provider: 'mock-cedula',
    country,
    outcome,
    checkedAt,
    referenceId,
    message: `Mock outcome=${outcome}; never auto-approved`,
    nameMatch,
    medicalTitleOk: !id.includes('FAIL'),
    specialtyTitleOk: null,
    records: [{ registryId: id, fullName: registryName, title: 'Médico Cirujano' }],
    raw: { mock: true, autoApprove: false },
  };
}

module.exports = { isMockVerificationAllowed, lookupMock };
