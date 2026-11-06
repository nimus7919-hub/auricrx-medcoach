import { View, TouchableOpacity } from "react-native";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createRowSwitch(getScope) {
  return ({ label, value, onValueChange }) => {
    const { theme } = getScope();
    return (<TouchableOpacity style={styles.rowBetween} onPress={() => onValueChange(!value)}>
      <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>{label}</DynamicText>
      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: value ? theme.accent : theme.chip }} />
    </TouchableOpacity>
  );
  };
}
