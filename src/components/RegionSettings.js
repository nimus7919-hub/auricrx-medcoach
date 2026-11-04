import { auth } from '../config/firebase';
import { disconnectHealth } from '../services/healthConnectService';
import React, { useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../providers/RegionProvider';
import { saveUSStartupConsent } from '../services/region';
import { consentRequest } from '../services/consentService';
import { US_POLICIES } from '../legal/usPolicies';
import notices from '../legal/usDisclaimers.json';
export default function RegionSettings() {
  const { region, changeRegion, withdraw } = useRegion();
  const { t } = useTranslation();
  const [document, setDocument] = useState('');
  const button = (label, action) => <TouchableOpacity accessibilityRole="button" onPress={action} style={{ paddingVertical: 14 }}><Text style={{ color: '#D4AF37' }}>{label}</Text></TouchableOpacity>;
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
  return <View style={{ padding: 16 }}>
    <Text style={{ color: '#D4AF37', fontWeight: '700' }}>{t('region.title')}</Text>
    {button(`${region === 'MX' ? '[x]' : '[ ]'} ${t('region.mx')}`, () => changeRegion('MX'))}
    {button(`${region === 'US' ? '[x]' : '[ ]'} ${t('region.us')}`, () => changeRegion('US'))}
    {region === 'US' && <>
      {button('Withdraw health-data collection consent', () => revoke('collect'))}
      {button('Withdraw processor-sharing consent', () => revoke('share'))}
      {Object.keys(US_POLICIES).map(key => <View key={key}>{button(key, () => setDocument(document ? '' : US_POLICIES[key]))}</View>)}
      {!!document && <Text style={{ color: '#D4AF37' }}>{document}</Text>}
      <Text style={{ color: '#D4AF37', fontWeight: '700' }}>Help</Text>
      <Text style={{ color: '#D4AF37' }}>{notices.crisis}</Text>
      {button('Call 911', () => Linking.openURL('tel:911'))}
      {button('Call 988', () => Linking.openURL('tel:988'))}
      {button('Poison Control: 1-800-222-1222', () => Linking.openURL('tel:18002221222'))}
      <Text style={{ color: '#D4AF37' }}>Sources and attributions</Text>
      {['nlm', 'fda', 'dailymed', 'nadac', 'nppes', 'costplus', 'prices'].map(key => <Text key={key} style={{ color: '#D4AF37', marginTop: 10 }}>{notices[key].replace('[date]', 'shown with each result')}</Text>)}
    </>}
  </View>;
}
