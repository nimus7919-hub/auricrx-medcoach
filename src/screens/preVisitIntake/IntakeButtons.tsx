import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import PremiumButton from '../../components/PremiumButton';
import { intakeStyles, useIntakePalette } from './intakeTheme';

export function IntakePrimaryButton({ label, disabled, style, ...rest }: TouchableOpacityProps & { label: string }) {
  return (
    <PremiumButton {...rest} disabled={disabled} style={[intakeStyles.primaryButton, style, disabled ? { opacity: 0.5 } : null]}>
      <Text style={intakeStyles.primaryButtonText}>{label}</Text>
    </PremiumButton>
  );
}

export function IntakeSecondaryButton({ label, style, ...rest }: TouchableOpacityProps & { label: string }) {
  const p = useIntakePalette();
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} {...rest} style={[intakeStyles.secondaryButton, { borderColor: p.border }, style]}>
      <Text style={[intakeStyles.secondaryButtonText, { color: p.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}
