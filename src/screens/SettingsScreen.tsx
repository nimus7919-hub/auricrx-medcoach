import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Gold palette
const GOLD = {
  hi: "#FFF3D2",
  a200: "#FDE68A",
  a300: "#FCD34D",
  y400: "#FACC15",
  a400: "#FBBF24",
  a500: "#F59E0B",
  y600: "#CA8A04",
  accent: "#FFB020",
};

interface UserData {
  uniqueId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

interface SettingsScreenProps {
  userData?: UserData;
  onSignOut: () => void;
}

export default function SettingsScreen({ userData, onSignOut }: SettingsScreenProps) {
  useUILanguage();
  const [activeTab, setActiveTab] = useState<'account' | 'theme' | 'language'>('account');

  const handleSignOut = () => {
    Alert.alert(
      uiI18n.t("settings.signOut"),
      uiI18n.t("ui.areYouSureYouWantToSignOut"),
      [
        { text: uiI18n.t("healthAnalytics.cancel"), style: 'cancel' },
        { text: uiI18n.t("settings.signOut"), style: 'destructive', onPress: onSignOut },
      ]
    );
  };

  const renderAccountDetails = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{uiI18n.t("ui.accountDetails")}</Text>
      
      {userData ? (
        <View style={styles.accountInfo}>
          <InfoRow label={uiI18n.t("ui.uniqueId")} value={userData.uniqueId} />
          <InfoRow label={uiI18n.t("ui.firstName")} value={userData.firstName} />
          <InfoRow label={uiI18n.t("ui.lastName")} value={userData.lastName} />
          <InfoRow label={uiI18n.t("ui.username")} value={userData.username} />
          <InfoRow label={uiI18n.t("adminProfile.email")} value={userData.email} />
          <InfoRow label={uiI18n.t("adminProfile.phoneNumber")} value={userData.phoneNumber} />
          <InfoRow label={uiI18n.t("ui.memberSince")} value={new Date(userData.createdAt).toLocaleDateString()} />
        </View>
      ) : (
        <Text style={styles.noDataText}>{uiI18n.t("ui.noAccountDataAvailable")}</Text>
      )}
    </View>
  );

  const renderThemeSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{uiI18n.t("ui.themeSettings")}</Text>
      <Text style={styles.comingSoonText}>{uiI18n.t("ui.themeCustomizationComingSoon")}</Text>
    </View>
  );

  const renderLanguageSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{uiI18n.t("ui.languageSettings")}</Text>
      <Text style={styles.comingSoonText}>{uiI18n.t("ui.languageSelectionComingSoon")}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{uiI18n.t("settings.title")}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'account' && styles.activeTab]}
            onPress={() => setActiveTab('account')}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>{uiI18n.t("ui.accountDetails")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'theme' && styles.activeTab]}
            onPress={() => setActiveTab('theme')}
          >
            <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>{uiI18n.t("ui.theme")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'language' && styles.activeTab]}
            onPress={() => setActiveTab('language')}
          >
            <Text style={[styles.tabText, activeTab === 'language' && styles.activeTabText]}>{uiI18n.t("settings.language")}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'account' && renderAccountDetails()}
          {activeTab === uiI18n.t("ui.theme_dc151a") && renderThemeSettings()}
          {activeTab === uiI18n.t("settings.language") && renderLanguageSettings()}
        </ScrollView>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>{uiI18n.t("settings.signOut")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Info row component
function InfoRow({ label, value }: { label: string; value: string }) {
  useUILanguage();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    color: GOLD.y400,
    fontSize: 28,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "rgba(251,191,36,0.1)",
    borderColor: GOLD.a400,
  },
  tabText: {
    color: "#E9C978",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: GOLD.y400,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: GOLD.a300,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  accountInfo: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251,191,36,0.1)",
  },
  infoLabel: {
    color: "#E9C978",
    fontSize: 16,
    fontWeight: "500",
  },
  infoValue: {
    color: GOLD.y400,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  noDataText: {
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  comingSoonText: {
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  footer: {
    padding: 20,
  },
  signOutButton: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});

/** Cross-platform shadow helper */
function shadow(x: number, y: number, blur: number, color: string) {
  if (Platform.OS === "ios") {
    return {
      shadowColor: color,
      shadowOpacity: 1,
      shadowRadius: blur / 2,
      shadowOffset: { width: x, height: y },
    };
  }
  return { elevation: Math.max(2, Math.min(12, Math.floor(blur / 2))) };
}
