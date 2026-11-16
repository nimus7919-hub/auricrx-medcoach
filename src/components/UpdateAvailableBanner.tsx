import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { gold, darkColors } from '../theme/colors';

export type UpdateAvailableBannerKind = 'ota' | 'store';

interface UpdateAvailableBannerProps {
  visible: boolean;
  kind: UpdateAvailableBannerKind;
  title: string;
  message: string;
  updateLabel: string;
  laterLabel: string;
  onUpdate: () => void;
  onLater: () => void;
}

/**
 * Non-blocking bottom banner: the rest of the app stays usable.
 * Navy card, gold border and primary button. No new icons.
 */
export default function UpdateAvailableBanner({
  visible,
  kind,
  title,
  message,
  updateLabel,
  laterLabel,
  onUpdate,
  onLater,
}: UpdateAvailableBannerProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay} testID="update-available-banner">
      <View
        pointerEvents="auto"
        style={[styles.card, { marginBottom: Math.max(insets.bottom, 16) + 8 }]}
        accessibilityRole="alert"
        accessibilityLabel={title}
      >
        <View style={styles.goldEdge} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} testID={`update-available-message-${kind}`}>
          {message}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={laterLabel}
            onPress={onLater}
            style={styles.laterButton}
            activeOpacity={0.8}
            testID="update-available-later"
          >
            <Text style={styles.laterLabel}>{laterLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={updateLabel}
            onPress={onUpdate}
            style={styles.updateButton}
            activeOpacity={0.85}
            testID="update-available-update"
          >
            <LinearGradient
              colors={[gold.a200, gold.y400, gold.a500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.updateGradient}
            >
              <Text style={styles.updateLabel}>{updateLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 50,
    elevation: 50,
  },
  card: {
    backgroundColor: darkColors.card,
    borderColor: darkColors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  goldEdge: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: gold.y400,
    marginBottom: 12,
  },
  title: {
    color: gold.hi,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: darkColors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.95,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  laterButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.muted,
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterLabel: {
    color: gold.a200,
    fontSize: 15,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateLabel: {
    color: darkColors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});
