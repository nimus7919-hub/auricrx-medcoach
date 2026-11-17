import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import type { TFunction } from 'i18next';
import type { BodyPainMapPayload } from '@auricrx/doctor-core';
import { colors } from '../theme/colors';

const W = 90;
const H = 180;

/** Cheap, non-anatomical silhouette — dots only, no interpretation. */
function Silhouette({
  label,
  markers,
}: {
  label: string;
  markers: { x: number; y: number; seq: number }[];
}) {
  return (
    <View style={styles.col}>
      <Text style={styles.cap}>{label}</Text>
      <Svg width={W} height={H} viewBox="0 0 100 200" accessibilityRole="image" accessibilityLabel={label}>
        <Rect x="0" y="0" width="100" height="200" fill={colors.bg} rx="8" />
        <Ellipse cx="50" cy="22" rx="14" ry="16" stroke={colors.accent} strokeWidth="1.5" fill="none" />
        <Path
          d="M42 36 L40 70 L28 108 L30 118 L42 70 L42 118 L38 188 L46 188 L50 124 L54 188 L62 188 L58 118 L58 70 L70 118 L72 108 L60 70 L58 36"
          stroke={colors.accent}
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        <Line x1="50" y1="38" x2="50" y2="118" stroke={colors.border} strokeWidth="1" />
        {markers.map((m) => (
          <Circle
            key={`${m.seq}-${m.x}-${m.y}`}
            cx={m.x * 100}
            cy={m.y * 200}
            r="4"
            fill={colors.accent}
            stroke={colors.text}
            strokeWidth="0.75"
          />
        ))}
      </Svg>
    </View>
  );
}

export default function BodyPainMapDiagram({
  payload,
  t,
}: {
  payload: BodyPainMapPayload;
  t: TFunction;
}) {
  const front = payload.markers
    .map((m, i) => ({ ...m, seq: i + 1 }))
    .filter((m) => m.view === 'front')
    .map((m) => ({ x: m.position.x, y: m.position.y, seq: m.seq }));
  const back = payload.markers
    .map((m, i) => ({ ...m, seq: i + 1 }))
    .filter((m) => m.view === 'back')
    .map((m) => ({ x: m.position.x, y: m.position.y, seq: m.seq }));
  if (!front.length && !back.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('doctorMode.preVisitIntake.bodyMap.diagram')}</Text>
      <View style={styles.row}>
        <Silhouette label={t('doctorMode.preVisitIntake.bodyMap.viewFront')} markers={front} />
        <Silhouette label={t('doctorMode.preVisitIntake.bodyMap.viewBack')} markers={back} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, marginBottom: 6 },
  title: { color: colors.sub, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'flex-start', gap: 16 },
  col: { alignItems: 'center' },
  cap: { color: colors.sub, fontSize: 12, marginBottom: 4 },
});
