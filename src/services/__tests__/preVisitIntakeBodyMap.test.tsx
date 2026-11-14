import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import PreVisitIntakeFlow from '../../screens/preVisitIntake/PreVisitIntakeFlow';
import { createMockPreVisitIntakeClient } from '../preVisitIntake/mockPreVisitIntakeClient';
import { initialIntakeState, intakeReducer, requiresDiscardConfirmation, type IntakeFlowEvent } from '../preVisitIntake/flow';
import { computeBodyPainMapEnabled, isBodyPainMapEnabled } from '../../config/preVisitIntake';

async function makeI18n(lng: 'en' | 'es') {
  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({ lng, fallbackLng: 'en', resources: { en: { translation: en }, es: { translation: es } }, interpolation: { escapeValue: false } });
  return inst;
}

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const appointments = [{ id: 'appt-1', title: 'Consulta general', startDate: FUTURE, location: 'Clínica Centro', status: 'scheduled' }];

describe('body pain map flag', () => {
  it('is off unless BOTH the intake and the body-map flags are on', () => {
    expect(computeBodyPainMapEnabled({ intakeEnabled: false, flag: 'true' })).toBe(false);
    expect(computeBodyPainMapEnabled({ intakeEnabled: true, flag: undefined })).toBe(false);
    expect(computeBodyPainMapEnabled({ intakeEnabled: true, flag: 'yes' })).toBe(false);
    expect(computeBodyPainMapEnabled({ intakeEnabled: true, flag: '1' })).toBe(true);
    expect(computeBodyPainMapEnabled({ intakeEnabled: true, flag: 'true' })).toBe(true);
  });
  it('defaults to off in this environment', () => {
    expect(isBodyPainMapEnabled()).toBe(false);
  });
});

describe('intake flow with the body map step', () => {
  const run = (...events: IntakeFlowEvent[]) => events.reduce(intakeReducer, initialIntakeState({ mode: 'book' }));
  const toOffer: IntakeFlowEvent[] = [{ type: 'SELECT_APPOINTMENT', appointmentId: 'a' }, { type: 'SELECT_DOCTOR', doctorId: 'd' }];

  it('goes offer → bodyMap → chat only when enabled', () => {
    expect(run(...toOffer, { type: 'SESSION_STARTED', sessionId: 's' }).step).toBe('chat');
    const map = run(...toOffer, { type: 'SESSION_STARTED', sessionId: 's', bodyMap: true });
    expect(map.step).toBe('bodyMap');
    expect(intakeReducer(map, { type: 'BODY_MAP_DONE' }).step).toBe('chat');
    expect(run(...toOffer, { type: 'BODY_MAP_DONE' }).step).toBe('offer');
  });

  it('leaving from the body map asks first and discards the draft', () => {
    expect(requiresDiscardConfirmation('bodyMap')).toBe(true);
    const map = run(...toOffer, { type: 'SESSION_STARTED', sessionId: 's', bodyMap: true });
    expect(intakeReducer(map, { type: 'DISCARDED' })).toMatchObject({ step: 'done', outcome: 'discarded' });
  });
});

describe('mock client keeps the body map verbatim', () => {
  it('stores the payload and copies it into the summary; null clears it', async () => {
    const client = createMockPreVisitIntakeClient({ translateQuestion: (k) => k });
    const { session } = await client.startSession({ appointmentId: 'a', appointmentStartIso: FUTURE, doctorId: 'mock-doctor-1', locale: 'en', consent: { acceptedAt: 'x', noticeVersion: 'v', emergencyDisclaimerVersion: 'v' } });
    expect(session.bodyPainMap).toBeNull();
    const payload = {
      version: 1 as const,
      locale: 'en' as const,
      reportedAt: '2026-11-14T16:00:00.000Z',
      markers: [{ layer: 'muscles' as const, view: 'back' as const, regionId: 'lower_back_left', regionLabel: 'Lower back, left side', layerLabel: 'Muscles', position: { x: 0.41, y: 0.41 }, intensity: 6, feels: ['aching' as const], onset: null, note: null }],
    };
    await client.submitBodyPainMap!(session.id, null);
    const saved = await client.submitBodyPainMap!(session.id, payload);
    expect(saved.bodyPainMap).toEqual(payload);
    await client.sendMessage(session.id, 'Back pain');
    const summary = await client.getSummary(session.id);
    expect(summary.bodyPainMap).toEqual(payload);
    await expect(client.submitBodyPainMap!(session.id, payload)).rejects.toThrow('body_map_locked');
  });
});

