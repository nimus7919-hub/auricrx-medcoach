/**
 * Provider interface for paid automated cédula profesional verification.
 * Swap MockCedulaProvider for a real vendor implementation when ready.
 */

import type { VerificationStatus } from '../types';

export interface CedulaVerificationRequest {
  fullName: string;
  cedulaNumber: string;
  specialty?: string;
  /** ISO country — Mexico first. */
  country?: string;
}

export interface CedulaVerificationResult {
  status: VerificationStatus;
  /** Vendor reference / job id */
  referenceId?: string;
  message?: string;
  checkedAt: string;
  raw?: unknown;
}

export interface CedulaVerificationProvider {
  readonly name: string;
  submit(request: CedulaVerificationRequest): Promise<CedulaVerificationResult>;
  /** Poll or fetch status for an existing submission. */
  getStatus(referenceId: string): Promise<CedulaVerificationResult>;
}
