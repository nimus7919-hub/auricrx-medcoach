/**
 * Layered "where does it hurt?" body map.
 *
 * - Layers: skin, muscles, blood vessels, bones, organs (stylized original artwork, BodyFigure.tsx)
 * - Front / back flip, zoom presets (whole body / upper / lower)
 * - Tap to drop a numbered pin on a named region; tap a pin to edit or remove it
 * - Optional patient-reported details per pin (PainDescriptorSheet)
 * - List-based fallback (RegionListSheet) and per-region accessible targets for screen readers
 *
 * COMPLIANCE: this component records locations and the patient's own words only. It never shows
 * what a location could mean, never ranks or flags anything, and never suggests a next step.
 * No new native modules: react-native-svg + Animated only (OTA-compatible).
 */
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { darkColors } from '../../theme/colors';
import BodyFigure from './BodyFigure';
import PainDescriptorSheet from './PainDescriptorSheet';
import RegionListSheet from './RegionListSheet';
import { LAYER_SWATCH, bm, figurePalette, type BodyMapPalette } from './bodyMapTheme';
import { bodyMapReducer, canPlaceMore, initialBodyMapState, type BodyMapState } from './markersReducer';
import { describeMarkerParts, layerLabelKey, regionLabelKey } from './payload';
import {
  BODY_VIEWBOX,
  BODY_ZOOMS,
  canvasToViewBox,
  findRegion,
  getRegions,
  hitTestRegion,
  shapeCenter,
  viewBoxToCanvas,
  type BodyRegion,
  type BodyZoom,
  type RegionShape,
} from './regions';
import { BODY_LAYERS, BODY_VIEWS, MAX_BODY_MARKERS, type BodyPainMarker, type BodyView } from './types';

export interface BodyMapProps {
  palette?: BodyMapPalette;
  initialState?: Partial<BodyMapState>;
  /** Open the details sheet for this marker on mount (previews / tests). */
  initialEditingId?: string | null;
  onChange?: (markers: BodyPainMarker[]) => void;
  /** Canvas height in px; width follows the figure's aspect ratio. */
  canvasHeight?: number;
  /** Render the details sheet inline instead of a Modal (web previews). */
  inlineSheet?: boolean;
  testID?: string;
}

const USE_NATIVE = Platform.OS !== 'web';
const ZOOMS: BodyZoom[] = ['full', 'upper', 'lower'];
const PIN = 26;

