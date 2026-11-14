import React, { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { darkColors, premiumTheme } from '../../theme/colors';

export type IntakePalette = typeof darkColors | ReturnType<typeof premiumTheme>;

const IntakePaletteContext = createContext<IntakePalette>(darkColors);

export function IntakePaletteProvider({ dark = true, children }: { dark?: boolean; children: React.ReactNode }) {
  return <IntakePaletteContext.Provider value={premiumTheme(dark)}>{children}</IntakePaletteContext.Provider>;
}

export const useIntakePalette = () => useContext(IntakePaletteContext);

/** Layout-only styles; colors come from the premium palette at render time. */
export const intakeStyles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 18, padding: 14, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderRadius: 14 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  option: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
