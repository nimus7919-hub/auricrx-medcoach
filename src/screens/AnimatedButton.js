import { TouchableOpacity } from "react-native";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAnimatedButton(getScope) {
  return ({ onPress, children, style }) => {
    const {  } = getScope();
    return (<TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
  };
}
