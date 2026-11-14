import { StyleSheet } from 'react-native';
import { darkColors, premiumTheme } from '../../theme/colors';
import type { BodyFigurePalette } from './BodyFigure';

export type BodyMapPalette = typeof darkColors | ReturnType<typeof premiumTheme>;

export function figurePalette(p: BodyMapPalette): BodyFigurePalette {
  const dark = p.mode === 'dark';
  return {
    fill: dark ? '#2C3D5E' : '#F3E7D0',
    fillEnd: dark ? '#1B2843' : '#E3D2B2',
    outline: p.gold,
    highlight: p.gold,
    detail: dark ? '#E8C675' : '#896321',
  };
}

export const LAYER_SWATCH: Record<string, string> = {
  skin: '#E8C675',
  muscles: '#C9735C',
  vessels: '#E0625A',
  bones: '#EFE6D2',
  organs: '#C99AA8',
};

export const bm = StyleSheet.create({
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  small: { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_500Medium' },
  body: { fontSize: 15, lineHeight: 21, fontFamily: 'Inter_500Medium' },
  title: { fontSize: 18, lineHeight: 24, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  segment: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  segmentItem: { paddingVertical: 8, paddingHorizontal: 14 },
  card: { borderWidth: 2, borderRadius: 20, overflow: 'hidden' },
  pin: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
