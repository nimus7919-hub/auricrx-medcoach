from pathlib import Path
import re,json
Path('src/lib/locationPermission.ts').write_text('''import { Alert, Platform } from 'react-native';
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
''',encoding='utf-8')
for n,imp in [('App.js','./src/lib/locationPermission'),('src/lib/geo.ts','./locationPermission')]:
 p=Path(n);s=p.read_text(encoding='utf-8');s="import { requestSearchLocationPermission } from '"+imp+"';\n"+s;s=s.replace('Location.requestForegroundPermissionsAsync()', 'requestSearchLocationPermission()');s=s.replace('    loadLocationData();','    // Location is requested only by an explicit foreground search.');p.write_text(s,encoding='utf-8')
# Authoritative per-platform build config, no runtime environment overrides/fallback to a different platform.
p=Path('src/config/googleOAuth.ts');s=p.read_text();s=re.sub(r"readEnv\('EXPO_PUBLIC_GOOGLE_(WEB|IOS|ANDROID|EXPO)_CLIENT_ID'\) \?\? ", '',s);s=s.replace('googleAuthConfig.iosClientId ?? googleAuthConfig.webClientId ?? googleAuthConfig.expoClientId','googleAuthConfig.iosClientId').replace('googleAuthConfig.androidClientId ?? googleAuthConfig.webClientId ?? googleAuthConfig.expoClientId','googleAuthConfig.androidClientId');s='// OAuth client IDs come from app config for the selected build profile.\n'+s;p.write_text(s)
Path('app.config.js').write_text('''const config = require('./app.json');
module.exports = () => {
  const profile = process.env.EAS_BUILD_PROFILE || 'development';
  const googleAuth = { ...config.expo.extra.googleAuth };
  // Set these in each EAS build profile/console for its signing certificate.
  // Existing IDs stay in place until the configured profile supplies its verified IDs.
  for (const [key, suffix] of Object.entries({ androidClientId: 'ANDROID', iosClientId: 'IOS', webClientId: 'WEB' })) {
    const value = process.env[`GOOGLE_${suffix}_CLIENT_ID_${profile.toUpperCase()}`];
    if (value) googleAuth[key] = value;
  }
  return { ...config.expo, extra: { ...config.expo.extra, googleAuth } };
};
''')
# Server boundary removes schedule fields for restricted saved profiles.
Path('server/fasting-safety.js').write_text('''function fastingAdvice(profile = {}, language = 'en') {
  const restricted = ['diabetes', 'pregnancy', 'breastfeeding', 'eatingDisorders', 'eating_disorders'].some(key => profile[key] === true);
  return { schedule: null, restricted, message: language === 'es'
    ? (restricted ? 'Por tu perfil, habla con tu médico antes de cualquier ayuno.' : 'Ventana de ayuno de ejemplo. Consulta a tu médico antes de ayunar.')
    : (restricted ? 'Because of your profile, talk to your doctor before any fasting.' : 'Example fasting window. Check with your doctor before fasting.') };
}
module.exports = { fastingAdvice };
''',encoding='utf-8')
p=Path('server/index.js');s=p.read_text(encoding='utf-8').replace("message: 'Fasting profile saved successfully',", "message: 'Fasting profile saved successfully',\n      fastingAdvice: require('./fasting-safety').fastingAdvice(profileData, req.body.language),");p.write_text(s,encoding='utf-8')
