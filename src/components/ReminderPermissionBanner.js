import React, { useEffect, useState } from 'react';
import { AppState, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ensureReminderPermission, subscribeReminderPermission } from '../services/reminderNotifications';
import { USING_EXPO_GO } from '../utils/appStartup';

export default function ReminderPermissionBanner() {
  const { t } = useTranslation();
  const [granted, setGranted] = useState(null);
  useEffect(() => {
    if (USING_EXPO_GO) return;
    let active = true;
    const update = value => { if (active) setGranted(value); };
    const check = () => ensureReminderPermission(false).then(update)
      .catch(error => console.warn('[Reminders] permission check failed', error));
    const unsubscribe = subscribeReminderPermission(update);
    check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { active = false; unsubscribe(); subscription.remove(); };
  }, []);
  if (granted !== false) return null;
  return (
    <View style={{ backgroundColor: '#142238', borderColor: '#D4AF3755', borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 }}>
      <Text style={{ color: '#E6D8B5', fontSize: 12 }}>{t('ui.reminderNotificationsOff')}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => Linking.openSettings().catch(error => console.warn('[Reminders] settings unavailable', error))} style={{ paddingVertical: 8, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: '600' }}>{t('ui.openNotificationSettings')}</Text>
      </TouchableOpacity>
    </View>
  );
}
