/**
 * Unit tests for doctor verification helpers (no Firestore / firebase-admin).
 * Run: node server/doctor-verification.test.js
 */

const assert = require('assert');
const { compareNames, namesMatchStrict } = require('./verification/nameMatch');
const { isMedicalGeneralTitle } = require('./verification/medicalTitles');
const { isMockVerificationAllowed, lookupMock } = require('./verification/mockRegistry');
const { lookupSepCedula } = require('./verification/sepCedula');
const { lookupNpi } = require('./verification/npiRegistry');
const { startIdentityCheck } = require('./verification/identityProviders');
const { computeExpiryFromVerifiedAt, isExpired, isDueForRecheck } = require('./verification/registry');

// Load only after helpers — doctor-verification lazily requires firebase.
const { validateSubmission, isAdminToken } = require('./doctor-verification');

function pass(name) {
  console.log(`ok - ${name}`);
}

async function run() {
  assert.strictEqual(namesMatchStrict('José López', 'Jose Lopez'), true);
  assert.strictEqual(compareNames('Ana María', 'Ana').matched, false);
  pass('name match accent/case + all parts');

  assert.strictEqual(isMedicalGeneralTitle('Médico Cirujano'), true);
  assert.strictEqual(isMedicalGeneralTitle('Licenciatura en Derecho'), false);
  pass('medical title detection');

  assert.strictEqual(
    isMockVerificationAllowed({ NODE_ENV: 'production', DOCTOR_ALLOW_MOCK_VERIFICATION: 'true' }),
    false
  );
  assert.strictEqual(
    isMockVerificationAllowed({ NODE_ENV: 'development', DOCTOR_ALLOW_MOCK_VERIFICATION: 'true' }),
    true
  );
  const mock = await lookupMock({ country: 'MX', legalFullName: 'Ana Test', cedulaNumber: '12345678' });
  assert.strictEqual(mock.outcome, 'match');
  pass('mock blocked in production; never auto-approve');

  const sep = await lookupSepCedula(
    { country: 'MX', legalFullName: 'Ana', cedulaNumber: '1234567' },
    {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'text/html' },
        text: async () => '<html>captcha</html>',
      }),
    }
  );
  assert.strictEqual(sep.outcome, 'lookup_unavailable');
  pass('SEP captcha → lookup_unavailable');

  const npi = await lookupNpi(
    {
      country: 'US',
      legalFullName: 'David A Wiebe',
      npiNumber: '1679576722',
      licenseNumber: '12637',
      licenseState: 'NE',
    },
    {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        text: async () =>
          JSON.stringify({
            result_count: 1,
            results: [
              {
                number: '1679576722',
                enumeration_type: 'NPI-1',
                basic: { first_name: 'DAVID', middle_name: 'A', last_name: 'WIEBE' },
                taxonomies: [
                  {
                    code: '207X00000X',
                    desc: 'Orthopaedic Surgery',
                    license: '12637',
                    primary: true,
                    state: 'NE',
                  },
                ],
              },
            ],
          }),
      }),
    }
  );
  assert.strictEqual(npi.outcome, 'match');
  assert.ok(npi.stateBoardLookupUrl);
  pass('NPI physician match + state board link');

  const prev = process.env.DOCTOR_IDENTITY_PROVIDER;
  const prevKey = process.env.TRUORA_API_KEY;
  process.env.DOCTOR_IDENTITY_PROVIDER = 'truora';
  delete process.env.TRUORA_API_KEY;
  const id = await startIdentityCheck({ doctorUid: 'u', country: 'MX', legalFullName: 'Ana' });
  assert.strictEqual(id.status, 'not_configured');
  if (prev !== undefined) process.env.DOCTOR_IDENTITY_PROVIDER = prev;
  else delete process.env.DOCTOR_IDENTITY_PROVIDER;
  if (prevKey !== undefined) process.env.TRUORA_API_KEY = prevKey;
  pass('identity fail-closed when unconfigured');

  const bad = validateSubmission({ displayName: 'A', specialty: '' }, { country: 'MX' });
  assert.strictEqual(bad.ok, false);
  const goodMx = validateSubmission(
    { displayName: 'Ana', specialty: 'IM', cedulaNumber: '12345' },
    { country: 'MX', legalFullName: 'Ana Test' }
  );
  assert.strictEqual(goodMx.ok, true);
  const goodUs = validateSubmission(
    { displayName: 'Doc', specialty: 'IM' },
    {
      country: 'US',
      legalFullName: 'Doc Test',
      npiNumber: '1679576722',
      licenseNumber: '12637',
      licenseState: 'NE',
    }
  );
  assert.strictEqual(goodUs.ok, true);
  pass('submission validation');

  assert.strictEqual(isAdminToken({ admin: true }), true);
  assert.strictEqual(isAdminToken({}), false);
  pass('admin claim gate');

  const verifiedAt = '2025-01-01T00:00:00.000Z';
  const expiresAt = computeExpiryFromVerifiedAt(verifiedAt);
  assert.ok(expiresAt.startsWith('2026-01-01'));
  assert.strictEqual(
    isExpired({ verificationStatus: 'verified', expiresAt: '2020-01-01T00:00:00.000Z' }, new Date('2026-01-01')),
    true
  );
  assert.strictEqual(
    isDueForRecheck(
      { verificationStatus: 'verified', expiresAt: '2026-01-20T00:00:00.000Z' },
      30,
      new Date('2026-01-01T00:00:00.000Z')
    ),
    true
  );
  pass('annual expiry helpers');

  console.log('\nAll doctor-verification tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
