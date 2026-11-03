import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Modal from './BackModal';
import { vip } from '../theme/vip';

export function DocumentIconButton({ icon, label, onPress, danger = false }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconButton} hitSlop={4}>
    <Ionicons name={icon} size={18} color={danger ? '#D98F89' : vip.colors.gold} />
  </TouchableOpacity>;
}

export function DocumentPill({ icon = 'add', label, onPress }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.pill}>
    <Ionicons name={icon} size={16} color={vip.colors.gold} /><Text style={s.pillText}>{label}</Text>
  </TouchableOpacity>;
}

// Mount as a component: hooks never run inside conditional render helpers.
export function AddDocumentSheet({ title, dualSided, onClose, onScan, onPhoto, onGallery, onPDF }) {
  const { t } = useTranslation();
  const [side, setSide] = useState('front');
  const insets = useSafeAreaInsets();
  const selectedSide = dualSided ? side : 'single';
  const options = [
    ['scan-outline', 'scan', 'scanHint', onScan, true],
    ['camera-outline', 'photo', 'photoHint', onPhoto],
    ['images-outline', 'gallery', 'galleryHint', onGallery],
    ['document-text-outline', 'pdf', 'pdfHint', onPDF],
  ];
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <View style={s.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.cancel')} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityViewIsModal>
        <View style={s.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={s.title}>{t('medicalDocuments.addDocument')}</Text>
          <Text style={s.category}>{title}</Text>
          <Text style={s.subtitle}>{t('documentUI.subtitle')}</Text>
          {dualSided && <View style={s.segments} accessibilityRole="tablist">
            {['front', 'back'].map(value => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{ selected: value === side }} onPress={() => setSide(value)} style={[s.segment, side === value && s.segmentActive]}>
              <Text style={s.segmentText}>{t('documentUI.' + value)}</Text>
            </TouchableOpacity>)}
          </View>}
          <View style={s.options}>
            {options.map(([icon, label, hint, handler, pro]) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={t('documentUI.' + label) + (pro ? ' PRO' : '')} accessibilityHint={t('documentUI.' + hint)} style={s.option} onPress={() => handler(selectedSide)}>
              <View style={s.circle}><Ionicons name={icon} size={22} color={vip.colors.gold} /></View>
              <View style={s.optionText}><View style={s.labelRow}><Text style={s.label}>{t('documentUI.' + label)}</Text>{pro && <Text style={s.pro}>PRO</Text>}</View>
                <Text style={s.hint}>{t('documentUI.' + hint)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={vip.colors.gold} />
            </TouchableOpacity>)}
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={s.cancel}><Text style={s.segmentText}>{t('common.cancel')}</Text></TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  iconButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: vip.colors.navy, borderWidth: 1, borderColor: vip.colors.line, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: vip.colors.line, borderRadius: 20, backgroundColor: vip.colors.navy, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 1 },
  pillText: { color: vip.colors.gold, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { backgroundColor: vip.colors.navy, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: vip.colors.line, paddingHorizontal: 20, maxHeight: '90%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: vip.colors.line, alignSelf: 'center', marginVertical: 12 },
  title: { color: vip.colors.white, fontSize: 21, fontWeight: '700' },
  category: { color: vip.colors.gold, fontSize: 14, marginTop: 4 },
  subtitle: { color: '#AAB5C2', fontSize: 12, marginTop: 6, marginBottom: 16 },
  segments: { flexDirection: 'row', backgroundColor: '#0E1C2C', borderRadius: 12, padding: 4, marginBottom: 12 },
  segment: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 9 },
  segmentActive: { backgroundColor: '#332D24' },
  segmentText: { color: vip.colors.gold, fontSize: 13, fontWeight: '600' },
  options: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#344039', backgroundColor: '#0B1929', gap: 12 },
  circle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(232,191,128,0.12)', alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 }, labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: vip.colors.white, flexShrink: 1 },
  pro: { fontSize: 9, fontWeight: '800', color: vip.colors.gold, backgroundColor: '#332D24', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  hint: { color: '#AAB5C2', fontSize: 11, marginTop: 3 }, cancel: { alignItems: 'center', padding: 16 },
});
