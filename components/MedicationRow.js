import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MedicationRow({ time, name, onMark, onMissed, onLocate }) {
  return (
    <View style={styles.rowContainer}>
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{time}</Text>
      </View>

      <Text style={styles.medName} numberOfLines={1}>{name}</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.btn} onPress={onMark}>
          <Text style={styles.btnText}>Mark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onMissed}>
          <Text style={styles.btnText}>Missed?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.locate]} onPress={onLocate}>
          <Text style={styles.btnText}>Locate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#0f1a27',
    borderRadius: 16,
    marginBottom: 12,
  },
  timeBadge: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f87ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  medName: { flex: 1, marginHorizontal: 12, color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: '#3a7bfd', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  locate: { backgroundColor: '#22c55e' },
});
