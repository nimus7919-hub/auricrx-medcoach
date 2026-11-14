import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import * as fs from 'fs';
import * as path from 'path';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import PreVisitIntakeFlow from '../../screens/preVisitIntake/PreVisitIntakeFlow';
import StaticEmergencyNotice from '../../screens/preVisitIntake/StaticEmergencyNotice';
import { createMockPreVisitIntakeClient } from '../preVisitIntake/mockPreVisitIntakeClient';
import { findBannedClinicalTerms } from '../../../packages/doctor-core/src/compliance/bannedTerms';

const NOTICE = {
  en: 'If this is an emergency, call 911 or go to the nearest emergency room. This intake is not emergency care and is not monitored in real time.',
  es: 'Si esto es una emergencia, llama al 911 o acude a la sala de emergencias más cercana. Esta entrevista no es atención de emergencias y no se vigila en tiempo real.',
};

async function makeI18n(lng: 'en' | 'es') {
  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({
    lng,
    fallbackLng: 'en',
    resources: { en: { translation: en }, es: { translation: es } },
    interpolation: { escapeValue: false },
  });
  return inst;
}

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const appointments = [{ id: 'appt-1', title: 'Consulta general', startDate: FUTURE, location: 'Clínica Centro', status: 'scheduled' }];

function expectNoticeOnce(lng: 'en' | 'es') {
  const notices = screen.getAllByTestId('intake-static-emergency-notice');
  expect(notices).toHaveLength(1);
  expect(screen.getByText(NOTICE[lng])).toBeTruthy();
}

