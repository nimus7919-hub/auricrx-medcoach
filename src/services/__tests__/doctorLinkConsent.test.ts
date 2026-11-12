import { defaultConsent, CONSENT_CATEGORIES } from '../../doctor/types';
import { generateInviteCode, inviteExpiresAt, isInviteExpired, normalizeInviteCode } from '../../doctor/invites';
import { MockCedulaProvider } from '../../doctor/verification/MockCedulaProvider';
import { setLocalDoctorPlan, getLocalDoctorPlan, clearLocalDoctorPlan } from '../../doctor/entitlements/doctorPlanEntitlement';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('doctor linking & consent helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('defaults all consent categories to OFF', () => {
    const consent = defaultConsent();
    for (const cat of CONSENT_CATEGORIES) {
      expect(consent[cat]).toBe(false);
    }
  });

  it('generates short invite codes and detects expiry', () => {
    const code = generateInviteCode('DR', 6);
    expect(code).toMatch(/^DR[A-Z0-9]{6}$/);
    expect(normalizeInviteCode(' dr abc ')).toBe('DRABC');
    const future = inviteExpiresAt(30);
    expect(isInviteExpired(future)).toBe(false);
    expect(isInviteExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });

  it('mock cédula provider returns pending/verified/rejected', async () => {
    const provider = new MockCedulaProvider();
    const verified = await provider.submit({ fullName: 'Ana', cedulaNumber: '12345678' });
    expect(verified.status).toBe('verified');
    const pending = await provider.submit({ fullName: 'Ana', cedulaNumber: 'PEND9999' });
    expect(pending.status).toBe('pending');
    const rejected = await provider.submit({ fullName: 'Ana', cedulaNumber: 'FAIL9999' });
    expect(rejected.status).toBe('rejected');
    const short = await provider.submit({ fullName: 'Ana', cedulaNumber: '12' });
    expect(short.status).toBe('rejected');
  });

  it('stores mock doctorPlan entitlement locally (IAP seam)', async () => {
    await setLocalDoctorPlan(true, 'mock');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ doctorPlan: true, source: 'mock', updatedAt: '2026-11-12T00:00:00.000Z' })
    );
    const ent = await getLocalDoctorPlan();
    expect(ent?.doctorPlan).toBe(true);
    expect(ent?.source).toBe('mock');
    await clearLocalDoctorPlan();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
