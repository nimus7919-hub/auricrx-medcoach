import { View, TouchableOpacity } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createCard(getScope) {
  return ({ title, icon, onPress, subtitle, actionButton }) => {
    const {  } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Icon slot: no fixed height — avoids clipping emoji/vector glyphs on Android */}
        <View style={styles.cardIconSlot}>{icon}</View>
        <DynamicText type="card" style={[styles.cardText, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <DynamicText type="card" style={[styles.cardSubtitle, { fontFamily: 'Inter_400Regular', opacity: 0.7 }]}>
              {subtitle}
            </DynamicText>
          ) : (
            subtitle
          )
        )}
        {actionButton}
      </TouchableOpacity>
    );
  };
}
