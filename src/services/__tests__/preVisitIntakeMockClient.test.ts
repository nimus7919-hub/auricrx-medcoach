import {
  buildDescriptiveSummary,
  createMockPreVisitIntakeClient,
  MOCK_QUESTION_KEYS,
  parseReportedSeverity,
} from '../preVisitIntake/mockPreVisitIntakeClient';
import { PRE_VISIT_INTAKE_ENDPOINTS } from '../preVisitIntake/httpPreVisitIntakeClient';
import { findBannedClinicalTerms } from '../../../packages/doctor-core/src/compliance/bannedTerms';
import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';
import type { PreVisitIntakeClient } from '../preVisitIntake/types';

const consent = { acceptedAt: '2026-11-14T15:00:00.000Z', noticeVersion: 'v', emergencyDisclaimerVersion: 'v' };
const APPT = '2026-11-20T16:00:00.000Z';

function setup(nowIso = '2026-11-14T15:00:00.000Z') {
  let now = new Date(nowIso);
  const client = createMockPreVisitIntakeClient({ translateQuestion: (k) => `Q:${k}`, now: () => now });
  return { client, setNow: (iso: string) => (now = new Date(iso)) };
}

async function startAndAnswer(client: PreVisitIntakeClient, answers: string[]) {
  const { session } = await client.startSession({ appointmentId: 'a1', appointmentStartIso: APPT, doctorId: 'mock-doctor-1', locale: 'en', consent });
  for (const a of answers) await client.sendMessage(session.id, a);
  return session.id;
}

const STOMACH = ['My stomach hurts.', 'In the pit of the stomach', 'Three days', '6', 'Burning', 'It started the day we ate with family', 'no', "I haven't taken anything", 'none'];

