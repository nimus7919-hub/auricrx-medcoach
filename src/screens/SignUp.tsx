import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function SignUp() {
  useUILanguage();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={styles.container}>
        <Text style={styles.title}>{uiI18n.t("ui.signUp_0b8149")}</Text>
        <Text style={styles.sub}>{uiI18n.t("ui.replaceWithYourRegistrationFlow")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#E9C978", fontSize: 28, fontWeight: "700" },
  sub: { color: "#B5B5B5", marginTop: 8 },
});
