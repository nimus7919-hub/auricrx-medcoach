import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function SignUp() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign up</Text>
        <Text style={styles.sub}>Replace with your registration flow.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#E9C978", fontSize: 28, fontWeight: "700" },
  sub: { color: "#B5B5B5", marginTop: 8 },
});
