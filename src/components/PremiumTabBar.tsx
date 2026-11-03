import uiI18n from "../i18n";
import React from 'react';
import { SafeAreaView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumTheme, goldGradient } from '../theme/colors';
export default function PremiumTabBar({ route, onNavigate, dark, language }: { route: string; onNavigate: (route: string) => void; dark: boolean; language: string }) {
  const c = premiumTheme(dark);
  const es = language.startsWith('es');
  const tabs = [['dashboard', uiI18n.t("localized.PremiumTabBar.tabs.item0.item1.text8")], ['medications', uiI18n.t("localized.PremiumTabBar.tabs.item1.item1.text8")], ['reminders', uiI18n.t("localized.PremiumTabBar.tabs.item2.item1.text8")], ['settings', uiI18n.t("localized.PremiumTabBar.tabs.item3.item1.text8")]];
  return <SafeAreaView style={{ backgroundColor: c.card, borderTopWidth: 1, borderColor: c.border }}>
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', minHeight: 60 }}>
      {tabs.map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: route === key }} onPress={() => onNavigate(key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 3 }}>
        {route === key && <LinearGradient colors={goldGradient} style={{ position: 'absolute', top: 0, height: 3, width: 32, borderRadius: 2 }} />}
        <Text style={{ color: route === key ? c.accent : c.sub, fontSize: 12, fontWeight: route === key ? '700' : '500', textAlign: 'center' }}>{label}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}
