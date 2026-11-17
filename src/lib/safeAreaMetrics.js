import { Dimensions } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

// SafeAreaProvider renders nothing until it has insets. Seed it so the first
// frame always paints; native inset events still refine the values afterward.
export function startupSafeAreaMetrics() {
  if (initialWindowMetrics?.insets && initialWindowMetrics?.frame) return initialWindowMetrics;
  const { width, height } = Dimensions.get('window');
  return { frame: { x: 0, y: 0, width, height }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
}
