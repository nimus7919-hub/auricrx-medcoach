import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { bm, type BodyMapPalette } from './bodyMapTheme';
import { layerPhraseKey, regionLabelKey } from './payload';
import { getRegions } from './regions';
import { BODY_VIEWS, type BodyLayer, type BodyView } from './types';

interface Props {
  visible: boolean;
  layer: BodyLayer;
  palette: BodyMapPalette;
  onPick: (view: BodyView, regionId: string) => void;
  onClose: () => void;
}

/** Accessible fallback: pick a region from a plain list instead of tapping the drawing. */
export default function RegionListSheet({ visible, layer, palette: p, onPick, onClose }: Props) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,14,27,0.6)' }}>
        <View testID="bodymap-region-list" style={{ backgroundColor: p.card, borderColor: p.gold, borderWidth: 1.5, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '85%' }}>
          <View style={[bm.row, { marginBottom: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[bm.title, { color: p.text }]}>{t('bodyMap.list.title')}</Text>
              <Text style={[bm.small, { color: p.accent }]}>{t(layerPhraseKey(layer))}</Text>
            </View>
            <TouchableOpacity testID="bodymap-region-list-close" accessibilityRole="button" accessibilityLabel={t('bodyMap.sheet.close')} onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: p.sub, fontSize: 20 }}>{'×'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {BODY_VIEWS.map((view) => (
              <View key={view} style={{ marginTop: 10 }}>
                <Text style={[bm.label, { color: p.accent }]}>{t(`bodyMap.views.${view}`)}</Text>
                {getRegions(layer, view).map((r) => (
                  <TouchableOpacity
                    key={`${view}-${r.id}`}
                    testID={`bodymap-list-${view}-${r.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={t(regionLabelKey(r.id))}
                    onPress={() => onPick(view, r.id)}
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.muted }}
                  >
                    <Text style={[bm.body, { color: p.text }]}>{t(regionLabelKey(r.id))}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
