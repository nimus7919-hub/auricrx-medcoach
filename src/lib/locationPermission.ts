import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

// Called only by a foreground search initiated by the user.
export async function requestSearchLocationPermission(): Promise<{ status: string }> {
  const message = 'Usamos tu ubicación solo para esta búsqueda de farmacias o laboratorios. Se envía a Google Places para responder, no se guarda ni activa seguimiento o avisos por proximidad. / We use your location only for this pharmacy or lab search. It is sent to Google Places to answer, and is not stored or used for tracking or proximity alerts.';
  const accepted = Platform.OS === 'web'
    ? globalThis.confirm(message)
    : await new Promise<boolean>(resolve => Alert.alert('Ubicación / Location', message, [
      { text: 'Cancelar / Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continuar / Continue', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }));
  return accepted ? Location.requestForegroundPermissionsAsync() : { status: 'denied' };
}