function shapeBounds(shape: RegionShape) {
  switch (shape.kind) {
    case 'rect':
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
    case 'ellipse':
      return { x: shape.cx - shape.rx, y: shape.cy - shape.ry, w: shape.rx * 2, h: shape.ry * 2 };
    case 'poly': {
      const xs = shape.points.map((p) => p[0]);
      const ys = shape.points.map((p) => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
  }
}

function Pin({ marker, active, selected, left, top, label, onPress }: { marker: BodyPainMarker; active: boolean; selected: boolean; left: number; top: number; label: string; onPress: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: USE_NATIVE }).start();
  }, [pop]);
  useEffect(() => {
    if (!selected) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }));
    loop.start();
    return () => loop.stop();
  }, [selected, pulse]);
  const size = active ? PIN : PIN - 6;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[bm.pin, { left: left - size / 2, top: top - size / 2, width: size, height: size, transform: [{ scale: pop }] }]}
    >
      {selected ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: darkColors.gold,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] }) }],
          }}
        />
      ) : null}
      <Pressable
        testID={`bodymap-pin-${marker.id}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={8}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? darkColors.gold : 'rgba(8,14,27,0.75)',
          borderWidth: 2,
          borderColor: active ? '#FFF5E4' : darkColors.gold,
          opacity: active ? 1 : 0.8,
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Text style={{ color: active ? darkColors.onAccent : darkColors.gold, fontSize: active ? 12 : 10, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>{marker.seq}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function BodyMap({ palette = darkColors, initialState, initialEditingId = null, onChange, canvasHeight = 440, inlineSheet, testID = 'bodymap' }: BodyMapProps) {
  const { t } = useTranslation();
  const p = palette;
  const fig = useMemo(() => figurePalette(p), [p]);
  const [state, dispatch] = useReducer(bodyMapReducer, initialState, (init) => initialBodyMapState(init));
  const [editingId, setEditingId] = useState<string | null>(initialEditingId);
  const [listOpen, setListOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [screenReader, setScreenReader] = useState(false);

  const canvas = useMemo(() => {
    const height = canvasHeight;
    const width = (height * BODY_VIEWBOX.width) / BODY_VIEWBOX.height;
    return { width, height };
  }, [canvasHeight]);
  const vb = BODY_ZOOMS[state.zoom];

  // Report marker changes to the host (skip the very first render).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange?.(state.markers);
  }, [state.markers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled?.()
      .then((on) => alive && setScreenReader(!!on))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', (on: boolean) => setScreenReader(!!on));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  // Layer change: cross-fade + gentle scale.
  const layerAnim = useRef(new Animated.Value(1)).current;
  const lastLayer = useRef(state.layer);
  useEffect(() => {
    if (lastLayer.current === state.layer) return;
    lastLayer.current = state.layer;
    layerAnim.setValue(0);
    Animated.timing(layerAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }).start();
  }, [state.layer, layerAnim]);

  // Front/back: card-flip on the X axis.
  const flip = useRef(new Animated.Value(1)).current;
  const setView = useCallback(
    (view: BodyView) => {
      if (view === state.view) return;
      Animated.timing(flip, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE }).start(() => {
        dispatch({ type: 'SET_VIEW', view });
        Animated.timing(flip, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }).start();
      });
    },
    [flip, state.view]
  );

  const flash = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint((h) => (h === msg ? null : h)), 2200);
  };

  const buzz = () => {
    if (Platform.OS === 'web') return;
    try {
      // Already in the native binary (expo-haptics); purely cosmetic.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('expo-haptics').selectionAsync?.();
    } catch {
      // ignore
    }
  };

  const placeAt = (regionId: string, x: number, y: number, view?: BodyView) => {
    if (!canPlaceMore(state)) {
      flash(t('bodyMap.maxMarkers', { max: MAX_BODY_MARKERS }));
      return;
    }
    const id = `m${state.nextSeq}`;
    if (view && view !== state.view) dispatch({ type: 'SET_VIEW', view });
    dispatch({ type: 'PLACE', regionId, x, y });
    buzz();
    setEditingId(id);
  };

  const onCanvasPress = (e: any) => {
    const ne = e?.nativeEvent ?? {};
    const px = Number(ne.locationX ?? ne.offsetX);
    const py = Number(ne.locationY ?? ne.offsetY);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    const pt = canvasToViewBox(px, py, canvas, vb);
    const region = hitTestRegion(state.layer, state.view, pt.x, pt.y);
    if (!region) {
      flash(t(state.layer === 'organs' ? 'bodyMap.missOrgans' : 'bodyMap.miss'));
      return;
    }
    placeAt(region.id, pt.x, pt.y);
  };

  const selected = state.markers.find((m) => m.id === state.selectedId) ?? null;
  const editing = state.markers.find((m) => m.id === editingId) ?? null;
  const highlight: BodyRegion | null = selected ? findRegion(selected.layer, selected.view, selected.regionId) : null;
  const regions = getRegions(state.layer, state.view);
  const viewMarkers = state.markers.filter((m) => m.view === state.view);

  const markerLabel = (m: BodyPainMarker) => t('bodyMap.pinA11y', { n: m.seq, region: t(regionLabelKey(m.regionId)), layer: t(layerLabelKey(m.layer)) });
  const openMarker = (m: BodyPainMarker) => {
    dispatch({ type: 'SELECT', id: m.id });
    setEditingId(m.id);
  };

  // Orientation: always the patient's own left/right.
  const leftTag = state.view === 'front' ? t('bodyMap.yourRight') : t('bodyMap.yourLeft');
  const rightTag = state.view === 'front' ? t('bodyMap.yourLeft') : t('bodyMap.yourRight');

  const layerOpacity = layerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
  const layerScale = layerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  const chip = (selectedChip: boolean) => [bm.chip, { borderColor: selectedChip ? p.gold : p.border, backgroundColor: selectedChip ? p.gold : p.card }];
  const chipText = (selectedChip: boolean) => [bm.chipText, { color: selectedChip ? p.onAccent : p.text }];

  return (
    <View testID={testID}>
      {/* Layer selector */}
      <Text style={[bm.label, { color: p.accent }]}>{t('bodyMap.layerLabel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }} accessibilityRole="tablist">
        {BODY_LAYERS.map((layer) => {
          const on = state.layer === layer;
          return (
            <TouchableOpacity
              key={layer}
              testID={`bodymap-layer-${layer}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => dispatch({ type: 'SET_LAYER', layer })}
              style={chip(on)}
            >
              <View style={[bm.swatch, { backgroundColor: LAYER_SWATCH[layer], borderWidth: on ? 1 : 0, borderColor: p.onAccent }]} />
              <Text style={chipText(on)}>{t(layerLabelKey(layer))}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* View + zoom */}
      <View style={[bm.row, { justifyContent: 'space-between', marginTop: 4, marginBottom: 10, flexWrap: 'wrap' }]}>
        <View style={[bm.segment, { borderColor: p.border }]} accessibilityRole="tablist">
          {BODY_VIEWS.map((view) => {
            const on = state.view === view;
            return (
              <TouchableOpacity
                key={view}
                testID={`bodymap-view-${view}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setView(view)}
                style={[bm.segmentItem, { backgroundColor: on ? p.gold : 'transparent' }]}
              >
                <Text style={[bm.chipText, { color: on ? p.onAccent : p.text }]}>{t(`bodyMap.views.${view}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[bm.segment, { borderColor: p.border }]} accessibilityRole="tablist">
          {ZOOMS.map((z) => {
            const on = state.zoom === z;
            return (
              <TouchableOpacity
                key={z}
                testID={`bodymap-zoom-${z}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t(`bodyMap.zoomA11y.${z}`)}
                onPress={() => dispatch({ type: 'SET_ZOOM', zoom: z })}
                style={[bm.segmentItem, { paddingHorizontal: 11, backgroundColor: on ? p.muted : 'transparent' }]}
              >
                <Text style={[bm.chipText, { color: on ? p.accent : p.sub }]}>{t(`bodyMap.zoom.${z}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Canvas */}
      <View
        style={[bm.card, { borderColor: p.border, backgroundColor: p.mode === 'dark' ? '#0D1628' : '#FBF5EA', alignItems: 'center', paddingVertical: 14 }]}
      >
        <View style={[bm.row, { position: 'absolute', top: 10, left: 12, right: 12, justifyContent: 'space-between' }]} pointerEvents="none">
          <Text style={[bm.small, { color: p.sub }]}>{leftTag}</Text>
          <Text style={[bm.small, { color: p.sub }]}>{rightTag}</Text>
        </View>
        <Animated.View style={{ width: canvas.width, height: canvas.height, transform: [{ scaleX: flip }] }}>
          <Pressable
            testID="bodymap-canvas"
            accessibilityRole="imagebutton"
            accessibilityLabel={t('bodyMap.canvasA11y', { layer: t(layerLabelKey(state.layer)), view: t(`bodyMap.views.${state.view}`) })}
            accessibilityHint={t('bodyMap.canvasHint')}
            onPress={onCanvasPress}
            style={{ width: canvas.width, height: canvas.height }}
          >
            <Animated.View pointerEvents="none" style={{ opacity: layerOpacity, transform: [{ scale: layerScale }] }}>
              <BodyFigure
                layer={state.layer}
                view={state.view}
                viewBox={vb}
                width={canvas.width}
                height={canvas.height}
                palette={fig}
                highlight={highlight}
                regions={state.layer === 'organs' ? regions : undefined}
              />
            </Animated.View>
          </Pressable>
          {screenReader
            ? regions.map((r) => {
                const b = shapeBounds(r.shape);
                const tl = viewBoxToCanvas(b.x, b.y, canvas, vb);
                const br = viewBoxToCanvas(b.x + b.w, b.y + b.h, canvas, vb);
                const c = shapeCenter(r.shape);
                return (
                  <Pressable
                    key={r.id}
                    testID={`bodymap-a11y-${r.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={t(regionLabelKey(r.id))}
                    accessibilityHint={t('bodyMap.regionHint')}
                    onPress={() => placeAt(r.id, c.x, c.y)}
                    style={{ position: 'absolute', left: tl.left, top: tl.top, width: Math.max(8, br.left - tl.left), height: Math.max(8, br.top - tl.top) }}
                  />
                );
              })
            : null}
          {viewMarkers.map((m) => {
            const pos = viewBoxToCanvas(m.x, m.y, canvas, vb);
            if (!pos.visible) return null;
            return (
              <Pin
                key={m.id}
                marker={m}
                active={m.layer === state.layer}
                selected={m.id === state.selectedId}
                left={pos.left}
                top={pos.top}
                label={markerLabel(m)}
                onPress={() => openMarker(m)}
              />
            );
          })}
        </Animated.View>
        <Text testID="bodymap-hint" style={[bm.small, { color: hint ? p.accent : p.sub, marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }]}>
          {hint ?? t('bodyMap.tapHint')}
        </Text>
      </View>

      <TouchableOpacity
        testID="bodymap-open-list"
        accessibilityRole="button"
        onPress={() => setListOpen(true)}
        style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 8 }}
      >
        <Text style={[bm.chipText, { color: p.accent, textDecorationLine: 'underline' }]}>{t('bodyMap.useList')}</Text>
      </TouchableOpacity>

      {/* Marked spots */}
      <Text style={[bm.label, { color: p.accent, marginTop: 6 }]}>{t('bodyMap.markedTitle', { count: state.markers.length, max: MAX_BODY_MARKERS })}</Text>
      {state.markers.length === 0 ? (
        <Text style={[bm.small, { color: p.sub, marginBottom: 6 }]}>{t('bodyMap.noneYet')}</Text>
      ) : (
        state.markers.map((m) => (
          <TouchableOpacity
            key={m.id}
            testID={`bodymap-row-${m.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${markerLabel(m)}. ${t('bodyMap.edit')}`}
            onPress={() => openMarker(m)}
            style={[bm.row, { borderWidth: 1.5, borderColor: m.id === state.selectedId ? p.gold : p.border, backgroundColor: p.card, borderRadius: 14, padding: 12, marginBottom: 8 }]}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Text style={{ color: p.onAccent, fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>{m.seq}</Text>
            </View>
            <Text style={[bm.small, { color: p.text, flex: 1 }]}>
              {describeMarkerParts({ ...m, regionLabel: t(regionLabelKey(m.regionId)) }, t).join(' · ')}
            </Text>
            <Text style={[bm.chipText, { color: p.accent, marginLeft: 8 }]}>{t('bodyMap.edit')}</Text>
          </TouchableOpacity>
        ))
      )}

      <PainDescriptorSheet
        marker={editing}
        palette={p}
        inline={inlineSheet}
        onClose={() => setEditingId(null)}
        onSave={(id, patch) => {
          dispatch({ type: 'UPDATE', id, patch });
          setEditingId(null);
        }}
        onRemove={(id) => {
          dispatch({ type: 'REMOVE', id });
          setEditingId(null);
        }}
      />
      <RegionListSheet
        visible={listOpen}
        layer={state.layer}
        palette={p}
        onClose={() => setListOpen(false)}
        onPick={(view, regionId) => {
          setListOpen(false);
          const r = findRegion(state.layer, view, regionId);
          if (!r) return;
          const c = shapeCenter(r.shape);
          placeAt(regionId, c.x, c.y, view);
        }}
      />
    </View>
  );
}
