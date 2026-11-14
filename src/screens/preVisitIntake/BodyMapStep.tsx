import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import BodyMap from '../../components/bodyMap/BodyMap';
import type { BodyMapState } from '../../components/bodyMap/markersReducer';
import { toBodyPainMapPayload } from '../../components/bodyMap/payload';
import type { BodyPainMarker } from '../../components/bodyMap/types';
import type { PreVisitIntakeClient } from '../../services/preVisitIntake/types';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';

interface Props {
  client: PreVisitIntakeClient;
  sessionId: string;
  locale: 'en' | 'es';
  /** Called after the map was saved (continue) or skipped. Never blocks the intake. */
  onDone: () => void;
  /** Previews / tests only. */
  initialState?: Partial<BodyMapState>;
  initialEditingId?: string | null;
  inlineSheet?: boolean;
}

/**
 * Optional intake step (flag EXPO_PUBLIC_FEATURE_BODY_PAIN_MAP): the patient marks where it hurts
 * on a layered body. Rendered inside IntakeFrame, so the static emergency notice stays visible.
 * Only the patient's own marks and words are stored; nothing is interpreted.
 */
export default function BodyMapStep({ client, sessionId, locale, onDone, initialState, initialEditingId, inlineSheet }: Props) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const [markers, setMarkers] = useState<BodyPainMarker[]>(initialState?.markers ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (skip: boolean) => {
    if (busy) return;
    setError(false);
    const payload = skip ? null : toBodyPainMapPayload(markers, { locale, t: (k, o) => String(t(k, o as any)) });
    if (!payload || !client.submitBodyPainMap) {
      onDone();
      return;
    }
    setBusy(true);
    try {
      await client.submitBodyPainMap(sessionId, payload);
      onDone();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View testID="intake-body-map">
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('bodyMap.title')}</Text>
      <Text style={[intakeStyles.subtitle, { color: p.sub }]}>{t('bodyMap.subtitle')}</Text>
      <BodyMap palette={p} initialState={initialState} initialEditingId={initialEditingId} inlineSheet={inlineSheet} onChange={setMarkers} canvasHeight={420} />
      <View style={{ borderLeftWidth: 3, borderLeftColor: p.gold, paddingLeft: 10, marginTop: 10, marginBottom: 6 }}>
        <Text testID="bodymap-descriptive-note" style={[intakeStyles.small, { color: p.sub }]}>{t('bodyMap.descriptiveNote')}</Text>
      </View>
      {error ? <Text style={[intakeStyles.small, { color: p.accent, marginTop: 6 }]}>{t('bodyMap.saveError')}</Text> : null}
      <IntakePrimaryButton
        testID="bodymap-continue"
        label={markers.length ? t('bodyMap.continueWith', { count: markers.length }) : t('bodyMap.continue')}
        disabled={busy}
        onPress={() => submit(false)}
      />
      <IntakeSecondaryButton testID="bodymap-skip" label={t('bodyMap.skip')} disabled={busy} onPress={() => submit(true)} />
    </View>
  );
}
