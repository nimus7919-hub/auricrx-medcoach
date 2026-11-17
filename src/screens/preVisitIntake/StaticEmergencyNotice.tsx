import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { intakeStyles, useIntakePalette } from './intakeTheme';

/**
 * STATIC emergency notice — compliance invariant (COFEPRIS / FDA, PR #35 §3).
 * Takes NO props on purpose: it can never depend on what the patient types, on model output,
 * or on any session state. Every intake screen renders it through IntakeFrame. Do not add
 * conditional logic here. See src/services/__tests__/preVisitIntakeNotice.test.tsx.
 */
export default function StaticEmergencyNotice() {
  const { t } = useTranslation();
  const p = useIntakePalette();
  return (
    <View
      testID="intake-static-emergency-notice"
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('preVisitIntake.emergencyNoticeLabel')}
      style={{ borderWidth: 1.5, borderColor: p.gold, borderRadius: 14, padding: 12, marginBottom: 14, backgroundColor: p.muted }}
    >
      <Text style={[intakeStyles.small, { color: p.text, fontWeight: '600' }]}>{t('preVisitIntake.emergencyNotice')}</Text>
    </View>
  );
}
