import { auth } from '../config/firebase';
import { disconnectHealth } from '../services/auricHealthConnect';
import React, { useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../providers/RegionProvider';
import { saveUSStartupConsent } from '../services/region';
import { consentRequest } from '../services/consentService';
import { US_POLICIES } from '../legal/usPolicies';
import notices from '../legal/usDisclaimers.json';
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from './DynamicText';
import { styles } from '../screens/appStyles';

const GOLD = '#D4AF37';
const NAVY = '#0B1F3A';
const SOURCES = ['nlm', 'fda', 'dailymed', 'nadac', 'nppes', 'costplus', 'prices'];

function Card({ title, open, onToggle, children, accent }) {
  const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  return (
    <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: accent || getCardBorderColor() }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} disabled={!onToggle} activeOpacity={0.7} accessibilityRole="button" accessibilityState={onToggle ? { expanded: !!open } : undefined}>
        <DynamicText type="card" style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold', flex: 1 }]}>{title}</DynamicText>
        {!!onToggle && <Text style={{ color: GOLD, fontSize: 18, transform: [{ rotate: open ? '90deg' : '0deg' }] }}>▶</Text>}
      </TouchableOpacity>
      {(!onToggle || open) && <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>{children}</View>}
    </View>
  );
}

function Row({ label, onPress, open, destructive, last }) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: GOLD + '33' }}>
      <DynamicText type="card" style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: destructive ? '#F87171' : undefined }}>{label}</DynamicText>
      <Text style={{ color: destructive ? '#F87171' : GOLD, fontSize: 14, transform: [{ rotate: open ? '90deg' : '0deg' }] }}>▶</Text>
    </TouchableOpacity>
  );
}

function CallButton({ label, sub, tel, primary }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label} ${sub}`} onPress={() => Linking.openURL(`tel:${tel}`)} activeOpacity={0.8}
      style={{ flex: 1, minWidth: 92, margin: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center',
        backgroundColor: primary ? '#B91C1C' : GOLD, borderWidth: 2, borderColor: primary ? '#7F1D1D' : '#A8892A' }}>
      <Text style={{ color: primary ? '#FFFFFF' : NAVY, fontFamily: 'Inter_700Bold', fontSize: 16 }}>📞 {label}</Text>
      <Text style={{ color: primary ? '#FFFFFF' : NAVY, fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2, textAlign: 'center' }}>{sub}</Text>
    </TouchableOpacity>
  );
}

export default function RegionSettings() {
  const { region, changeRegion, withdraw } = useRegion();
  const { t } = useTranslation();
  const [document, setDocument] = useState('');
  const [open, setOpen] = useState({ legal: false, consents: false, sources: false });
  const toggle = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const revoke = async kind => {
    try {
      await consentRequest('POST', { terms: true, privacy: true, health: kind !== 'collect', share: kind !== 'share' });
      await saveUSStartupConsent({ terms: true, adult: true, collect: kind !== 'collect', share: kind !== 'share' });
      await disconnectHealth(auth.currentUser?.uid).catch(() => {});
      const notifications = require('expo-notifications');
      await notifications.cancelAllScheduledNotificationsAsync();
      withdraw();
    } catch { Alert.alert('Consent withdrawal could not be saved. Please retry.'); }
  };
  const confirmRevoke = (kind, label) => Alert.alert(label, 'Are you sure? You can give consent again later.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Withdraw', style: 'destructive', onPress: () => revoke(kind) },
  ]);

  const regionOption = (code, label, flag) => {
    const selected = region === code;
    return (
      <TouchableOpacity key={code} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => !selected && changeRegion(code)} activeOpacity={0.8}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10,
          backgroundColor: selected ? GOLD : 'transparent' }}>
        <Text style={{ fontSize: 18, marginRight: 6 }}>{flag}</Text>
        <Text style={{ color: selected ? NAVY : GOLD, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{label}</Text>
        {selected && <Text style={{ color: NAVY, fontSize: 14, marginLeft: 6 }}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const policyKeys = Object.keys(US_POLICIES);
  return (
    <View>
      <Card title={t('region.title')}>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', borderWidth: 2, borderColor: GOLD, borderRadius: 12, padding: 3 }}>
          {regionOption('MX', t('region.mx'), '🇲🇽')}
          {regionOption('US', t('region.us'), '🇺🇸')}
        </View>
      </Card>

      {region === 'US' && <>
        <Card title="Emergency help" accent="#B91C1C">
          <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.9, marginBottom: 10 }}>{notices.crisis}</DynamicText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            <CallButton label="911" sub="Emergency" tel="911" primary />
            <CallButton label="988" sub="Crisis Lifeline" tel="988" />
            <CallButton label="Poison" sub="1-800-222-1222" tel="18002221222" />
          </View>
        </Card>

        <Card title="Legal & Privacy" open={open.legal} onToggle={() => toggle('legal')}>
          {policyKeys.map((key, i) => {
            const isOpen = document === US_POLICIES[key];
            return <View key={key}>
              <Row label={key} open={isOpen} last={i === policyKeys.length - 1 && !isOpen} onPress={() => setDocument(isOpen ? '' : US_POLICIES[key])} />
              {isOpen && <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.9, paddingVertical: 10 }}>{document}</DynamicText>}
            </View>;
          })}
        </Card>

        <Card title="Your consents" open={open.consents} onToggle={() => toggle('consents')}>
          <Row destructive label="Withdraw health-data collection consent" onPress={() => confirmRevoke('collect', 'Withdraw health-data collection consent')} />
          <Row destructive last label="Withdraw processor-sharing consent" onPress={() => confirmRevoke('share', 'Withdraw processor-sharing consent')} />
        </Card>

        <Card title="Sources and attributions" open={open.sources} onToggle={() => toggle('sources')}>
          {SOURCES.map(key => <DynamicText key={key} type="card" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.85, marginTop: 8 }}>{notices[key].replace('[date]', 'shown with each result')}</DynamicText>)}
        </Card>
      </>}
    </View>
  );
}
