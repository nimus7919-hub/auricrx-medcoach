import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MedicationRow from './components/MedicationRow';
import { extractMedsFromImage } from './services/ocr';
import { findNearbyPharmacies } from './services/pharmacy';

const STORAGE_KEY = 'AURICRX_MEDS';

export default function App() {
  const [meds, setMeds] = useState([]);
  const [busy, setBusy] = useState(false);

  // Load saved meds on boot
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setMeds(JSON.parse(raw));
    })();
  }, []);

  const saveMeds = useCallback(async (next) => {
    setMeds(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Add manually placeholder (you can route to a form screen later)
  const addManual = () => {
    Alert.alert('Add manually', 'We will add the manual form next. For now, try Add from photo 📷');
  };

  // Take or pick a photo, run OCR, let user confirm, then save
  const addFromPhoto = async () => {
    try {
      setBusy(true);

      // Ask permissions
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        setBusy(false);
        return Alert.alert('Camera permission needed', 'Please allow camera to scan your prescription.');
      }

      // Let the user choose: camera or gallery (simple: we launch camera)
      const photo = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (photo.canceled) {
        setBusy(false);
        return;
      }

      const imageUri = photo.assets?.[0]?.uri;
      if (!imageUri) {
        setBusy(false);
        return Alert.alert('Could not get image');
      }

      // OCR -> array of med names (we’ll show a simple confirm for now)
      const detected = await extractMedsFromImage(imageUri);

      if (!detected?.length) {
        setBusy(false);
        return Alert.alert('No medications detected', 'Try a clearer photo, flat surface, good lighting.');
      }

      // Quick confirm (simple). Later we can present a review screen with toggles/times.
      Alert.alert(
        'Add these meds?',
        detected.join('\n'),
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setBusy(false) },
          {
            text: 'Add',
            onPress: async () => {
              const next = [
                ...meds,
                ...detected.map((name) => ({
                  id: `${Date.now()}-${Math.random()}`,
                  name,
                  time: null, // user can set later
                  createdAt: Date.now(),
                })),
              ];
              await saveMeds(next);
              setBusy(false);
            },
          },
        ],
        { cancelable: true }
      );
    } catch (e) {
      console.log('addFromPhoto error', e);
      setBusy(false);
      Alert.alert('Oops', 'Could not process that image.');
    }
  };

  const markTaken = async (id) => {
    const next = meds.map((m) => (m.id === id ? { ...m, lastTakenAt: Date.now() } : m));
    await saveMeds(next);
  };

  const missedFlow = async (name) => {
    // Keep your clinical logic here; for now show choices
    Alert.alert(
      `${name}: Missed dose`,
      'If it’s close to the scheduled time, you might still take it. Otherwise skip and resume at the next scheduled time. When unsure, consult your doctor.',
      [{ text: 'OK' }]
    );
  };

  const showPharmacies = async (name) => {
    try {
      setBusy(true);
      // Request GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setBusy(false);
        return Alert.alert('Location needed', 'Please allow location to search nearby pharmacies.');
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const results = await findNearbyPharmacies({
        medicineQuery: name,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setBusy(false);

      if (!results?.length) {
        return Alert.alert('No pharmacies found', 'Try a wider search or different spelling.');
      }

      // Simple listing via alert (you can render a map/list screen next)
      const top = results.slice(0, 5).map((r) => `${r.name} — ${r.distanceText || r.distanceMeters + 'm'}`).join('\n');
      Alert.alert('Nearby pharmacies', top);
    } catch (e) {
      console.log('showPharmacies error', e);
      setBusy(false);
      Alert.alert('Search error', 'Could not search pharmacies right now.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1117' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#bcd2ff', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Today’s Meds</Text>
        {busy && (
          <View style={{ paddingVertical: 6 }}>
            <ActivityIndicator />
          </View>
        )}

        {meds.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>Add them from a doctor’s note photo or enter manually.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {meds.map((m) => (
              <MedicationRow
                key={m.id}
                time={m.time ? m.time : '--:--'}
                name={m.name}
                onMark={() => markTaken(m.id)}
                onMissed={() => missedFlow(m.name)}
                onLocate={() => showPharmacies(m.name)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.action, { backgroundColor: '#2dd4bf' }]} onPress={addFromPhoto}>
          <Text style={styles.actionText}>Add from photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, { backgroundColor: '#3a7bfd' }]} onPress={addManual}>
          <Text style={styles.actionText}>Add manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: '#0f1a27',
    padding: 16,
    borderRadius: 16,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#9db4d6' },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  action: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#0b1117', fontWeight: '800', fontSize: 16 },
});
