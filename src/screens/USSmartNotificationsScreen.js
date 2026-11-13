import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { readSmart, updateSmart, reconcileSmart, suggestions } from '../services/smartNotificationEngine';
import { ensureReminderPermission, reconcileReminderNotifications } from '../services/reminderNotifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
export default function USSmartNotificationsScreen({ onClose, meds = [], reminders = [], setMeds, setReminders }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const tr = (key, values = {}) => t(`usSmart.${key}`, { lng: 'en', ...values });
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; readSmart().then(value => { if (active) setState(value); }).catch(() => setError(tr('error'))); return () => { active = false; }; }, []);
  const run = async action => { setBusy(true); setError(''); try { await action(); setState(await readSmart()); } catch { setError(tr('error')); } finally { setBusy(false); } };
  const save = async patch => { await updateSmart(patch); await reconcileSmart(meds, reminders); await reconcileReminderNotifications(reminders); };
  const text = { color: '#F1F1F1', fontSize: 15, marginVertical: 8 };
  const button = (label, action) => <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => run(action)} style={{ paddingVertical: 14 }}><Text style={{ color: '#D4AF37' }}>{label}</Text></TouchableOpacity>;
  const input = (label, value, onChangeText, numeric = false) => <View><Text style={text}>{label}</Text><TextInput accessibilityLabel={label} value={String(value ?? '')} onChangeText={onChangeText} keyboardType={numeric ? 'decimal-pad' : 'default'} style={{ color: 'white', borderColor: '#D4AF37', borderWidth: 1, padding: 12, borderRadius: 8 }} /></View>;
  return <ScrollView style={{ flex: 1, backgroundColor: '#101B2A' }} contentContainerStyle={{ padding: 22, paddingTop: Math.max(insets.top, 0) + 12, paddingBottom: FAB_SCROLL_PADDING }} keyboardShouldPersistTaps="handled">
    {button(tr('back'), onClose)}<Text style={[text, { fontSize: 24 }]}>{tr('title')}</Text><Text style={text}>{tr('local')}</Text>
    {!!error && <Text accessibilityRole="alert" style={text}>{error}</Text>}
    {!state ? <ActivityIndicator /> : <>
      {button(tr('permission'), async () => { if (!await ensureReminderPermission(true)) setError(tr('denied')); })}
      {['refill', 'timing', 'quiet'].map(key => { const field = key === 'quiet' ? 'context' : key; return <View key={key} style={{ paddingVertical: 12 }}><Text style={text}>{tr(key)}</Text><Switch accessibilityLabel={tr(key)} disabled={busy} value={!!state[field]} onValueChange={value => run(() => save({ [field]: value }))} />{key !== 'quiet' && <Text style={text}>{tr(`${key}Detail`)}</Text>}</View>; })}
      {[3, 5, 7].map(days => <View key={days}>{button(`${state.lead === days ? '[x] ' : '[ ] '}${tr('lead', { days })}`, () => save({ lead: days }))}</View>)}
      {meds.map(med => <View key={med.id}><Text style={text}>{med.name}</Text>{input(tr('quantity'), med.remainingQuantity, value => setMeds(prev => prev.map(m => m.id === med.id ? { ...m, remainingQuantity: value } : m)), true)}{input(tr('units'), med.unitsPerDose, value => setMeds(prev => prev.map(m => m.id === med.id ? { ...m, unitsPerDose: value } : m)), true)}</View>)}
      {suggestions(state, reminders).map(item => <View key={item.reminder.id}><Text style={text}>{tr('suggestion', { name: item.reminder.name, time: item.time })}</Text>{button(tr('accept'), async () => { const next = reminders.map(r => r.id === item.reminder.id ? { ...r, time: item.time } : r); setReminders(next); await updateSmart({ reminders: next }); await reconcileReminderNotifications(next); await reconcileSmart(meds, next); })}{button(tr('dismiss'), () => updateSmart(latest => { latest.dismissed[item.reminder.id] = item.reminder.time; return latest; }))}</View>)}
      {input(tr('from'), state.quietStart, value => setState(prev => ({ ...prev, quietStart: value })))}{input(tr('until'), state.quietEnd, value => setState(prev => ({ ...prev, quietEnd: value })))}
      {button(tr('save'), async () => { if (![state.quietStart, state.quietEnd].every(value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))) { setError(tr('invalidTime')); return; } await save({ quietStart: state.quietStart, quietEnd: state.quietEnd }); })}
    </>}
  </ScrollView>;
}
