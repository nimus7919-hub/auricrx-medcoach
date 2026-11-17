import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { useWallpaper } from '../contexts/WallpaperContext';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { THIRD_PARTY_ART_CREDITS, type ArtCredit } from '../legal/thirdPartyArtCredits';
import { gold } from '../theme/colors';

/** Lists third-party artwork credits (title, author, license, source) from thirdPartyArtCredits.ts. */
export default function OpenSourceLicensesScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const text = getCardTextColor();
  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <DynamicText type="card" style={[styles.rowLabel, { color: gold.y400 }]}>{label}</DynamicText>
      <DynamicText type="card" style={[styles.rowValue, { color: text }]}>{value}</DynamicText>
    </View>
  );

  const Card = ({ c }: { c: ArtCredit }) => (
    <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
      <DynamicText type="card" style={[styles.cardTitle, { color: text }]}>{c.title}</DynamicText>
      <Row label={t('openSourceLicenses.usedFor')} value={c.layers.map((l) => t(`bodyMap.layers.${l}`)).join(', ')} />
      <Row label={t('openSourceLicenses.author')} value={c.author} />
      <Row label={t('openSourceLicenses.license')} value={c.license === 'Public domain' ? t('openSourceLicenses.publicDomain') : c.license} />
      <Row label={t('openSourceLicenses.source')} value={c.sourceUrl} />
      <View style={styles.links}>
        <TouchableOpacity accessibilityRole="link" accessibilityLabel={`${t('openSourceLicenses.openSource')}: ${c.title}`} onPress={() => open(c.sourceUrl)} style={styles.linkBtn}>
          <DynamicText type="card" style={[styles.link, { color: gold.y400 }]}>{t('openSourceLicenses.openSource')}</DynamicText>
        </TouchableOpacity>
        {c.licenseUrl ? (
          <TouchableOpacity accessibilityRole="link" accessibilityLabel={`${t('openSourceLicenses.viewLicense')}: ${c.license === 'Public domain' ? t('openSourceLicenses.publicDomain') : c.license}`} onPress={() => open(c.licenseUrl as string)} style={styles.linkBtn}>
            <DynamicText type="card" style={[styles.link, { color: gold.y400 }]}>{t('openSourceLicenses.viewLicense')}</DynamicText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ModalScreenHeader title={t('openSourceLicenses.title')} onClose={onClose} backgroundColor={getCardBackgroundColor()} borderBottomColor={getCardBorderColor()} />
      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: FAB_SCROLL_PADDING }]}>
        <DynamicText type="card" style={[styles.intro, { color: text }]}>{t('openSourceLicenses.intro')}</DynamicText>
        <DynamicText type="card" style={[styles.section, { color: gold.y400 }]}>{t('openSourceLicenses.sectionArt')}</DynamicText>
        {THIRD_PARTY_ART_CREDITS.map((c) => (
          <Card key={c.id} c={c} />
        ))}
        <DynamicText type="card" style={[styles.note, { color: text }]}>{t('openSourceLicenses.adapted')}</DynamicText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  intro: { fontSize: 14, lineHeight: 21, opacity: 0.85, marginBottom: 16 },
  section: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600', marginBottom: 10 },
  row: { marginBottom: 8 },
  rowLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  rowValue: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  linkBtn: { minHeight: 44, justifyContent: 'center', marginRight: 20 },
  link: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline' },
  note: { fontSize: 12, opacity: 0.7, lineHeight: 18, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
