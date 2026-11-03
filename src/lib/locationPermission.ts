import uiI18n from "../i18n";
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

// Called only by a foreground search initiated by the user.
export async function requestSearchLocationPermission(): Promise<{ status: string }> {
  const message = uiI18n.t("ui.usamosTuUbicacionSoloParaEstaBusquedaDeFarmaciasOLaboratoriosSeEnviaAGooglePlacesParaRespo");
  const accepted = Platform.OS === 'web'
    ? globalThis.confirm(message)
    : await new Promise<boolean>(resolve => Alert.alert(uiI18n.t("ui.ubicacionLocation"), message, [
      { text: uiI18n.t("ui.cancelarCancel"), style: 'cancel', onPress: () => resolve(false) },
      { text: uiI18n.t("ui.continuarContinue"), onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }));
  return accepted ? Location.requestForegroundPermissionsAsync() : { status: 'denied' };
}
