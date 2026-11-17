/**
 * Pluggable identity verification (INE/passport + liveness selfie).
 * Uploads go only through the vendor — we never store raw ID images in Firestore.
 *
 * Adapters are stubbed for Truora/MetaMap (MX) and Persona/Veriff (US).
 * When API keys are missing, providers fail closed (not_configured).
 */

export type IdentityProviderId = 'truora' | 'metamap' | 'persona' | 'veriff' | 'none';

export type IdentityCheckStatus =
  | 'started'
  | 'pending'
  | 'passed'
  | 'failed'
  | 'not_configured'
  | 'skipped';

export interface IdentityVerificationRequest {
  doctorUid: string;
  country: 'MX' | 'US';
  legalFullName: string;
  email?: string;
  /** Absolute HTTPS callback URL for vendor webhooks (optional). */
  callbackUrl?: string;
}

export interface IdentityVerificationSession {
  provider: IdentityProviderId;
  status: IdentityCheckStatus;
  sessionId?: string;
  /** Vendor-hosted URL / SDK token for the doctor to complete ID + liveness. */
  launchUrl?: string;
  message?: string;
  checkedAt: string;
  raw?: unknown;
}

export interface IdentityVerificationProvider {
  readonly id: IdentityProviderId;
  readonly name: string;
  isConfigured(): boolean;
  start(request: IdentityVerificationRequest): Promise<IdentityVerificationSession>;
  getStatus(sessionId: string): Promise<IdentityVerificationSession>;
}

function notConfigured(id: IdentityProviderId, name: string): IdentityVerificationSession {
  return {
    provider: id,
    status: 'not_configured',
    message: `${name} is not configured (missing API keys). Identity check skipped; manual review required.`,
    checkedAt: new Date().toISOString(),
  };
}

abstract class EnvGatedIdentityProvider implements IdentityVerificationProvider {
  abstract readonly id: IdentityProviderId;
  abstract readonly name: string;
  protected abstract envKeys(): string[];

  isConfigured(): boolean {
    return this.envKeys().every((k) => {
      const v = typeof process !== 'undefined' ? process.env?.[k] : undefined;
      return typeof v === 'string' && v.trim().length > 0;
    });
  }

  async start(request: IdentityVerificationRequest): Promise<IdentityVerificationSession> {
    if (!this.isConfigured()) return notConfigured(this.id, this.name);
    // Real vendor SDK wiring lands when keys exist. Fail closed rather than fake a pass.
    return {
      provider: this.id,
      status: 'failed',
      message: `${this.name} keys are present but the adapter is stubbed — do not treat as passed.`,
      checkedAt: new Date().toISOString(),
      raw: { doctorUid: request.doctorUid, country: request.country },
    };
  }

  async getStatus(sessionId: string): Promise<IdentityVerificationSession> {
    if (!this.isConfigured()) return notConfigured(this.id, this.name);
    return {
      provider: this.id,
      status: 'failed',
      sessionId,
      message: `${this.name} status poll is stubbed.`,
      checkedAt: new Date().toISOString(),
    };
  }
}

export class TruoraIdentityProvider extends EnvGatedIdentityProvider {
  readonly id = 'truora' as const;
  readonly name = 'Truora';
  protected envKeys() {
    return ['TRUORA_API_KEY'];
  }
}

export class MetaMapIdentityProvider extends EnvGatedIdentityProvider {
  readonly id = 'metamap' as const;
  readonly name = 'MetaMap';
  protected envKeys() {
    return ['METAMAP_CLIENT_ID', 'METAMAP_CLIENT_SECRET'];
  }
}

export class PersonaIdentityProvider extends EnvGatedIdentityProvider {
  readonly id = 'persona' as const;
  readonly name = 'Persona';
  protected envKeys() {
    return ['PERSONA_API_KEY', 'PERSONA_TEMPLATE_ID'];
  }
}

export class VeriffIdentityProvider extends EnvGatedIdentityProvider {
  readonly id = 'veriff' as const;
  readonly name = 'Veriff';
  protected envKeys() {
    return ['VERIFF_API_KEY', 'VERIFF_SHARED_SECRET'];
  }
}

export class NoneIdentityProvider implements IdentityVerificationProvider {
  readonly id = 'none' as const;
  readonly name = 'none';
  isConfigured() {
    return false;
  }
  async start(): Promise<IdentityVerificationSession> {
    return notConfigured('none', 'Identity provider');
  }
  async getStatus(): Promise<IdentityVerificationSession> {
    return notConfigured('none', 'Identity provider');
  }
}

/**
 * Resolve identity provider from env.
 * DOCTOR_IDENTITY_PROVIDER=truora|metamap|persona|veriff|none
 * Defaults: MX → truora, US → persona, else none. Always fail-closed without keys.
 */
export function getIdentityVerificationProvider(
  country: 'MX' | 'US',
  env: NodeJS.ProcessEnv = typeof process !== 'undefined' ? process.env : ({} as NodeJS.ProcessEnv)
): IdentityVerificationProvider {
  const forced = String(env.DOCTOR_IDENTITY_PROVIDER || '')
    .trim()
    .toLowerCase();
  if (forced === 'truora') return new TruoraIdentityProvider();
  if (forced === 'metamap') return new MetaMapIdentityProvider();
  if (forced === 'persona') return new PersonaIdentityProvider();
  if (forced === 'veriff') return new VeriffIdentityProvider();
  if (forced === 'none') return new NoneIdentityProvider();
  if (country === 'MX') return new TruoraIdentityProvider();
  if (country === 'US') return new PersonaIdentityProvider();
  return new NoneIdentityProvider();
}
