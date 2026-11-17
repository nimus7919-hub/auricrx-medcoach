/**
 * Identity verification adapters (Truora/MetaMap MX, Persona/Veriff US).
 * Fail-closed when API keys are missing. Never stores raw ID images.
 */

function envHas(...keys) {
  return keys.every((k) => typeof process.env[k] === 'string' && process.env[k].trim().length > 0);
}

function notConfigured(provider, name) {
  return {
    provider,
    status: 'not_configured',
    message: `${name} is not configured (missing API keys). Identity check skipped; manual review required.`,
    checkedAt: new Date().toISOString(),
  };
}

function stubbedWithKeys(provider, name, request) {
  return {
    provider,
    status: 'failed',
    message: `${name} keys are present but the adapter is stubbed — do not treat as passed.`,
    checkedAt: new Date().toISOString(),
    raw: { doctorUid: request.doctorUid, country: request.country },
  };
}

const PROVIDERS = {
  truora: {
    id: 'truora',
    name: 'Truora',
    configured: () => envHas('TRUORA_API_KEY'),
  },
  metamap: {
    id: 'metamap',
    name: 'MetaMap',
    configured: () => envHas('METAMAP_CLIENT_ID', 'METAMAP_CLIENT_SECRET'),
  },
  persona: {
    id: 'persona',
    name: 'Persona',
    configured: () => envHas('PERSONA_API_KEY', 'PERSONA_TEMPLATE_ID'),
  },
  veriff: {
    id: 'veriff',
    name: 'Veriff',
    configured: () => envHas('VERIFF_API_KEY', 'VERIFF_SHARED_SECRET'),
  },
};

function resolveProviderId(country) {
  const forced = String(process.env.DOCTOR_IDENTITY_PROVIDER || '')
    .trim()
    .toLowerCase();
  if (forced && (PROVIDERS[forced] || forced === 'none')) return forced;
  if (country === 'MX') return 'truora';
  if (country === 'US') return 'persona';
  return 'none';
}

async function startIdentityCheck(request) {
  const id = resolveProviderId(request.country);
  if (id === 'none' || !PROVIDERS[id]) {
    return notConfigured('none', 'Identity provider');
  }
  const meta = PROVIDERS[id];
  if (!meta.configured()) return notConfigured(meta.id, meta.name);
  return stubbedWithKeys(meta.id, meta.name, request);
}

module.exports = { startIdentityCheck, resolveProviderId, PROVIDERS };
