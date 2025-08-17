import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EXPO_PUBLIC_OPENAI_API_KEY, EXPO_PUBLIC_API_MODEL } from '@env';

export default function EnvCheck() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Env Check</Text>
      <Text>API Key: {EXPO_PUBLIC_OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"}</Text>
      <Text>Model: {EXPO_PUBLIC_API_MODEL || "❌ Missing"}</Text>
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
