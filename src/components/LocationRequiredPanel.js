import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { vip } from '../theme/vip';

/**
 * Shown when pharmacy/lab search cannot run because location is off or denied.
 */
export default function LocationRequiredPanel({ onRetry, style }) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="summary"
      style={[{
        backgroundColor: '#142238',
        borderColor: vip.colors.gold + '88',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        gap: 10,
      }, style]}
    >
      <Text style={{ color: vip.colors.gold, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
        {t('locationSearch.locationOffTitle')}
      </Text>
      <Text style={{ color: '#E6D8B5', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>
        {t('locationSearch.locationOffMessage')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => Linking.openSettings().catch(() => {})}
          style={{
            backgroundColor: vip.colors.gold,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: vip.colors.navy, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
            {t('locationSearch.openSettings')}
          </Text>
        </TouchableOpacity>
        {typeof onRetry === 'function' && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onRetry}
            style={{
              borderColor: vip.colors.gold,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: vip.colors.gold, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
              {t('locationSearch.retry')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
