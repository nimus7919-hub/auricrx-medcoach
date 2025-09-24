import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';

// Reminders component moved outside App to prevent remounting
const Reminders = ({ theme, reminders, setReminders, S, themeKey, onNavigateToDashboard, onNavigateToSettings }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  useEffect(() => {
    mounted.current += 1;
    console.log(`[REMINDERS] MOUNT #${mounted.current}`);
    return () => console.log(`[REMINDERS] UNMOUNT #${mounted.current}`);
  }, []);

  // Keyboard handling to prevent modal closing when input is focused
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setInputFocused(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setInputFocused(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const reminderNameRef = useRef(null);

  const onPick = (_, date) => {
    setShowPicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2,'0');
      const mm = String(date.getMinutes()).padStart(2,'0');
      setTime(`${hh}:${mm}`);
    }
  };

  // Schedule reminder notification function
  const scheduleReminderNotification = async (name, time24h) => {
    // time24h like "13:45"
    const [hh, mm] = (time24h || '').split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

    const now = new Date();
    const fire = new Date(now);
    fire.setHours(hh, mm, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1); // schedule for tomorrow if time already passed

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: name || 'Time to take your medication',
          sound: 'default',
        },
        trigger: fire, // exact datetime
      });
    } catch (e) {
      console.log('schedule error', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header with AuricRX home button */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.chip
      }}>
        <TouchableOpacity 
          onPress={onNavigateToDashboard} 
          style={{
            padding: 0,
            backgroundColor: 'transparent',
            marginLeft: -65,
          }}
        >
          <Image 
            source={require('../assets/AuricRX_home_button_across_screens.png')} 
            style={{
              width: 180,
              height: 70,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={{ 
          color: theme.text, 
          fontSize: 18, 
          fontFamily: 'Inter_800ExtraBold', 
          position: 'absolute', 
          left: '50%', 
          transform: [{ translateX: -50 }], 
          maxWidth: '60%' 
        }} numberOfLines={1}>
          {S.reminders}
        </Text>

        <TouchableOpacity onPress={onNavigateToSettings} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.form, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
          <TextInput 
            ref={reminderNameRef}
            placeholder={S.namePlaceholder} 
            placeholderTextColor={getCardTextColor() + '80'} 
            style={[styles.input, { color: getCardTextColor(), borderColor: getCardBorderColor(), fontFamily: 'Inter_400Regular' }]} 
            value={name} 
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <TouchableOpacity onPress={()=>setShowPicker(true)} style={[styles.input,{ justifyContent:'center' }]}> 
            <DynamicText type="card">{time || 'Time'}</DynamicText>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker value={new Date()} mode="time" is24Hour display="default" onChange={onPick} />
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accent + 'CC' }]}
            onPress={async () => {
              if (!name || !time) return;
              const newItem = { id: `${Date.now()}`, name, time };
              setReminders(r => [...r, newItem]);
              await scheduleReminderNotification(name, time);
              setName(''); setTime('');
            }}>
            <DynamicText type="card" style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{S.addReminder}</DynamicText>
          </TouchableOpacity>
        </View>
        {reminders.map(r => (
          <View key={r.id} style={[styles.row, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_700Bold' }}>{r.time}</DynamicText>
            <DynamicText type="card" style={{ flex: 1, marginLeft: 12, fontFamily: 'Inter_400Regular' }}>{r.name}</DynamicText>
            <TouchableOpacity onPress={() => setReminders((all) => all.filter(x => x.id !== r.id))}>
              <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>✕</DynamicText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { 
    borderWidth: 2, 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 16 
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    fontSize: 16 
  },
  btn: { 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  btnText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  row: { 
    borderWidth: 2, 
    padding: 12, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 12
  },
});

export default Reminders;
