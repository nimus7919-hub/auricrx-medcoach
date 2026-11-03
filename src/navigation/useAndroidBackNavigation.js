import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, ToastAndroid } from 'react-native';
import i18n from '../i18n';

const tabs = new Set(['dashboard', 'medications', 'reminders', 'settings']);
const overlays = [];
let exitPressedAt = 0;

// Also usable by view-based sheets. Native Modal routes back to onRequestClose.
export function useBackDismiss(visible, dismiss) {
  const latest = useRef(dismiss);
  latest.current = dismiss;
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    exitPressedAt = 0;
    const entry = () => { exitPressedAt = 0; latest.current(); return true; };
    overlays.push(entry);
    const subscription = BackHandler.addEventListener('hardwareBackPress', () =>
      overlays[overlays.length - 1] === entry ? entry() : false);
    return () => {
      overlays.splice(overlays.indexOf(entry), 1);
      subscription.remove();
      exitPressedAt = 0;
    };
  }, [visible]);
}

export default function useAndroidBackNavigation(enabled) {
  const [route, updateRoute] = useState('dashboard');
  const current = useRef('dashboard');
  const history = useRef([]);
  const setRoute = useCallback((nextRoute) => {
    const next = typeof nextRoute === 'function' ? nextRoute(current.current) : nextRoute;
    if (next === current.current) return;
    exitPressedAt = 0;
    // Tabs start a new branch; only sub-screens retain their entry screen.
    if (tabs.has(next)) history.current = [];
    else history.current.push(current.current);
    current.current = next;
    updateRoute(next);
  }, []);

  useEffect(() => {
    history.current = [];
    exitPressedAt = 0;
  }, [enabled]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const stateSubscription = AppState.addEventListener('change', () => { exitPressedAt = 0; });
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlays.length) return overlays[overlays.length - 1]();
      if (!enabled) return false;
      if (current.current !== 'dashboard') {
        const previous = history.current.pop() || 'dashboard';
        current.current = previous;
        updateRoute(previous);
        exitPressedAt = 0;
        return true;
      }
      const now = Date.now();
      if (exitPressedAt && now - exitPressedAt < 2000) {
        exitPressedAt = 0;
        BackHandler.exitApp();
      } else {
        exitPressedAt = now;
        ToastAndroid.show(i18n.t('navigation.pressBackAgainToExit'), ToastAndroid.SHORT);
      }
      return true;
    });
    return () => { subscription.remove(); stateSubscription.remove(); exitPressedAt = 0; };
  }, [enabled]);

  return [route, setRoute];
}
