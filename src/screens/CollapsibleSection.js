import { View, Text, TouchableOpacity } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createCollapsibleSection(getScope) {
  return ({ title, children, sectionKey, onToggle }) => {
    const { theme, expandedSections } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => onToggle(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <DynamicText type="card" style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
          </View>
        <Text style={{ 
          color: theme.accent, 
          fontSize: 18, 
          transform: [{ rotate: expandedSections[sectionKey] ? '90deg' : '0deg' }] 
        }}>
          ▶
        </Text>
      </TouchableOpacity>
      {expandedSections[sectionKey] && children}
    </View>
    );
  };
}
