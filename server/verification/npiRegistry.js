const { compareNames, joinNameParts } = require('./nameMatch');
const { isPhysicianTaxonomyCode, isPhysicianTaxonomyDesc } = require('./medicalTitles');
const { stateBoardLookupUrl } = require('./stateBoardLinks');

const NPI_REGISTRY_API = 'https://npiregistry.cms.hhs.gov/api/';

function providerFullName(basic) {
  return joinNameParts(basic?.first_name, basic?.middle_name, basic?.last_name);
}

function toRecord(result) {
  const tax = Array.isArray(result?.taxonomies) ? result.taxonomies : [];
  const primary = tax.find((t) => t?.primary === true || t?.primary === 'Y') || tax[0] || {};
  return {
    registryId: String(result?.number || ''),
    fullName: providerFullName(result?.basic || {}),
    givenName: String(result?.basic?.first_name || ''),
    familyName: String(result?.basic?.last_name || ''),
    title: String(primary?.desc || result?.basic?.credential || ''),
    taxonomyCode: String(primary?.code || ''),
    taxonomyDesc: String(primary?.desc || ''),
    licenseNumber: String(primary?.license || ''),
    licenseState: String(primary?.state || ''),
    raw: result,
  };
}

function hasPhysicianTaxonomy(result) {
  const tax = Array.isArray(result?.taxonomies) ? result.taxonomies : [];
  return tax.some(
    (t) => isPhysicianTaxonomyCode(String(t?.code || '')) || isPhysicianTaxonomyDesc(String(t?.desc || ''))
  );
}

async function lookupNpi(request, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const timeoutMs = opts.timeoutMs || 12_000;
  const checkedAt = new Date().toISOString();
  const npi = String(request.npiNumber || '').replace(/\D/g, '');
  const referenceId = `npi_${Date.now()}_${npi.slice(0, 12) || 'x'}`;
  const boardUrl = stateBoardLookupUrl(request.licenseState);

  if (!/^\d{10}$/.test(npi)) {
    return {
      provider: 'npi-registry',
      country: 'US',
      outcome: 'not_found',
      checkedAt,
      referenceId,
      message: 'NPI must be a 10-digit number',
      records: [],
      stateBoardLookupUrl: boardUrl,
    };
  }

  const url = `${NPI_REGISTRY_API}?version=2.1&number=${encodeURIComponent(npi)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        provider: 'npi-registry',
        country: 'US',
        outcome: 'lookup_unavailable',
        checkedAt,
        referenceId,
        message: `NPI Registry HTTP ${res.status}`,
        records: [],
        stateBoardLookupUrl: boardUrl,
        raw: text.slice(0, 2000),
      };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        provider: 'npi-registry',
        country: 'US',
        outcome: 'lookup_unavailable',
        checkedAt,
        referenceId,
        message: 'NPI Registry response was not JSON',
        records: [],
        stateBoardLookupUrl: boardUrl,
        raw: text.slice(0, 2000),
      };
    }

    const results = Array.isArray(parsed?.results) ? parsed.results : [];
    if (!results.length) {
      return {
        provider: 'npi-registry',
        country: 'US',
        outcome: 'not_found',
        checkedAt,
        referenceId,
        message: 'No NPI Registry record',
        records: [],
        stateBoardLookupUrl: boardUrl,
        raw: parsed,
      };
    }

    const row = results[0];
    const record = toRecord(row);
    const isIndividual = String(row?.enumeration_type || '') === 'NPI-1';
    const nameMatch = compareNames(request.legalFullName, record.fullName || '');
    const medicalTitleOk = isIndividual && hasPhysicianTaxonomy(row);

    let outcome = 'match';
    if (!isIndividual || !medicalTitleOk) outcome = 'non_medical';
    else if (!nameMatch.matched) outcome = 'mismatch';

    const licenseNote =
      request.licenseNumber || request.licenseState
        ? ` Submitted license ${request.licenseNumber || '—'} (${request.licenseState || '—'}).`
        : '';

    return {
      provider: 'npi-registry',
      country: 'US',
      outcome,
      checkedAt,
      referenceId,
      message: `NPI outcome=${outcome}.${licenseNote} Queued for human review.`,
      nameMatch,
      medicalTitleOk,
      specialtyTitleOk: null,
      records: [record],
      stateBoardLookupUrl: boardUrl,
      raw: parsed,
    };
  } catch (err) {
    return {
      provider: 'npi-registry',
      country: 'US',
      outcome: 'lookup_unavailable',
      checkedAt,
      referenceId,
      message: err?.name === 'AbortError' ? 'NPI lookup timed out' : err?.message || 'NPI lookup failed',
      records: [],
      stateBoardLookupUrl: boardUrl,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { lookupNpi, NPI_REGISTRY_API, toRecord };
