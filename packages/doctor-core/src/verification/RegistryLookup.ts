import type { VerificationStatus } from '../types';
import type { NameMatchResult } from './nameMatch';

export type DoctorCountry = 'MX' | 'US';

export type RegistryLookupOutcome =
  | 'match'
  | 'mismatch'
  | 'not_found'
  | 'non_medical'
  | 'lookup_unavailable';

export interface RegistryRecord {
  registryId?: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
  title?: string;
  institution?: string;
  year?: number | string;
  taxonomyCode?: string;
  taxonomyDesc?: string;
  licenseNumber?: string;
  licenseState?: string;
  raw?: unknown;
}

export interface RegistryLookupResult {
  provider: string;
  country: DoctorCountry;
  outcome: RegistryLookupOutcome;
  checkedAt: string;
  referenceId: string;
  message?: string;
  nameMatch?: NameMatchResult;
  medicalTitleOk?: boolean;
  specialtyTitleOk?: boolean | null;
  records: RegistryRecord[];
  /** State medical board lookup URL for US manual verification. */
  stateBoardLookupUrl?: string | null;
  raw?: unknown;
}

export interface RegistryLookupRequest {
  country: DoctorCountry;
  legalFullName: string;
  /** MX cédula profesional (general). */
  cedulaNumber?: string;
  /** MX specialty cédula when claimed. */
  specialtyCedulaNumber?: string;
  specialty?: string;
  /** US NPI. */
  npiNumber?: string;
  /** US state license number (manual board check). */
  licenseNumber?: string;
  licenseState?: string;
}

export interface RegistryLookupProvider {
  readonly name: string;
  readonly country: DoctorCountry;
  lookup(request: RegistryLookupRequest): Promise<RegistryLookupResult>;
}

/**
 * Client-facing submission result. Never auto-approves:
 * status is always pending_review (or rejected for invalid input).
 */
export interface DoctorVerificationSubmitResult {
  status: Extract<VerificationStatus, 'pending_review' | 'rejected' | 'pending'>;
  registry: RegistryLookupResult;
  identity: {
    provider: string;
    status: 'started' | 'not_configured' | 'failed' | 'skipped';
    sessionId?: string;
    launchUrl?: string;
    message?: string;
  };
  message?: string;
}
