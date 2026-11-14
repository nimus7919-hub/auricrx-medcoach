/**
 * HTTP implementation of the pre-visit intake contract. Endpoints are NOT built yet — they are
 * owned by the doctor-app/back-end engineer (PR #35). This client documents the expected shape
 * and fails closed (throws) on any non-2xx response, so the UI shows a neutral error and the
 * patient can simply skip. It is only reachable when EXPO_PUBLIC_PREVISIT_INTAKE_API=http.
 */
import type {
  BodyPainMapPayload,
  IntakeDoctor,
  IntakeSession,
  IntakeSummary,
  PreVisitIntakeClient,
  SendMessageResult,
  StartSessionInput,
  StartSessionResult,
} from './types';

/** Expected endpoints (to be matched to PR #35 §8). All require a Firebase ID token. */
export const PRE_VISIT_INTAKE_ENDPOINTS = {
  startSession: { method: 'POST', path: '/api/patient/intake/start' },
  sendMessage: { method: 'POST', path: '/api/patient/intake/turn' },
  getSummary: { method: 'POST', path: '/api/patient/intake/summarize' },
  addComment: { method: 'POST', path: '/api/patient/intake/comment' },
  confirmAndShare: { method: 'POST', path: '/api/patient/intake/confirm' },
  discard: { method: 'POST', path: '/api/patient/intake/discard' },
  deleteChat: { method: 'POST', path: '/api/patient/intake/delete-chat' },
  listSessionsForAppointment: { method: 'GET', path: '/api/patient/intake/list' },
  /** Optional body pain map (EXPO_PUBLIC_FEATURE_BODY_PAIN_MAP). Body: { sessionId, bodyPainMap: BodyPainMapPayload | null }. */
  submitBodyPainMap: { method: 'POST', path: '/api/patient/intake/body-map' },
} as const;

type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}>;

export interface HttpClientDeps {
  baseUrl: string;
  fetchImpl: FetchLike;
  /** Active doctor links for the signed-in patient (existing doctorLinks data; no new endpoint). */
  listEligibleDoctors: () => Promise<IntakeDoctor[]>;
}

export function createHttpPreVisitIntakeClient(deps: HttpClientDeps): PreVisitIntakeClient {
  const call = async <T>(name: keyof typeof PRE_VISIT_INTAKE_ENDPOINTS, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> => {
    const ep = PRE_VISIT_INTAKE_ENDPOINTS[name];
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    const res = await deps.fetchImpl(`${deps.baseUrl}${ep.path}${qs}`, {
      method: ep.method,
      headers: { 'Content-Type': 'application/json' },
      body: ep.method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
    if (!res.ok) throw new Error(`intake_http_${res.status}`);
    return (await res.json()) as T;
  };

  return {
    mode: 'http',
    listEligibleDoctors: () => deps.listEligibleDoctors(),
    startSession: (input: StartSessionInput) => call<StartSessionResult>('startSession', { ...input }),
    sendMessage: (sessionId, text) => call<SendMessageResult>('sendMessage', { sessionId, text }),
    getSummary: (sessionId) => call<IntakeSummary>('getSummary', { sessionId }),
    addComment: (sessionId, comment) => call<IntakeSession>('addComment', { sessionId, comment }),
    confirmAndShare: (sessionId) => call<IntakeSession>('confirmAndShare', { sessionId }),
    discard: async (sessionId) => {
      await call<unknown>('discard', { sessionId });
    },
    deleteChat: (sessionId) => call<IntakeSession>('deleteChat', { sessionId }),
    listSessionsForAppointment: (appointmentId) =>
      call<IntakeSession[]>('listSessionsForAppointment', undefined, { appointmentId }),
    submitBodyPainMap: (sessionId: string, payload: BodyPainMapPayload | null) =>
      call<IntakeSession>('submitBodyPainMap', { sessionId, bodyPainMap: payload }),
  };
}
