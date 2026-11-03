import uiI18n from "../i18n";
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'location_search_consent_v1';
let pendingConsent: Promise<boolean> | null = null;

export async function resetSearchLocationConsent(): Promise<void> {
  await AsyncStorage.removeItem(CONSENT_KEY);
}

async function ensureSearchConsent(): Promise<boolean> {
  if (await AsyncStorage.getItem(CONSENT_KEY)) return true;
  const message = uiI18n.t('locationSearch.disclosure');
  const accepted = Platform.OS === 'web'
    ? globalThis.confirm(message)
    : await new Promise<boolean>(resolve => Alert.alert(uiI18n.t('ui.ubicacionLocation'), message, [
      { text: uiI18n.t('ui.cancelarCancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: uiI18n.t('ui.continuarContinue'), onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }));
  if (accepted) {
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify({ acceptedAt: new Date().toISOString() }));
  }
  return accepted;
}

// Share consent across search entry points, including concurrent requests.
export async function requestSearchLocationPermission(): Promise<{ status: string }> {
  if (!pendingConsent) {
    pendingConsent = ensureSearchConsent().finally(() => { pendingConsent = null; });
  }
  const accepted = await pendingConsent;
  return accepted ? Location.requestForegroundPermissionsAsync() : { status: 'denied' };
}
