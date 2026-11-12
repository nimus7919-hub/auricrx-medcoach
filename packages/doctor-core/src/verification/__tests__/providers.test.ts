import { SepCedulaProvider } from '../SepCedulaProvider';
import { NpiRegistryProvider } from '../NpiRegistryProvider';
import { MockCedulaProvider, isMockVerificationAllowed } from '../MockCedulaProvider';
import { getIdentityVerificationProvider } from '../IdentityVerificationProvider';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] || headers[k] || null },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as any;
}

describe('registry providers (mocked HTTP)', () => {
  it('SEP matches medical title and name, never auto-approves', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({
        items: [
          {
            idCedula: '1234567',
            nombre: 'ANA',
            paterno: 'LOPEZ',
            materno: 'GARCIA',
            titulo: 'Médico Cirujano',
            institucion: 'UNAM',
          },
        ],
      })
    );
    const provider = new SepCedulaProvider(fetchImpl);
    const result = await provider.lookup({
      country: 'MX',
      legalFullName: 'Ana López García',
      cedulaNumber: '1234567',
    });
    expect(result.outcome).toBe('match');
    expect(result.nameMatch?.matched).toBe(true);
    expect(result.medicalTitleOk).toBe(true);
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('SEP returns lookup_unavailable on captcha HTML', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse('<html>captcha</html>', 200, { 'content-type': 'text/html' })
    );
    const provider = new SepCedulaProvider(fetchImpl);
    const result = await provider.lookup({
      country: 'MX',
      legalFullName: 'Ana',
      cedulaNumber: '1234567',
    });
    expect(result.outcome).toBe('lookup_unavailable');
  });

  it('NPI checks NPI-1 + physician taxonomy + name', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({
        result_count: 1,
        results: [
          {
            number: '1679576722',
            enumeration_type: 'NPI-1',
            basic: { first_name: 'DAVID', middle_name: 'A', last_name: 'WIEBE', credential: 'M.D.' },
            taxonomies: [
              { code: '207X00000X', desc: 'Orthopaedic Surgery', license: '12637', primary: true, state: 'NE' },
            ],
          },
        ],
      })
    );
    const provider = new NpiRegistryProvider(fetchImpl);
    const result = await provider.lookup({
      country: 'US',
      legalFullName: 'David A Wiebe',
      npiNumber: '1679576722',
      licenseNumber: '12637',
      licenseState: 'NE',
    });
    expect(result.outcome).toBe('match');
    expect(result.stateBoardLookupUrl).toBeTruthy();
    expect(result.medicalTitleOk).toBe(true);
  });

  it('mock provider never returns verified and is blocked in production', async () => {
    expect(isMockVerificationAllowed({ NODE_ENV: 'production', DOCTOR_ALLOW_MOCK_VERIFICATION: 'true' })).toBe(
      false
    );
    expect(isMockVerificationAllowed({ NODE_ENV: 'test', DOCTOR_ALLOW_MOCK_VERIFICATION: 'true' })).toBe(true);
    const mock = new MockCedulaProvider();
    const ok = await mock.submit({ fullName: 'Ana', cedulaNumber: '12345678' });
    expect(ok.status).toBe('pending_review');
    expect(ok.status).not.toBe('verified');
  });

  it('identity providers fail closed without keys', async () => {
    const prev = process.env.TRUORA_API_KEY;
    delete process.env.TRUORA_API_KEY;
    process.env.DOCTOR_IDENTITY_PROVIDER = 'truora';
    const provider = getIdentityVerificationProvider('MX');
    const session = await provider.start({
      doctorUid: 'u1',
      country: 'MX',
      legalFullName: 'Ana',
    });
    expect(session.status).toBe('not_configured');
    if (prev) process.env.TRUORA_API_KEY = prev;
    delete process.env.DOCTOR_IDENTITY_PROVIDER;
  });
});
