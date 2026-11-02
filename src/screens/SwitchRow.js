import { View, Switch } from "react-native";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createSwitchRow(getScope) {
  return ({ label, value, onValueChange }) => {
    const {  } = getScope();
    return (<View style={styles.rowBetween}>
      <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>{label}</DynamicText>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
  };
}
