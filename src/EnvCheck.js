import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { API_BASE_URL, API_MODEL } from '@env';

export default function EnvCheck() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Env Check</Text>
      <Text>Backend URL: {API_BASE_URL ? "✅ Loaded" : "❌ Missing"}</Text>
      <Text>Model: {API_MODEL || "❌ Missing"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
  },
});