describe('body map step UI', () => {
  async function openBodyMap(lng: 'en' | 'es') {
    const i18n = await makeI18n(lng);
    const client = createMockPreVisitIntakeClient({ translateQuestion: (k, l) => String(i18n.t(`preVisitIntake.mockQuestions.${k}`, { lng: l })) });
    await render(
      <I18nextProvider i18n={i18n}>
        <PreVisitIntakeFlow mode="book" bodyMapEnabled appointments={appointments} initialAppointmentId="appt-1" client={client} onClose={jest.fn()} />
      </I18nextProvider>
    );
    await fireEvent.press(screen.getByTestId('intake-appt-continue'));
    await waitFor(() => screen.getByTestId('intake-doctor-mock-doctor-1'));
    await fireEvent.press(screen.getByTestId('intake-doctor-mock-doctor-1'));
    await fireEvent.press(screen.getByTestId('intake-doctor-continue'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('intake-offer-start'));
    });
    await waitFor(() => screen.getByTestId('intake-step-bodyMap'));
    return client;
  }

  for (const lng of ['en', 'es'] as const) {
    it(`marks spots, edits details, and the summary lists them descriptively (${lng})`, async () => {
      const client = await openBodyMap(lng);
      // Static emergency notice stays visible on this step, exactly once.
      expect(screen.getAllByTestId('intake-static-emergency-notice')).toHaveLength(1);
      expect(screen.getByTestId('bodymap-descriptive-note')).toBeTruthy();

      // Tap the drawing: skin layer, front view, viewer's right forearm = patient's LEFT forearm.
      await act(async () => {
        fireEvent.press(screen.getByTestId('bodymap-canvas'), { nativeEvent: { locationX: (155 / 200) * 190.9, locationY: (175 / 440) * 420 } });
      });
      await waitFor(() => screen.getByTestId('bodymap-sheet'));
      await fireEvent.press(screen.getByTestId('bodymap-intensity-6'));
      await fireEvent.press(screen.getByTestId('bodymap-feel-aching'));
      await fireEvent.press(screen.getByTestId('bodymap-onset-days'));
      await fireEvent.press(screen.getByTestId('bodymap-sheet-save'));
      expect(screen.queryByTestId('bodymap-sheet')).toBeNull();
      expect(screen.getByTestId('bodymap-row-m1')).toBeTruthy();

      // List fallback on the organs layer.
      await fireEvent.press(screen.getByTestId('bodymap-layer-organs'));
      await fireEvent.press(screen.getByTestId('bodymap-open-list'));
      await fireEvent.press(screen.getByTestId('bodymap-list-front-upper_abdomen_right'));
      await waitFor(() => screen.getByTestId('bodymap-sheet'));
      await fireEvent.press(screen.getByTestId('bodymap-sheet-close'));
      expect(screen.getByTestId('bodymap-row-m2')).toBeTruthy();

      // Remove via the pin.
      await fireEvent.press(screen.getByTestId('bodymap-pin-m2'));
      await fireEvent.press(screen.getByTestId('bodymap-sheet-remove'));
      expect(screen.queryByTestId('bodymap-row-m2')).toBeNull();

      await act(async () => {
        await fireEvent.press(screen.getByTestId('bodymap-continue'));
      });
      await waitFor(() => screen.getByTestId('intake-step-chat'));
      await fireEvent.changeText(screen.getByTestId('intake-chat-input'), lng === 'es' ? 'Me duele el brazo' : 'My arm hurts');
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-chat-send'));
      });
      await act(async () => {
        await fireEvent.press(screen.getByTestId('intake-chat-finish'));
      });
      await waitFor(() => screen.getByTestId('intake-summary-body-map'));
      const expected =
        lng === 'es'
          ? '• Marcado por el paciente: Capa de piel, Antebrazo izquierdo, intensidad 6/10, “molestia constante”, inicio: hace unos días'
          : '• Patient marked: Skin layer, Left forearm, intensity 6/10, “aching”, started: a few days ago';
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getAllByTestId('intake-static-emergency-notice')).toHaveLength(1);
      void client;
    });
  }

  it('skipping the body map goes straight to the chat and sends nothing', async () => {
    const client = await openBodyMap('en');
    const submit = jest.spyOn(client, 'submitBodyPainMap' as any);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('bodymap-skip'));
    });
    await waitFor(() => screen.getByTestId('intake-step-chat'));
    expect(submit).not.toHaveBeenCalled();
  });

  it('closing on the body map step asks before discarding', async () => {
    await openBodyMap('en');
    await fireEvent.press(screen.getByTestId('intake-close'));
    expect(screen.getByTestId('intake-leave-dialog')).toBeTruthy();
  });
});
