import { View, Image } from "react-native";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createTopBar(getScope) {
  return () => {
    const { setRoute, setShowHelpModal, theme, AnimatedButton, TrialWidget } = getScope();
    return (<View style={[styles.topbar, { borderColor: theme.chip }]}>
    <AnimatedButton onPress={() => setRoute('dashboard')} style={[styles.brandButton, { marginLeft: -65 }]}>
        <Image 
          source={require('../../assets/AuricRX_home_button_across_screens.png')} 
          style={styles.brandLogo}
          resizeMode="contain"
        />
    </AnimatedButton>
    <View style={{ flex: 1 }} />
    
    <TrialWidget />
    
    <AnimatedButton onPress={() => setShowHelpModal(true)} style={{ marginRight: 8 }}>
      <Image 
        source={require('../../assets/dashboard Emojies/help.png')} 
        style={{ width: 48, height: 48, tintColor: theme.accent }}
        resizeMode="contain"
      />
    </AnimatedButton>
    
    <AnimatedButton onPress={() => setRoute('settings')}>
      <Image 
        source={require('../../assets/dashboard Emojies/settings cog.png')} 
        style={{ width: 48, height: 48, tintColor: theme.accent }}
        resizeMode="contain"
      />
    </AnimatedButton>
  </View>
);
  };
}
