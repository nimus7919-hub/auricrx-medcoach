/**
 * Simple raw-value chart for bitácora series.
 * No reference bands, no high/low colors, no clinical labels.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import DynamicText from './DynamicText';

export interface ChartPoint {
  xLabel: string;
  value: number;
}

export default function BitacoraRawChart({
  title,
  points,
  unit,
  accent = '#DBB65C',
  height = 140,
}: {
  title: string;
  points: ChartPoint[];
  unit?: string;
  accent?: string;
  height?: number;
}) {
  const width = 320;
  const pad = 16;
  if (!points.length) {
    return (
      <View style={styles.wrap}>
        <DynamicText type="card" style={styles.title}>{title}</DynamicText>
        <DynamicText type="card" style={styles.empty}>—</DynamicText>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(points.length - 1, 1);
    const y = pad + ((max - p.value) / span) * (height - pad * 2);
    return { x, y, value: p.value };
  });

  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <View style={styles.wrap}>
      <DynamicText type="card" style={styles.title}>
        {title}{unit ? ` (${unit})` : ''}
      </DynamicText>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#756340" strokeWidth={1} />
        <Polyline points={poly} fill="none" stroke={accent} strokeWidth={2} />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={3} fill={accent} />
        ))}
      </Svg>
      <View style={styles.meta}>
        <DynamicText type="card" style={styles.metaText}>{min}</DynamicText>
        <DynamicText type="card" style={styles.metaText}>{max}</DynamicText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  empty: { opacity: 0.6, fontSize: 13 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  metaText: { fontSize: 11, opacity: 0.7 },
});
