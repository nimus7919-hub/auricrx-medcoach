import React from 'react';
import { Text, View } from 'react-native';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

/** In-screen confirmation (works on native and web, unlike Alert on react-native-web). */
export default function ConfirmDialog({ visible, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, testID }: Props) {
  const p = useIntakePalette();
  if (!visible) return null;
  return (
    <View
      testID={testID}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,14,27,0.72)', justifyContent: 'center', padding: 24 }}
    >
      <View style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={[intakeStyles.title, { color: p.text }]}>{title}</Text>
        <Text style={[intakeStyles.body, { color: p.sub }]}>{body}</Text>
        <IntakePrimaryButton testID={testID ? `${testID}-confirm` : undefined} label={confirmLabel} onPress={onConfirm} />
        <IntakeSecondaryButton testID={testID ? `${testID}-cancel` : undefined} label={cancelLabel} onPress={onCancel} />
      </View>
    </View>
  );
}