describe('mock pre-visit intake client', () => {
  it('asks the opening question plus at most 8 follow-ups, then stops', async () => {
    const { client } = setup();
    const { session, firstMessage } = await client.startSession({ appointmentId: 'a1', appointmentStartIso: APPT, doctorId: 'mock-doctor-1', locale: 'es', consent });
    expect(firstMessage.text).toBe('Q:mainConcern');
    const asked: string[] = [firstMessage.text];
    let done = false;
    let i = 0;
    while (!done && i < 20) {
      const res = await client.sendMessage(session.id, `answer ${i++}`);
      if (res.reply) asked.push(res.reply.text);
      done = res.done;
    }
    expect(asked).toEqual(MOCK_QUESTION_KEYS.map((k) => `Q:${k}`));
    expect(asked.length - 1).toBe(PRE_VISIT_INTAKE_CONFIG.MAX_FOLLOW_UPS);
  });

  it('requires consent and an eligible (linked) doctor', async () => {
    const { client } = setup();
    await expect(client.startSession({ appointmentId: 'a', appointmentStartIso: APPT, doctorId: 'stranger', locale: 'en', consent })).rejects.toThrow('doctor_not_linked');
    await expect(
      client.startSession({ appointmentId: 'a', appointmentStartIso: APPT, doctorId: 'mock-doctor-1', locale: 'en', consent: { ...consent, acceptedAt: '' } })
    ).rejects.toThrow('consent_required');
  });

  it("builds a summary from the patient's own words only (stomach-pain example)", async () => {
    const { client } = setup();
    const id = await startAndAnswer(client, STOMACH);
    const s = await client.getSummary(id);
    expect(s).toMatchObject({
      mainConcern: 'My stomach hurts.',
      location: 'In the pit of the stomach',
      duration: 'Three days',
      severityReported: 6,
      alsoMentioned: ['Burning', 'It started the day we ate with family', "I haven't taken anything"],
      questionsForDoctor: [],
    });
    const allText = JSON.stringify(s);
    expect(findBannedClinicalTerms(allText)).toEqual([]);
    expect(allText).not.toMatch(/dyspepsia|gastritis|warning sign|red flag|datos de alarma|likely|consistent with|could be/i);
  });

  it('leaves unanswered fields as null (Not mentioned), never filled', () => {
    const s = buildDescriptiveSummary({ mainConcern: 'Headache' }, 'en', 'now');
    expect(s).toMatchObject({ mainConcern: 'Headache', location: null, duration: null, severityReported: null, alsoMentioned: [], questionsForDoctor: [] });
  });

  it('records severity only as a patient-stated number', () => {
    expect(parseReportedSeverity('7')).toBe(7);
    expect(parseReportedSeverity('un 8 de 10')).toBe(8);
    expect(parseReportedSeverity('10/10')).toBe(10);
    expect(parseReportedSeverity('pretty bad')).toBeNull();
    expect(parseReportedSeverity('0')).toBeNull();
    const s = buildDescriptiveSummary({ severity: 'pretty bad' }, 'en', 'now');
    expect(s.severityReported).toBeNull();
    expect(s.alsoMentioned).toEqual(['pretty bad']);
  });

  it('comment is shown with the summary, the summary itself is unchanged, and both lock after sharing', async () => {
    const { client } = setup();
    const id = await startAndAnswer(client, STOMACH);
    const summary = await client.getSummary(id);
    const withComment = await client.addComment(id, '  Also I could not sleep well.  ');
    expect(withComment.patientComment).toBe('Also I could not sleep well.');
    expect(withComment.summary).toEqual(summary);
    const shared = await client.confirmAndShare(id);
    expect(shared.status).toBe('confirmed');
    expect(shared.sharedAt).toBe('2026-11-14T15:00:00.000Z');
    await expect(client.addComment(id, 'edit later')).rejects.toThrow('comment_locked');
    await expect(client.discard(id)).rejects.toThrow('already_shared');
  });

  it('cannot share before the summary exists', async () => {
    const { client } = setup();
    const id = await startAndAnswer(client, ['x']);
    await expect(client.confirmAndShare(id)).rejects.toThrow('summary_not_ready');
  });

  it("don't send / discard drops the draft completely", async () => {
    const { client } = setup();
    const id = await startAndAnswer(client, STOMACH);
    await client.getSummary(id);
    await client.discard(id);
    await expect(client.getSummary(id)).rejects.toThrow('intake_not_found');
    expect(await client.listSessionsForAppointment('a1')).toEqual([]);
  });

  it('patient can delete the chat early; summary + comment stay', async () => {
    const { client } = setup();
    const id = await startAndAnswer(client, STOMACH);
    await client.getSummary(id);
    await client.addComment(id, 'note');
    await client.confirmAndShare(id);
    const after = await client.deleteChat(id);
    expect(after.turns).toEqual([]);
    expect(after.rawChatDeletedAt).toBeTruthy();
    expect(after.summary?.mainConcern).toBe('My stomach hurts.');
    expect(after.patientComment).toBe('note');
  });

  it('auto-deletes the raw chat after the retention window, keeping the summary', async () => {
    const { client, setNow } = setup();
    const id = await startAndAnswer(client, STOMACH);
    await client.getSummary(id);
    await client.confirmAndShare(id);
    let [s] = await client.listSessionsForAppointment('a1');
    expect(s.rawChatDeleteAt).toBe('2026-12-20T16:00:00.000Z');
    expect(s.turns.length).toBeGreaterThan(0);
    setNow('2026-12-20T15:59:00.000Z');
    [s] = await client.listSessionsForAppointment('a1');
    expect(s.rawChatDeletedAt).toBeNull();
    setNow('2026-12-20T16:00:00.000Z');
    [s] = await client.listSessionsForAppointment('a1');
    expect(s.turns).toEqual([]);
    expect(s.rawChatDeletedAt).toBe('2026-12-20T16:00:00.000Z');
    expect(s.summary).not.toBeNull();
    expect(s.id).toBe(id);
  });

  it('exposes every interface method as an expected endpoint', () => {
    expect(Object.keys(PRE_VISIT_INTAKE_ENDPOINTS).sort()).toEqual(
      ['addComment', 'confirmAndShare', 'deleteChat', 'discard', 'getSummary', 'listSessionsForAppointment', 'sendMessage', 'startSession', 'submitBodyPainMap'].sort()
    );
  });
});
