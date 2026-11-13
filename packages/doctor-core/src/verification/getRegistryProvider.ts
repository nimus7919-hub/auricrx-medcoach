import { isMockVerificationAllowed, MockCedulaProvider } from './MockCedulaProvider';
import { NpiRegistryProvider } from './NpiRegistryProvider';
import { SepCedulaProvider, type FetchLike } from './SepCedulaProvider';
import type { DoctorCountry, RegistryLookupProvider } from './RegistryLookup';

/**
 * Resolve the registry lookup provider.
 * Mock is impossible when NODE_ENV is production/prod, even if the flag is set.
 */
export function getRegistryLookupProvider(
  country: DoctorCountry,
  opts: {
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
    /** Test-only. Still refused when env looks like production. */
    forceMock?: boolean;
  } = {}
): RegistryLookupProvider {
  const env: NodeJS.ProcessEnv =
    opts.env || (typeof process !== 'undefined' ? process.env : ({} as NodeJS.ProcessEnv));
  const nodeEnv = String(env.NODE_ENV || '').toLowerCase();
  const production = nodeEnv === 'production' || nodeEnv === 'prod';

  if (production && (opts.forceMock || isMockVerificationAllowed(env))) {
    throw new Error('mock_verification_impossible_in_production');
  }

  if (!production && (opts.forceMock || isMockVerificationAllowed(env))) {
    return new MockCedulaProvider();
  }

  if (country === 'US') return new NpiRegistryProvider(opts.fetchImpl);
  return new SepCedulaProvider(opts.fetchImpl);
}
