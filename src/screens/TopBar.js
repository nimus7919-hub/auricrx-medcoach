import uiI18n from '../i18n';
import { View, Image, Text, TouchableOpacity } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createTopBar(getScope) {
  return () => {
    const { setRoute, setShowHelpModal, theme, AnimatedButton, TrialWidget, user, userData } = getScope();
    const name = (userData?.firstName || userData?.displayName || user?.displayName || user?.email?.split('@')[0] || '').trim();
    const photo = userData?.photoURL || user?.photoURL || user?.firebaseUser?.photoURL;
    return (<View style={[styles.topbar, { borderColor: theme.chip }]}>
    <AnimatedButton onPress={() => setRoute('dashboard')} style={[styles.brandButton, { marginLeft: -65 }]}>
        <Image 
          source={require('../../assets/AuricRX_home_button_across_screens.png')} 
          style={styles.brandLogo}
          resizeMode="contain"
        />
    </AnimatedButton>
    <View style={{ flex: 1 }} />
    

    <TouchableOpacity accessibilityRole="button" accessibilityLabel={uiI18n.t('settings.title')} onPress={() => setRoute('settings')} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#101D32', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 8 }}>
      {photo ? <Image source={{ uri: photo }} style={{ width: 34, height: 34, borderRadius: 17 }} /> : <Text style={{ color: '#D4AF37', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>{Array.from(name)[0]?.toUpperCase() || 'A'}</Text>}
    </TouchableOpacity>
    
    <AnimatedButton onPress={() => setShowHelpModal(true)} style={{ marginRight: 8 }}>
      <Image 
        source={require('../../assets/dashboard Emojies/help.png')} 
        style={{ width: 48, height: 48, tintColor: theme.accent }}
        resizeMode="contain"
      />
    </AnimatedButton>
    
  </View>
);
  };
}