describe('pre-visit intake static emergency notice invariant', () => {
  it('the notice component takes no props (cannot depend on input)', () => {
    expect(StaticEmergencyNotice.length).toBe(0);
    const src = fs.readFileSync(path.join(__dirname, '../../screens/preVisitIntake/StaticEmergencyNotice.tsx'), 'utf8');
    expect(src).toMatch(/export default function StaticEmergencyNotice\(\)/);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/props|useState|useEffect|\?\s*t\(|&&/);
    const frame = fs.readFileSync(path.join(__dirname, '../../screens/preVisitIntake/IntakeFrame.tsx'), 'utf8');
    expect(frame).toMatch(/\n\s*<StaticEmergencyNotice \/>\n/);
  });

  it('the notice copy is identical for every patient and exists in en and es', () => {
    expect((en as any).preVisitIntake.emergencyNotice).toBe(NOTICE.en);
    expect((es as any).preVisitIntake.emergencyNotice).toBe(NOTICE.es);
    expect(NOTICE.en).not.toMatch(/\{\{/);
    expect(NOTICE.es).not.toMatch(/\{\{/);
  });

  for (const lng of ['en', 'es'] as const) {
    it(`shows the same notice on every intake screen, unchanged by patient input (${lng})`, async () => {
      const i18n = await makeI18n(lng);
      const client = createMockPreVisitIntakeClient({
        translateQuestion: (k, l) => String(i18n.t(`preVisitIntake.mockQuestions.${k}`, { lng: l })),
      });
      const onClose = jest.fn();
      await render(
        <I18nextProvider i18n={i18n}>
          <PreVisitIntakeFlow mode="book" appointments={appointments} initialAppointmentId="appt-1" justBookedId="appt-1" client={client} onClose={onClose} />
        </I18nextProvider>
      );
      // 1. appointment
      expect(screen.getByTestId('intake-step-selectAppointment')).toBeTruthy();
      expectNoticeOnce(lng);
      await fireEvent.press(screen.getByTestId('intake-appt-continue'));
      // 2. doctor
      await waitFor(() => screen.getByTestId('intake-doctor-mock-doctor-1'));
      expectNoticeOnce(lng);
      await fireEvent.press(screen.getByTestId('intake-doctor-mock-doctor-1'));
      await fireEvent.press(screen.getByTestId('intake-doctor-continue'));
      // 3. offer
      expect(screen.getByTestId('intake-offer-card')).toBeTruthy();
      expectNoticeOnce(lng);
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-offer-start'));
      });
      // 4. chat — type alarming-sounding text: the notice must not change or duplicate
      await waitFor(() => screen.getByTestId('intake-step-chat'));
      expectNoticeOnce(lng);
      const alarming = lng === 'es' ? 'Me duele mucho el pecho, es una emergencia' : 'Severe chest pain, this is an emergency';
      await fireEvent.changeText(screen.getByTestId('intake-chat-input'), alarming);
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-chat-send'));
      });
      await waitFor(() => expect(screen.getAllByTestId('intake-turn-patient')).toHaveLength(1));
      expectNoticeOnce(lng);
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-chat-finish'));
      });
      // 5. review — read-only summary + comment
      await waitFor(() => screen.getByTestId('intake-review'));
      expectNoticeOnce(lng);
      expect(screen.getByText(alarming)).toBeTruthy(); // patient's words, verbatim, as main concern
      expect(screen.queryAllByTestId('intake-summary-readonly')).toHaveLength(1);
      await fireEvent.changeText(screen.getByTestId('intake-comment-input'), 'Comentario del paciente');
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-share'));
      });
      // 6. done
      await waitFor(() => screen.getByTestId('intake-done-shared'));
      expectNoticeOnce(lng);
      const [shared] = await client.listSessionsForAppointment('appt-1');
      expect(shared.patientComment).toBe('Comentario del paciente');
      expect(shared.summary?.mainConcern).toBe(alarming);
      await fireEvent.press(screen.getByTestId('intake-done-close'));
      expect(onClose).toHaveBeenCalledWith('shared');
    });
  }

  it("history view shows the notice, and delete-chat asks for confirmation", async () => {
    const i18n = await makeI18n('en');
    const client = createMockPreVisitIntakeClient({ translateQuestion: (k) => k });
    const { session } = await client.startSession({
      appointmentId: 'appt-1', appointmentStartIso: FUTURE, doctorId: 'mock-doctor-1', locale: 'en',
      consent: { acceptedAt: new Date().toISOString(), noticeVersion: 'v', emergencyDisclaimerVersion: 'v' },
    });
    await client.sendMessage(session.id, 'Headache');
    await client.getSummary(session.id);
    await client.confirmAndShare(session.id);
    await render(
      <I18nextProvider i18n={i18n}>
        <PreVisitIntakeFlow mode="history" appointments={appointments} initialAppointmentId="appt-1" client={client} onClose={jest.fn()} />
      </I18nextProvider>
    );
    await waitFor(() => screen.getByTestId(`intake-history-${session.id}`));
    expectNoticeOnce('en');
    await fireEvent.press(screen.getByTestId(`intake-delete-chat-${session.id}`));
    expect(screen.getByTestId('intake-delete-chat-dialog')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intake-delete-chat-dialog-confirm'));
    });
    await waitFor(() => screen.getByText('Chat deleted. The summary and your comment are kept.'));
    expectNoticeOnce('en');
  });

  it('skipping at the first step closes without creating anything', async () => {
    const i18n = await makeI18n('es');
    const client = createMockPreVisitIntakeClient({ translateQuestion: (k) => k });
    const start = jest.spyOn(client, 'startSession');
    const onClose = jest.fn();
    await render(
      <I18nextProvider i18n={i18n}>
        <PreVisitIntakeFlow mode="book" appointments={appointments} initialAppointmentId="appt-1" client={client} onClose={onClose} />
      </I18nextProvider>
    );
    await fireEvent.press(screen.getByTestId('intake-skip'));
    expect(onClose).toHaveBeenCalledWith('skipped');
    expect(start).not.toHaveBeenCalled();
  });

  it('leaving mid-chat requires confirmation and discards the draft', async () => {
    const i18n = await makeI18n('en');
    const client = createMockPreVisitIntakeClient({ translateQuestion: (k) => k });
    const discard = jest.spyOn(client, 'discard');
    const onClose = jest.fn();
    await render(
      <I18nextProvider i18n={i18n}>
        <PreVisitIntakeFlow mode="book" appointments={appointments} initialAppointmentId="appt-1" client={client} onClose={onClose} />
      </I18nextProvider>
    );
    await fireEvent.press(screen.getByTestId('intake-appt-continue'));
    await waitFor(() => screen.getByTestId('intake-doctor-mock-doctor-1'));
    await fireEvent.press(screen.getByTestId('intake-doctor-mock-doctor-1'));
    await fireEvent.press(screen.getByTestId('intake-doctor-continue'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intake-offer-start'));
    });
    await waitFor(() => screen.getByTestId('intake-step-chat'));
    await fireEvent.press(screen.getByTestId('intake-close'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('intake-leave-dialog')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intake-leave-dialog-confirm'));
    });
    expect(discard).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith('discarded');
  });
});

describe('pre-visit intake copy compliance', () => {
  const flat = (o: any, p = ''): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));

  it('en and es have the same preVisitIntake keys', () => {
    const e = flat((en as any).preVisitIntake).map(([k]) => k).sort();
    const s = flat((es as any).preVisitIntake).map(([k]) => k).sort();
    expect(s).toEqual(e);
  });

  it('no banned clinical-judgment terms in intake copy (incl. PR #35 additions)', () => {
    const extra = /red flag|warning sign|datos de alarma|\blikely\b|consistent with|could be|differential|diagnos|triage|urgen/i;
    for (const [key, value] of [...flat((en as any).preVisitIntake), ...flat((es as any).preVisitIntake)]) {
      expect({ key, hits: findBannedClinicalTerms(value) }).toEqual({ key, hits: [] });
      expect({ key, extra: extra.test(value) }).toEqual({ key, extra: false });
    }
  });
});
