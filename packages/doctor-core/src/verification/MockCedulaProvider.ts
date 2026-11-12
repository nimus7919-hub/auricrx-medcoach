import type {
  CedulaVerificationProvider,
  CedulaVerificationRequest,
  CedulaVerificationResult,
} from './CedulaVerificationProvider';

/**
 * Mock cédula verification for Phase 1.
 *
 * Rules (deterministic for tests):
 * - Empty / too-short cédula → rejected
 * - Cédula containing "PEND" → stays pending
 * - Cédula containing "FAIL" → rejected
 * - Otherwise → verified
 *
 * TODO(vendor): Replace with real paid automated verification service
 * (e.g. SEP/DGP cédula API reseller). Keep this interface stable.
 */
export class MockCedulaProvider implements CedulaVerificationProvider {
  readonly name = 'mock-cedula';

  private store = new Map<string, CedulaVerificationResult>();

  async submit(request: CedulaVerificationRequest): Promise<CedulaVerificationResult> {
    const normalized = (request.cedulaNumber || '').trim().toUpperCase();
    const referenceId = `mock_${Date.now()}_${normalized.slice(0, 8) || 'empty'}`;
    const checkedAt = new Date().toISOString();

    let status: CedulaVerificationResult['status'] = 'verified';
    let message = 'Mock verification accepted';

    if (!normalized || normalized.length < 4) {
      status = 'rejected';
      message = 'Mock: cédula number too short';
    } else if (normalized.includes('FAIL')) {
      status = 'rejected';
      message = 'Mock: verification rejected';
    } else if (normalized.includes('PEND')) {
      status = 'pending';
      message = 'Mock: awaiting manual review';
    }

    const result: CedulaVerificationResult = {
      status,
      referenceId,
      message,
      checkedAt,
      raw: { provider: this.name, request },
    };
    this.store.set(referenceId, result);
    return result;
  }

  async getStatus(referenceId: string): Promise<CedulaVerificationResult> {
    const existing = this.store.get(referenceId);
    if (existing) return existing;
    return {
      status: 'pending',
      referenceId,
      message: 'Mock: unknown reference — still pending',
      checkedAt: new Date().toISOString(),
    };
  }
}

let singleton: MockCedulaProvider | null = null;

export function getCedulaVerificationProvider(): CedulaVerificationProvider {
  // TODO(vendor): switch on env DOCTOR_CEDULA_PROVIDER=real|mock
  if (!singleton) singleton = new MockCedulaProvider();
  return singleton;
}
