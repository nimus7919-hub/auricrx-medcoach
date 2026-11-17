import { getPreVisitIntakeApiMode } from '../../config/preVisitIntake';
import { createMockPreVisitIntakeClient, type MockQuestionKey } from './mockPreVisitIntakeClient';
import { createHttpPreVisitIntakeClient } from './httpPreVisitIntakeClient';
import type { IntakeDoctor, PreVisitIntakeClient } from './types';

export * from './types';
export * from './flow';
export * from './retention';
export { PRE_VISIT_INTAKE_ENDPOINTS } from './httpPreVisitIntakeClient';

let cached: PreVisitIntakeClient | null = null;

/** Active doctorLinks for the signed-in patient, from the existing Doctor Mode service. */
async function listLinkedDoctors(): Promise<IntakeDoctor[]> {
  // Lazy requires keep Firebase out of unit tests and out of the bundle path until the flag is on.
  const { default: DoctorModeService } = require('../doctorModeService');
  const { auth } = require('../../config/firebase');
  const uid = auth?.currentUser?.uid;
  const links: any[] = await DoctorModeService.getInstance().listLinksForCurrentUser();
  return links
    .filter((l) => l.status === 'active' && (!uid || l.patientId === uid))
    .map((l) => ({ id: l.doctorId, linkId: l.id, displayName: l.doctorDisplayName || l.doctorId }));
}

export function getPreVisitIntakeClient(
  translateQuestion: (key: MockQuestionKey, locale: 'en' | 'es') => string
): PreVisitIntakeClient {
  if (cached) return cached;
  if (getPreVisitIntakeApiMode() === 'http') {
    const { API_BASE } = require('../../config/api');
    const { authenticatedFetch } = require('../authenticatedFetch');
    cached = createHttpPreVisitIntakeClient({ baseUrl: API_BASE, fetchImpl: authenticatedFetch, listEligibleDoctors: listLinkedDoctors });
  } else {
    cached = createMockPreVisitIntakeClient({ translateQuestion, latencyMs: 350 });
  }
  return cached;
}

/** Test hook. */
export function __resetPreVisitIntakeClientForTests(): void {
  cached = null;
}
