import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StaticEmergencyNotice from './StaticEmergencyNotice';
import { intakeStyles, useIntakePalette } from './intakeTheme';

interface Props {
  step?: { current: number; total: number } | null;
  onClose: () => void;
  /** Chat uses its own scroll + composer, so it opts out of the frame ScrollView. */
  scroll?: boolean;
  children: React.ReactNode;
}

/** Shared chrome for EVERY intake screen. The static emergency notice is unconditional here. */
export default function IntakeFrame({ step, onClose, scroll = true, children }: Props) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  let insets = { top: 0, bottom: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    // no provider (tests / web preview) → zero insets
  }
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={[intakeStyles.label, { color: p.accent }]}>{t('preVisitIntake.title')}</Text>
        {step ? (
          <Text style={[intakeStyles.small, { color: p.sub }]}>
            {t('preVisitIntake.common.stepOf', { current: step.current, total: step.total })}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        testID="intake-close"
        accessibilityRole="button"
        onPress={onClose}
        style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: p.border }}
      >
        <Text style={{ color: p.text, fontWeight: '600' }}>{t('preVisitIntake.common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
  return (
    <LinearGradient colors={[p.bgStart, p.bgEnd]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) }}>
        {header}
        <StaticEmergencyNotice />
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
      </View>
    </LinearGradient>
  );
}
