/**
 * US NPI Registry (CMS NPPES) lookup — public API, no key required.
 * https://npiregistry.cms.hhs.gov/api/?version=2.1
 *
 * Checks: individual (NPI-1), name match, physician taxonomy.
 * State license number + state are captured for manual board verification
 * (NPPES does not validate licensure).
 */

import { compareNames, joinNameParts } from './nameMatch';
import { isPhysicianTaxonomyCode, isPhysicianTaxonomyDesc } from './medicalTitles';
import { stateBoardLookupUrl } from './stateBoardLinks';
import type {
  RegistryLookupProvider,
  RegistryLookupRequest,
  RegistryLookupResult,
  RegistryRecord,
} from './RegistryLookup';
import type { FetchLike } from './SepCedulaProvider';

export const NPI_REGISTRY_API = 'https://npiregistry.cms.hhs.gov/api/';

function refId(npi: string): string {
  return `npi_${Date.now()}_${String(npi || 'x').slice(0, 12)}`;
}

function providerFullName(basic: any): string {
  return joinNameParts(basic?.first_name, basic?.middle_name, basic?.last_name);
}

function toRecord(result: any): RegistryRecord {
  const tax = Array.isArray(result?.taxonomies) ? result.taxonomies : [];
  const primary = tax.find((t: any) => t?.primary === true || t?.primary === 'Y') || tax[0] || {};
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

function hasPhysicianTaxonomy(result: any): boolean {
  const tax = Array.isArray(result?.taxonomies) ? result.taxonomies : [];
  return tax.some(
    (t: any) => isPhysicianTaxonomyCode(String(t?.code || '')) || isPhysicianTaxonomyDesc(String(t?.desc || ''))
  );
}

export class NpiRegistryProvider implements RegistryLookupProvider {
  readonly name = 'npi-registry';
  readonly country = 'US' as const;

  constructor(
    private readonly fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
    private readonly timeoutMs = 12_000
  ) {}

  async lookup(request: RegistryLookupRequest): Promise<RegistryLookupResult> {
    const checkedAt = new Date().toISOString();
    const npi = String(request.npiNumber || '').replace(/\D/g, '');
    const referenceId = refId(npi);
    const boardUrl = stateBoardLookupUrl(request.licenseState);

    if (!/^\d{10}$/.test(npi)) {
      return {
        provider: this.name,
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
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        return {
          provider: this.name,
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
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          provider: this.name,
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
          provider: this.name,
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

      let outcome: RegistryLookupResult['outcome'] = 'match';
      if (!isIndividual) outcome = 'non_medical';
      else if (!medicalTitleOk) outcome = 'non_medical';
      else if (!nameMatch.matched) outcome = 'mismatch';

      // License fields are for manual board verification — mismatch does not auto-reject.
      const licenseNote =
        request.licenseNumber || request.licenseState
          ? ` Submitted license ${request.licenseNumber || '—'} (${request.licenseState || '—'}).`
          : '';

      return {
        provider: this.name,
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
    } catch (err: any) {
      return {
        provider: this.name,
        country: 'US',
        outcome: 'lookup_unavailable',
        checkedAt,
        referenceId,
        message: err?.name === 'AbortError' ? 'NPI lookup timed out' : err?.message || 'NPI lookup failed',
        records: [],
        stateBoardLookupUrl: boardUrl,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
