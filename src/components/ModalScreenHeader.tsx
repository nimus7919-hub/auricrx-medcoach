import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DynamicText from './DynamicText';

type Props = {
  title: string;
  onClose: () => void;
  /** Defaults to t('common.close') — e.g. "Cerrar" / "Close" */
  closeLabel?: string;
  backgroundColor?: string;
  borderBottomColor?: string;
  closeColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Title + close header for modal/feature screens.
 * Applies top safe-area inset so Android edge-to-edge does not draw under the status bar.
 */
export default function ModalScreenHeader({
  title,
  onClose,
  closeLabel,
  backgroundColor,
  borderBottomColor,
  closeColor = '#DBB65C',
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const label = closeLabel || t('common.close');

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, 0) + 12,
          backgroundColor,
          borderBottomColor,
        },
        style,
      ]}
    >
      <DynamicText type="card" style={styles.title}>
        {title}
      </DynamicText>
      <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
        <DynamicText type="card" style={[styles.closeButton, { color: closeColor }]}>
          {label}
        </DynamicText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold', flex: 1, paddingRight: 12 },
  closeButton: { fontSize: 16 },
});
