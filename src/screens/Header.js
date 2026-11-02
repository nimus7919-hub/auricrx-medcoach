import { View, Image } from "react-native";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createHeader(getScope) {
  return ({ title }) => {
    const { route, setRoute, theme, AnimatedButton } = getScope();
    return (<View style={[styles.header, { borderColor: theme.chip }]}>
      {route !== 'dashboard' ? (
        <AnimatedButton onPress={() => setRoute('dashboard')} style={[styles.headerHomeButton, { marginLeft: -65 }]}>
          <Image 
            source={require('../../assets/AuricRX_home_button_across_screens.png')} 
            style={styles.headerHomeIcon}
            resizeMode="contain"
          />
        </AnimatedButton>
      ) : (
        <View style={{ width: 180, height: 60 }} />
      )}
      <DynamicText type="primary" style={[styles.headerTitle, { 
        fontFamily: 'Inter_600SemiBold',
        textAlign: 'center',
        flex: 1,
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -50 }],
        maxWidth: '60%'
      }]}>{title}</DynamicText>
      {route !== 'dashboard' ? (
        <View style={{ width: 40 }} />
      ) : (
        <AnimatedButton onPress={() => setRoute('settings')} style={styles.headerSettingsButton}>
          <Image 
            source={require('../../assets/dashboard Emojies/settings cog.png')} 
            style={styles.headerSettingsIcon}
            resizeMode="contain"
          />
        </AnimatedButton>
      )}
    </View>
  );
  };
}
