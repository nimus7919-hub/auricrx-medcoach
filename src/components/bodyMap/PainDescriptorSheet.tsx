import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PremiumButton from '../PremiumButton';
import { bm, type BodyMapPalette } from './bodyMapTheme';
import { feelLabelKey, layerPhraseKey, onsetLabelKey, regionLabelKey } from './payload';
import {
  MAX_MARKER_NOTE_LENGTH,
  PAIN_FEELS,
  PAIN_INTENSITY_MAX,
  PAIN_INTENSITY_MIN,
  PAIN_ONSETS,
  type BodyPainMarker,
  type PainDescriptors,
  type PainFeel,
  type PainOnset,
} from './types';

interface Props {
  marker: BodyPainMarker | null;
  palette: BodyMapPalette;
  onSave: (id: string, patch: PainDescriptors) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  /** Render inline instead of in a Modal (web previews / tests). */
  inline?: boolean;
}

const INTENSITIES = Array.from({ length: PAIN_INTENSITY_MAX - PAIN_INTENSITY_MIN + 1 }, (_, i) => i + PAIN_INTENSITY_MIN);

/**
 * Optional, patient-reported details for one marker. Every field can be left empty.
 * The sheet only records the patient's own choices; it shows no interpretation.
 */
export default function PainDescriptorSheet({ marker, palette: p, onSave, onRemove, onClose, inline }: Props) {
  const { t } = useTranslation();
  const [intensity, setIntensity] = useState<number | null>(null);
  const [feels, setFeels] = useState<PainFeel[]>([]);
  const [onset, setOnset] = useState<PainOnset | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    setIntensity(marker?.intensity ?? null);
    setFeels(marker?.feels ?? []);
    setOnset(marker?.onset ?? null);
    setNote(marker?.note ?? '');
  }, [marker?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!marker) return null;

  const toggleFeel = (f: PainFeel) => setFeels((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const chip = (selected: boolean) => [bm.chip, { borderColor: selected ? p.gold : p.border, backgroundColor: selected ? p.gold : 'transparent' }];
  const chipText = (selected: boolean) => [bm.chipText, { color: selected ? p.onAccent : p.text }];

  const sheet = (
    <View
      testID="bodymap-sheet"
      style={{ backgroundColor: p.card, borderColor: p.gold, borderWidth: 1.5, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: inline ? 24 : 0, borderBottomRightRadius: inline ? 24 : 0, padding: 18, maxHeight: inline ? undefined : '88%' }}
    >
      <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: p.border, marginBottom: 12 }} />
      <View style={[bm.row, { marginBottom: 12 }]}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: p.onAccent, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>{marker.seq}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[bm.title, { color: p.text }]}>{t(regionLabelKey(marker.regionId))}</Text>
          <Text style={[bm.small, { color: p.accent }]}>{t(layerPhraseKey(marker.layer))}</Text>
        </View>
        <TouchableOpacity testID="bodymap-sheet-close" accessibilityRole="button" accessibilityLabel={t('bodyMap.sheet.close')} onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ color: p.sub, fontSize: 20 }}>{'×'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[bm.small, { color: p.sub, marginBottom: 14 }]}>{t('bodyMap.sheet.optionalNote')}</Text>

        <Text style={[bm.label, { color: p.accent }]}>{t('bodyMap.sheet.intensityLabel')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
          {INTENSITIES.map((n) => {
            const sel = intensity === n;
            return (
              <TouchableOpacity
                key={n}
                testID={`bodymap-intensity-${n}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={t('bodyMap.sheet.intensityA11y', { value: n })}
                onPress={() => setIntensity(sel ? null : n)}
                style={{
                  flex: 1,
                  marginHorizontal: 1.5,
                  height: 34,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: sel ? p.gold : p.border,
                  backgroundColor: sel ? p.gold : intensity !== null && n < intensity ? p.muted : 'transparent',
                }}
              >
                <Text style={{ color: sel ? p.onAccent : p.text, fontFamily: 'Inter_600SemiBold', fontWeight: '600', fontSize: 13 }}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[bm.row, { justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }]}>
          <Text style={[bm.small, { color: p.sub }]}>{t('bodyMap.sheet.intensityMin')}</Text>
          <Text style={[bm.small, { color: p.sub }]}>{t('bodyMap.sheet.intensityMax')}</Text>
        </View>

        <Text style={[bm.label, { color: p.accent }]}>{t('bodyMap.sheet.feelLabel')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {PAIN_FEELS.map((f) => {
            const sel = feels.includes(f);
            return (
              <TouchableOpacity key={f} testID={`bodymap-feel-${f}`} accessibilityRole="checkbox" accessibilityState={{ checked: sel }} onPress={() => toggleFeel(f)} style={chip(sel)}>
                <Text style={chipText(sel)}>{t(feelLabelKey(f))}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[bm.label, { color: p.accent }]}>{t('bodyMap.sheet.onsetLabel')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }} accessibilityRole="radiogroup">
          {PAIN_ONSETS.map((o) => {
            const sel = onset === o;
            return (
              <TouchableOpacity key={o} testID={`bodymap-onset-${o}`} accessibilityRole="radio" accessibilityState={{ selected: sel }} onPress={() => setOnset(sel ? null : o)} style={chip(sel)}>
                <Text style={chipText(sel)}>{t(onsetLabelKey(o))}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[bm.label, { color: p.accent }]}>{t('bodyMap.sheet.noteLabel')}</Text>
        <TextInput
          testID="bodymap-note"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={MAX_MARKER_NOTE_LENGTH}
          placeholder={t('bodyMap.sheet.notePlaceholder')}
          placeholderTextColor={p.sub}
          accessibilityLabel={t('bodyMap.sheet.noteLabel')}
          style={{ minHeight: 64, borderWidth: 1.5, borderColor: p.border, borderRadius: 14, padding: 12, color: p.text, backgroundColor: p.bg, fontSize: 15, textAlignVertical: 'top', fontFamily: 'Inter_500Medium' }}
        />

        <PremiumButton
          testID="bodymap-sheet-save"
          onPress={() => onSave(marker.id, { intensity, feels, onset, note: note || null })}
          style={{ paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>{t('bodyMap.sheet.save')}</Text>
        </PremiumButton>
        <TouchableOpacity
          testID="bodymap-sheet-remove"
          accessibilityRole="button"
          onPress={() => onRemove(marker.id)}
          style={{ paddingVertical: 13, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderRadius: 14, borderColor: p.border }}
        >
          <Text style={{ color: p.text, fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>{t('bodyMap.sheet.remove')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (inline) return sheet;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,14,27,0.6)' }}>{sheet}</View>
    </Modal>
  );
}
