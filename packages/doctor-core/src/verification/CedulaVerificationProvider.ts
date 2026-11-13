/**
 * Legacy provider interface kept for Phase-1 call sites / tests.
 * Real verification uses RegistryLookupProvider + admin review — never auto-approve.
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
  /** Never 'verified' from automated providers — only pending_review / rejected / pending. */
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
