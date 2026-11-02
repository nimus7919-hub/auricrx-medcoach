import { View } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createSection(getScope) {
  return ({ title, children }) => {
    const {  } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
        {children}
      </View>
    );
  };
}
