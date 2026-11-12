import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';

/**
 * Safe-area + FAB clearance for stack/modal screens under a translucent status bar.
 * Top: status-bar inset + comfortable header padding.
 * Bottom: FAB size + margin so scroll content is never hidden under the mascot.
 */
export function useScreenSafePadding({ headerExtra = 12, fabClearance = true, extraBottom = 0 } = {}) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 0) + headerExtra;
  const paddingBottom = (fabClearance ? FAB_SCROLL_PADDING : 16) + extraBottom;
  return {
    insets,
    paddingTop,
    paddingBottom,
    headerPaddingStyle: { paddingTop },
    scrollContentStyle: { paddingBottom },
  };
}
