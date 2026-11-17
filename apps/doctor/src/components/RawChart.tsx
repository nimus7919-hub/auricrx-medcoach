import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';

/**
 * Raw trend chart. Optionally draws the doctor's configured limit as a line.
 * No clinical color bands or judgment labels.
 */
export default function RawChart({
  title,
  points,
  unit,
  doctorLimit,
  limitLabel,
}: {
  title: string;
  points: { value: number }[];
  unit?: string;
  /** Doctor-set limit — drawn descriptively, never as a disease cutoff. */
  doctorLimit?: number;
  limitLabel?: string;
}) {
  const width = 320;
  const height = 140;
  const pad = 16;
  if (!points.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>—</Text>
      </View>
    );
  }
  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const limit = typeof doctorLimit === 'number' && Number.isFinite(doctorLimit) ? doctorLimit : undefined;
  const min = limit != null ? Math.min(dataMin, limit) : dataMin;
  const max = limit != null ? Math.max(dataMax, limit) : dataMax;
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(points.length - 1, 1);
    const y = pad + ((max - p.value) / span) * (height - pad * 2);
    return { x, y };
  });
  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const limitY =
    limit != null ? pad + ((max - limit) / span) * (height - pad * 2) : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {title}
        {unit ? ` (${unit})` : ''}
      </Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={colors.border} strokeWidth={1} />
        {limitY != null && (
          <>
            <Line
              x1={pad}
              y1={limitY}
              x2={width - pad}
              y2={limitY}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <SvgText x={pad} y={Math.max(12, limitY - 4)} fill={colors.sub} fontSize="10">
              {limitLabel || String(limit)}
            </SvgText>
          </>
        )}
        <Polyline points={poly} fill="none" stroke={colors.accent} strokeWidth={2} />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={3} fill={colors.accent} />
        ))}
      </Svg>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{min}</Text>
        <Text style={styles.metaText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  empty: { color: colors.sub },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: colors.sub, fontSize: 11 },
});
