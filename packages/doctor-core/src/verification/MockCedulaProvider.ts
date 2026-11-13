import type { CedulaVerificationProvider, CedulaVerificationRequest, CedulaVerificationResult } from './CedulaVerificationProvider';
import type { RegistryLookupProvider, RegistryLookupRequest, RegistryLookupResult } from './RegistryLookup';
import { compareNames } from './nameMatch';

/**
 * Dev/test mock registry — NEVER returns verified / auto-approve.
 * Outcomes land as pending_review evidence only.
 *
 * Activation (both required; impossible in production):
 * - NODE_ENV !== 'production' AND NODE_ENV !== 'prod'
 * - DOCTOR_ALLOW_MOCK_VERIFICATION === 'true'
 *
 * Deterministic rules for tests:
 * - empty / too-short id → not_found (submit path may reject)
 * - contains FAIL → mismatch
 * - contains UNAVAIL → lookup_unavailable
 * - otherwise → match (still queued for human review by the server)
 */
export function isMockVerificationAllowed(
  env: NodeJS.ProcessEnv = typeof process !== 'undefined' ? process.env : ({} as NodeJS.ProcessEnv)
): boolean {
  const nodeEnv = String(env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') return false;
  if (env.RENDER_EXTERNAL_URL && String(env.DOCTOR_ALLOW_MOCK_VERIFICATION) !== 'true') {
    // Extra belt: if Render URL is set and flag not explicitly true, deny.
  }
  return String(env.DOCTOR_ALLOW_MOCK_VERIFICATION || '') === 'true';
}

export class MockCedulaProvider implements CedulaVerificationProvider, RegistryLookupProvider {
  readonly name = 'mock-cedula';
  readonly country = 'MX' as const;

  private store = new Map<string, CedulaVerificationResult>();

  /**
   * Legacy interface — no longer auto-verifies.
   * Returns pending_review (or rejected for FAIL/short).
   */
  async submit(request: CedulaVerificationRequest): Promise<CedulaVerificationResult> {
    const normalized = (request.cedulaNumber || '').trim().toUpperCase();
    const referenceId = `mock_${Date.now()}_${normalized.slice(0, 8) || 'empty'}`;
    const checkedAt = new Date().toISOString();

    let status: CedulaVerificationResult['status'] = 'pending_review';
    let message = 'Mock: queued for human review (never auto-approved)';

    if (!normalized || normalized.length < 4) {
      status = 'rejected';
      message = 'Mock: cédula number too short';
    } else if (normalized.includes('FAIL')) {
      status = 'pending_review';
      message = 'Mock: registry mismatch — still queued for human review';
    } else if (normalized.includes('PEND')) {
      status = 'pending_review';
      message = 'Mock: awaiting manual review';
    }

    const result: CedulaVerificationResult = {
      status,
      referenceId,
      message,
      checkedAt,
      raw: { provider: this.name, request, autoApprove: false },
    };
    this.store.set(referenceId, result);
    return result;
  }

  async getStatus(referenceId: string): Promise<CedulaVerificationResult> {
    const existing = this.store.get(referenceId);
    if (existing) return existing;
    return {
      status: 'pending_review',
      referenceId,
      message: 'Mock: unknown reference — still pending review',
      checkedAt: new Date().toISOString(),
    };
  }

  async lookup(request: RegistryLookupRequest): Promise<RegistryLookupResult> {
    const id = String(request.cedulaNumber || request.npiNumber || '').trim().toUpperCase();
    const checkedAt = new Date().toISOString();
    const referenceId = `mock_${Date.now()}_${id.slice(0, 8) || 'empty'}`;
    if (!id || id.length < 4) {
      return {
        provider: this.name,
        country: request.country,
        outcome: 'not_found',
        checkedAt,
        referenceId,
        message: 'Mock: id too short',
        records: [],
      };
    }
    if (id.includes('UNAVAIL')) {
      return {
        provider: this.name,
        country: request.country,
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
      provider: this.name,
      country: request.country,
      outcome,
      checkedAt,
      referenceId,
      message: `Mock outcome=${outcome}; never auto-approved`,
      nameMatch,
      medicalTitleOk: !id.includes('FAIL'),
      specialtyTitleOk: null,
      records: [
        {
          registryId: id,
          fullName: registryName,
          title: 'Médico Cirujano',
        },
      ],
      raw: { mock: true, autoApprove: false },
    };
  }
}

let singleton: MockCedulaProvider | null = null;

/**
 * @deprecated Prefer getRegistryLookupProvider / server admin review path.
 * Returns mock only when DOCTOR_ALLOW_MOCK_VERIFICATION is enabled outside production.
 */
export function getCedulaVerificationProvider(
  env: NodeJS.ProcessEnv = typeof process !== 'undefined' ? process.env : ({} as NodeJS.ProcessEnv)
): CedulaVerificationProvider {
  if (!isMockVerificationAllowed(env)) {
    throw new Error('mock_verification_disabled_in_production');
  }
  if (!singleton) singleton = new MockCedulaProvider();
  return singleton;
}
