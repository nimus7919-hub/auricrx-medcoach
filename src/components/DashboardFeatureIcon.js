import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/** Brand gold used across navy dashboard cards. */
export const FEATURE_ICON_GOLD = '#D4AF37';

/**
 * Thin gold line icons for home dashboard feature cards.
 * Circular badge (~52dp) with faint gold fill + thin gold ring.
 * OTA-safe: uses only @expo/vector-icons (already in the runtime).
 */
export const DASHBOARD_FEATURE_ICON_MAP = {
  smartAlerts: { set: 'ion', name: 'notifications-outline' },
  healthAnalytics: { set: 'ion', name: 'analytics-outline' },
  appointments: { set: 'ion', name: 'calendar-outline' },
  aiHealth: { set: 'ion', name: 'sparkles-outline' },
  documents: { set: 'ion', name: 'document-text-outline' },
  familyCircle: { set: 'ion', name: 'people-outline' },
  preventionPlanner: { set: 'ion', name: 'shield-checkmark-outline' },
  labOrganizer: { set: 'mci', name: 'flask-outline' },
  dailyHabits: { set: 'mci', name: 'calendar-check-outline' },
};

export const DASHBOARD_FEATURE_BADGE_SIZE = 52;
export const DASHBOARD_FEATURE_GLYPH_SIZE = 26;

export default function DashboardFeatureIcon({
  name,
  size = DASHBOARD_FEATURE_BADGE_SIZE,
  glyphSize = DASHBOARD_FEATURE_GLYPH_SIZE,
}) {
  const entry = DASHBOARD_FEATURE_ICON_MAP[name] || DASHBOARD_FEATURE_ICON_MAP.documents;
  const Icon = entry.set === 'mci' ? MaterialCommunityIcons : Ionicons;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Icon
        name={entry.name}
        size={glyphSize}
        color={FEATURE_ICON_GOLD}
        allowFontScaling={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF3766',
    backgroundColor: '#D4AF3714',
    overflow: 'visible',
  },
});
