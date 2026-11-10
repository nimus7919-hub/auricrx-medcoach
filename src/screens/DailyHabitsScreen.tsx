import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import DailyHabitsService, { HabitEntry } from '../services/dailyHabitsService';
import HealthConnectService, { HEALTH_CONNECT_ENABLED } from '../services/healthConnectService';

const MOOD_EMOJIS = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  bad: '😟',
  terrible: '😢',
};

export default function DailyHabitsScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  
  const [todayEntry, setTodayEntry] = useState<HabitEntry | null>(null);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [showHealthConnectModal, setShowHealthConnectModal] = useState(false);
  const [healthConnectEnabled, setHealthConnectEnabled] = useState(false);
  const [healthConnectPermitted, setHealthConnectPermitted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [steps, setSteps] = useState('');
  const [sweetDrinks, setSweetDrinks] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad' | 'terrible'>('good');
  const [notes, setNotes] = useState('');
  
  const habitsService = DailyHabitsService.getInstance();
  const healthConnectService = HealthConnectService.getInstance();

  useEffect(() => {
    loadData();
    checkHealthConnect();
  }, []);

  const loadData = async () => {
    const today = await habitsService.getTodayEntry();
    const allEntries = await habitsService.getEntries();
    setTodayEntry(today);
    setEntries(allEntries);
    
    if (today) {
      setWaterGlasses(today.water || 0);
      setSleepHours(today.sleep?.toString() || '');
      setSteps(today.steps?.toString() || '');
      setSweetDrinks(today.sweetDrinks?.toString() || '');
      setMood(today.mood || 'good');
      setNotes(today.notes || '');
    }
  };

  const checkHealthConnect = async () => {
    if (!HEALTH_CONNECT_ENABLED) {
      setHealthConnectEnabled(false);
      return;
    }
    
    const available = healthConnectService.isAvailable();
    setHealthConnectEnabled(available);
    
    if (available) {
      const permitted = await healthConnectService.checkPermissions();
      setHealthConnectPermitted(permitted);
      
      const consent = await habitsService.getHealthConnectConsent();
      if (consent.granted && permitted) {
        await syncHealthConnectData();
      }
    }
  };

  const handleRequestHealthConnect = async () => {
    setShowHealthConnectModal(true);
  };

  const handleGrantHealthConnect = async () => {
    setShowHealthConnectModal(false);
    setSyncing(true);
    
    try {
      const granted = await healthConnectService.requestPermissions();
      if (granted) {
        await habitsService.grantHealthConnectConsent();
        setHealthConnectPermitted(true);
        await syncHealthConnectData();
        Alert.alert(t('dailyHabits.success'), t('dailyHabits.healthConnectGranted'));
      } else {
        Alert.alert(t('common.error'), t('dailyHabits.healthConnectDenied'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('dailyHabits.healthConnectError'));
    } finally {
      setSyncing(false);
    }
  };

  const syncHealthConnectData = async () => {
    try {
      const data = await healthConnectService.syncTodayData();
      
      if (data.steps !== undefined) {
        setSteps(data.steps.toString());
      }
      
      if (data.sleepHours !== undefined) {
        setSleepHours(data.sleepHours.toFixed(1));
      }
    } catch (error) {
      console.error('Error syncing Health Connect data:', error);
    }
  };

  const handleSaveEntry = async () => {
    const entry: Omit<HabitEntry, 'id'> = {
      date: new Date().toISOString(),
      water: waterGlasses > 0 ? waterGlasses : undefined,
      sleep: sleepHours ? parseFloat(sleepHours) : undefined,
      steps: steps ? parseInt(steps, 10) : undefined,
      sweetDrinks: sweetDrinks ? parseInt(sweetDrinks, 10) : undefined,
      mood,
      notes: notes.trim() || undefined,
    };

    await habitsService.saveEntry(entry);
    Alert.alert(t('dailyHabits.success'), t('dailyHabits.entrySaved'));
    loadData();
  };

  const weekEntries = entries.slice(0, 7);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('dailyHabits.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('dailyHabits.today')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('dailyHabits.todayDescription')}</DynamicText>
          
          {healthConnectEnabled && !healthConnectPermitted && (
            <TouchableOpacity
              style={[styles.healthConnectBanner, { backgroundColor: getCardBorderColor() }]}
              onPress={handleRequestHealthConnect}
            >
              <DynamicText type="card" style={styles.healthConnectText}>
                🔗 {t('dailyHabits.enableHealthConnect')}
              </DynamicText>
            </TouchableOpacity>
          )}

          {healthConnectPermitted && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: getCardBorderColor() }]}
              onPress={syncHealthConnectData}
              disabled={syncing}
            >
              <DynamicText type="button" style={styles.buttonText}>
                {syncing ? t('dailyHabits.syncing') : t('dailyHabits.syncHealthConnect')}
              </DynamicText>
            </TouchableOpacity>
          )}

          <View style={styles.habitRow}>
            <DynamicText type="card" style={styles.habitLabel}>💧 {t('dailyHabits.water')}</DynamicText>
            <View style={styles.waterButtons}>
              <TouchableOpacity
                style={[styles.waterButton, { borderColor: getCardBorderColor() }]}
                onPress={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
              >
                <DynamicText type="card" style={styles.waterButtonText}>-</DynamicText>
              </TouchableOpacity>
              <DynamicText type="card" style={styles.waterCount}>{waterGlasses} {t('dailyHabits.glasses')}</DynamicText>
              <TouchableOpacity
                style={[styles.waterButton, { borderColor: getCardBorderColor() }]}
                onPress={() => setWaterGlasses(waterGlasses + 1)}
              >
                <DynamicText type="card" style={styles.waterButtonText}>+</DynamicText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.habitRow}>
            <DynamicText type="card" style={styles.habitLabel}>😴 {t('dailyHabits.sleep')}</DynamicText>
            <TextInput
              style={[styles.habitInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('dailyHabits.hours')}
              placeholderTextColor="#999"
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.habitRow}>
            <DynamicText type="card" style={styles.habitLabel}>👟 {t('dailyHabits.steps')}</DynamicText>
            <TextInput
              style={[styles.habitInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('dailyHabits.stepsCount')}
              placeholderTextColor="#999"
              value={steps}
              onChangeText={setSteps}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.habitRow}>
            <DynamicText type="card" style={styles.habitLabel}>🥤 {t('dailyHabits.sweetDrinks')}</DynamicText>
            <TextInput
              style={[styles.habitInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('dailyHabits.drinkCount')}
              placeholderTextColor="#999"
              value={sweetDrinks}
              onChangeText={setSweetDrinks}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.moodSection}>
            <DynamicText type="card" style={styles.habitLabel}>{t('dailyHabits.mood')}</DynamicText>
            <View style={styles.moodButtons}>
              {Object.entries(MOOD_EMOJIS).map(([key, emoji]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.moodButton,
                    { borderColor: getCardBorderColor() },
                    mood === key && { backgroundColor: getAccentColor() + '40', borderWidth: 2 },
                  ]}
                  onPress={() => setMood(key as any)}
                >
                  <DynamicText type="card" style={styles.moodEmoji}>{emoji}</DynamicText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={[styles.notesInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
            placeholder={t('dailyHabits.notes')}
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: getAccentColor() }]}
            onPress={handleSaveEntry}
          >
            <DynamicText type="button" style={styles.buttonText}>{t('dailyHabits.save')}</DynamicText>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('dailyHabits.weekSummary')}</DynamicText>
          
          {weekEntries.length === 0 && (
            <DynamicText type="card" style={styles.emptyText}>{t('dailyHabits.noEntries')}</DynamicText>
          )}

          {weekEntries.map(entry => (
            <View key={entry.id} style={[styles.entryCard, { borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={styles.entryDate}>
                {new Date(entry.date).toLocaleDateString()}
              </DynamicText>
              <View style={styles.entryStats}>
                {entry.water && <DynamicText type="card" style={styles.entryStat}>💧 {entry.water}</DynamicText>}
                {entry.sleep && <DynamicText type="card" style={styles.entryStat}>😴 {entry.sleep}h</DynamicText>}
                {entry.steps && <DynamicText type="card" style={styles.entryStat}>👟 {entry.steps}</DynamicText>}
                {entry.sweetDrinks && <DynamicText type="card" style={styles.entryStat}>🥤 {entry.sweetDrinks}</DynamicText>}
                {entry.mood && <DynamicText type="card" style={styles.entryStat}>{MOOD_EMOJIS[entry.mood]}</DynamicText>}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.infoTitle}>💡 {t('dailyHabits.sweetDrinksInfo')}</DynamicText>
          <DynamicText type="card" style={styles.infoText}>{t('dailyHabits.sweetDrinksDescription')}</DynamicText>
        </View>
      </ScrollView>

      <Modal visible={showHealthConnectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('dailyHabits.healthConnectTitle')}</DynamicText>
            <DynamicText type="card" style={styles.modalDescription}>{t('dailyHabits.healthConnectDescription')}</DynamicText>
            <DynamicText type="card" style={styles.modalDisclaimer}>{t('dailyHabits.healthConnectDisclaimer')}</DynamicText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowHealthConnectModal(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleGrantHealthConnect}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('dailyHabits.grant')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 16, color: '#DBB65C' },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sectionDescription: { fontSize: 14, opacity: 0.8, marginBottom: 16, lineHeight: 20 },
  emptyText: { fontSize: 14, opacity: 0.6, fontStyle: 'italic' },
  healthConnectBanner: { borderRadius: 8, padding: 12, marginBottom: 16 },
  healthConnectText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  syncButton: { borderRadius: 8, padding: 12, marginBottom: 16 },
  habitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  habitLabel: { fontSize: 16, fontWeight: '600', flex: 1 },
  habitInput: { borderWidth: 1, borderRadius: 8, padding: 10, width: 120, textAlign: 'center', fontSize: 16 },
  waterButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waterButton: { borderWidth: 1, borderRadius: 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  waterButtonText: { fontSize: 20, fontWeight: 'bold' },
  waterCount: { fontSize: 16, fontWeight: '600', minWidth: 80, textAlign: 'center' },
  moodSection: { marginBottom: 16 },
  moodButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  moodButton: { borderWidth: 1, borderRadius: 8, padding: 12, minWidth: 50, alignItems: 'center' },
  moodEmoji: { fontSize: 24 },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  button: { borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  entryCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  entryDate: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  entryStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryStat: { fontSize: 14 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  infoText: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 12, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalDescription: { fontSize: 14, marginBottom: 12, opacity: 0.9, lineHeight: 20 },
  modalDisclaimer: { fontSize: 12, opacity: 0.7, marginBottom: 20, fontStyle: 'italic', lineHeight: 18 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
});
