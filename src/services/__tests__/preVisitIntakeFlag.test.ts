import {
  computePreVisitIntakeEnabled,
  isInputModeSupported,
  isPreVisitIntakeEnabled,
  PRE_VISIT_INTAKE_CONFIG,
  resolvePreVisitIntakeApiMode,
} from '../../config/preVisitIntake';
import * as fs from 'fs';
import * as path from 'path';

describe('pre-visit intake feature flag', () => {
  it('is OFF when the flag env is missing or not truthy', () => {
    expect(computePreVisitIntakeEnabled({})).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: undefined, isDev: true })).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: 'false', isDev: true })).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: 'yes', isDev: true })).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: '', apiMode: 'http' })).toBe(false);
  });

  it('is OFF in production builds while the API mode is mock (default)', () => {
    expect(computePreVisitIntakeEnabled({ flag: 'true', isDev: false })).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: 'true', apiMode: 'mock', isDev: false })).toBe(false);
    expect(computePreVisitIntakeEnabled({ flag: '1', apiMode: 'whatever', isDev: false })).toBe(false);
  });

  it('turns on only with an explicit flag', () => {
    expect(computePreVisitIntakeEnabled({ flag: 'true', isDev: true })).toBe(true);
    expect(computePreVisitIntakeEnabled({ flag: '1', apiMode: 'http', isDev: false })).toBe(true);
  });

  it('defaults the API mode to mock', () => {
    expect(resolvePreVisitIntakeApiMode(undefined)).toBe('mock');
    expect(resolvePreVisitIntakeApiMode('HTTP')).toBe('mock');
    expect(resolvePreVisitIntakeApiMode('http')).toBe('http');
  });

  it('reads OFF from the real environment by default', () => {
    expect(process.env.EXPO_PUBLIC_FEATURE_PREVISIT_INTAKE).toBeUndefined();
    expect(isPreVisitIntakeEnabled()).toBe(false);
  });

  it('is text-only for v1 (voice seam reserved, not built)', () => {
    expect(PRE_VISIT_INTAKE_CONFIG.INPUT_MODE).toBe('text');
    expect(isInputModeSupported('text')).toBe(true);
    expect(isInputModeSupported('voice')).toBe(false);
  });

  it('the appointments screen only mounts the intake behind the flag', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../screens/AppointmentManagementScreen.tsx'), 'utf8');
    expect(src).toMatch(/const preVisitIntakeEnabled = isPreVisitIntakeEnabled\(\);/);
    expect(src).toMatch(/\{preVisitIntakeEnabled && preVisitIntake && \(\s*<PreVisitIntakeModal/);
    expect(src).toMatch(/\{preVisitIntakeEnabled && \(\s*<TouchableOpacity\s+testID=\{`previsit-intake-entry-/);
    // The offer is opened only after createAppointment resolved (booking never blocked).
    const create = src.indexOf('const createdAppointment = await appointmentService.createAppointment(');
    const offer = src.indexOf("setPreVisitIntake({ mode: 'book'");
    expect(create).toBeGreaterThan(-1);
    expect(offer).toBeGreaterThan(create);
  });
});
