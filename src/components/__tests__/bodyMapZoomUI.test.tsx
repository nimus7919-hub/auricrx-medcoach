import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import BodyMap from '../bodyMap/BodyMap';
import { presetCamera } from '../bodyMap/zoomCamera';
import { viewBoxToCanvas } from '../bodyMap/regions';
import { toBodyPainMapPayload } from '../bodyMap/payload';
import type { BodyPainMarker } from '../bodyMap/types';

async function makeI18n(lng: 'en' | 'es') {
  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({ lng, fallbackLng: 'en', resources: { en: { translation: en }, es: { translation: es } }, interpolation: { escapeValue: false } });
  return inst;
}

const canvas = { width: 200, height: 440 };

async function mount(lng: 'en' | 'es' = 'en') {
  const i18n = await makeI18n(lng);
  const onChange = jest.fn<void, [BodyPainMarker[]]>();
  await render(
    <I18nextProvider i18n={i18n}>
      <BodyMap onChange={onChange} inlineSheet />
    </I18nextProvider>
  );
  return onChange;
}

const tap = async (x: number, y: number) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId('bodymap-canvas'), { nativeEvent: { locationX: x, locationY: y } });
  });
};

describe('body map zoom controls', () => {
  it('labels every zoom control and close-up for screen readers', async () => {
    await mount('es');
    expect(screen.getByLabelText('Acercar')).toBeTruthy();
    expect(screen.getByLabelText('Alejar')).toBeTruthy();
    expect(screen.getByLabelText('Acercar tu mano izquierda')).toBeTruthy();
    expect(screen.getByText('Pie derecho')).toBeTruthy();
    // The list fallback is still offered.
    expect(screen.getByTestId('bodymap-open-list')).toBeTruthy();
  });

  it('a close-up shows the reset button; reset returns to the whole body', async () => {
    await mount();
    expect(screen.queryByTestId('bodymap-zoom-reset')).toBeNull();
    await fireEvent.press(screen.getByTestId('bodymap-closeup-hand_left'));
    expect(screen.getByTestId('bodymap-zoom-reset')).toBeTruthy();
    expect(screen.getByLabelText('Reset zoom and show the whole body')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('bodymap-zoom-reset'));
    expect(screen.queryByTestId('bodymap-zoom-reset')).toBeNull();
    await fireEvent.press(screen.getByTestId('bodymap-zoom-in'));
    expect(screen.getByTestId('bodymap-zoom-reset')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('bodymap-zoom-out'));
    expect(screen.queryByTestId('bodymap-zoom-reset')).toBeNull();
  });

  it('a tap while zoomed in on a close-up stores the exact full-body position and region', async () => {
    const onChange = await mount();
    await fireEvent.press(screen.getByTestId('bodymap-closeup-hand_left'));
    const cam = presetCamera('hand_left', 'front');
    const pos = viewBoxToCanvas(170, 236, canvas, cam);
    await tap(pos.left, pos.top);
    await waitFor(() => screen.getByTestId('bodymap-sheet'));
    const markers = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(markers).toHaveLength(1);
    expect(markers[0].regionId).toBe('hand_left');
    expect(markers[0].x).toBeCloseTo(170, 3);
    expect(markers[0].y).toBeCloseTo(236, 3);
    const payload = toBodyPainMapPayload(markers, { locale: 'en', t: ((k: string) => k) as any })!;
    expect(payload.markers[0].position.x).toBeCloseTo(0.85, 3);
    expect(payload.markers[0].position.y).toBeCloseTo(236 / 440, 3);
    // Pins keep a 44pt touch target while zoomed.
    await fireEvent.press(screen.getByTestId('bodymap-sheet-close'));
    const pin = screen.getByTestId(`bodymap-pin-${markers[0].id}`);
    expect(pin.props.style).toMatchObject({ width: 44, height: 44 });
  });

  it('a double tap zooms in instead of placing a marker', async () => {
    const onChange = await mount();
    await tap(100, 300);
    await tap(102, 302);
    expect(screen.getByTestId('bodymap-zoom-reset')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.queryByTestId('bodymap-sheet')).toBeNull();
    const last = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] ?? [];
    expect(last).toHaveLength(0);
  });
});
