import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors } from '../theme/colors';

export default function RawChart({
  title,
  points,
  unit,
}: {
  title: string;
  points: { value: number }[];
  unit?: string;
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
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(points.length - 1, 1);
    const y = pad + ((max - p.value) / span) * (height - pad * 2);
    return { x, y };
  });
  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {title}
        {unit ? ` (${unit})` : ''}
      </Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={colors.border} strokeWidth={1} />
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
