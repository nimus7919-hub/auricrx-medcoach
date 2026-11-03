import React, { useMemo, useState } from 'react';
import { FlatList, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Modal from '../components/BackModal';
import { HERBS } from '../data/herbCatalog.js';
import { findHerbInteractions, getMedicationIngredients } from '../data/herbInteractions.js';

const GENERAL_SOURCE = {
  name: 'NCCIH', url: 'https://www.nccih.nih.gov/health/using-dietary-supplements-wisely', checked: '2026-11-03',
};
const LANGUAGES = ['es', 'en', 'fr', 'de', 'pt', 'zh'];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function HerbsReviewScreen({ onClose, currentLang, medications = [] }) {
  // Hooks always run at component level, including while the modal is closed.
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const requestedLanguage = (currentLang || i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
  const language = LANGUAGES.includes(requestedLanguage) ? requestedLanguage : 'es';
  const tr = (key, options = {}) => t(`herbReview.${key}`, { ...options, lng: language });
  const nameOf = herb => herb.names[language] || herb.names.en;
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return HERBS.filter(herb => !term || Object.values(herb.names).some(name => normalize(name).includes(term)) ||
      normalize(herb.key.replace(/_/g, ' ')).includes(term));
  }, [query]);
  const matches = useMemo(() => selected ? findHerbInteractions(selected.key, medications) : [], [selected, medications]);
  const missingIngredients = medications.some(med => med && !getMedicationIngredients(med).length);

  const openSource = url => { void Linking.openURL(url).catch(() => {}); };
  const sourceLink = source => (
    <TouchableOpacity accessibilityRole="link" onPress={() => openSource(source.url)} style={styles.sourceButton}>
      <Text style={styles.source}>{tr('source', { source: source.name, date: source.checked })}</Text>
    </TouchableOpacity>
  );
  const footer = <Text style={styles.footer}>{tr('footer')}</Text>;
  const risk = herb => <Text style={styles.risk}>{tr(herb.safety)}</Text>;
  const herbImage = (herb, large = false) => (
    <View>
      <Image source={herb.image} accessibilityLabel={nameOf(herb)} resizeMode="contain" style={large ? styles.modalImage : styles.image} />
      {!herb.imageVerified && <Text style={styles.caption}>{tr('imagePending')}</Text>}
    </View>
  );
  const summary = herb => {
    const text = herb.summaryKey ? tr(herb.summaryKey) : '';
    // The extra sentence is only used for the traditional use covered by an
    // explicitly insufficient-evidence NCCIH source. Never generalized to all uses.
    return [text, herb.specificSource && herb.summaryKey && herb.evidence ? tr('uncertain') : ''].filter(Boolean).join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('close')}>
          <Image source={require('../../assets/AuricRX_home_button_across_screens.png')} style={styles.home} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('herbs.title', { lng: language })}</Text>
      </View>
      <TextInput value={query} onChangeText={setQuery} style={styles.search} autoCorrect={false}
        placeholder={t('herbs.search', { lng: language })} placeholderTextColor="#BAC5D5"
        accessibilityLabel={t('herbs.search', { lng: language })} />
      <FlatList data={filtered} keyExtractor={herb => herb.id} numColumns={2}
        contentContainerStyle={styles.list} columnWrapperStyle={styles.row} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.body}>{t('herbs.noResults', { lng: language })}</Text>}
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setSelected(item)} accessibilityRole="button" accessibilityLabel={nameOf(item)}>
              {herbImage(item)}
              <Text style={styles.name}>{nameOf(item)}</Text>
              {risk(item)}
              {!!item.evidence && <Text style={styles.caption}>{tr(item.evidence)}</Text>}
            </TouchableOpacity>
            {sourceLink(item.source)}
          </View>
        )} />
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.title}>{selected ? nameOf(selected) : ''}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel={tr('close')} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {selected && <>
                {herbImage(selected, true)}
                <Text style={styles.label}>{tr('safety')}</Text>
                {risk(selected)}
                {!!selected.evidence && <Text style={styles.body}>{tr(selected.evidence)}</Text>}
                {!!summary(selected) && <Text style={styles.body}>{summary(selected)}</Text>}
                {!selected.specificSource && selected.summaryKey !== 'notReviewed' && <Text style={styles.body}>{tr('notReviewed')}</Text>}
                {sourceLink(selected.source)}
                <Text style={styles.label}>{tr('precautions')}</Text>
                {selected.precautionKeys.map(key => <View key={key}>
                  <Text style={styles.body}>{tr(key)}</Text>
                  {sourceLink(selected.precautionSource || selected.source)}
                </View>)}
                <Text style={styles.body}>{tr('generalPrecaution')}</Text>
                {sourceLink(GENERAL_SOURCE)}
                <Text style={styles.label}>{tr('interactions')}</Text>
                {/* No guessed interactions and no affirmative empty-state verdict. */}
                {selected.interactionKeys.map(key => <Text key={key} style={styles.body}>{tr(`class_${key}`)}</Text>)}
                {!!selected.interactionKeys.length && sourceLink(selected.source)}
                <Text style={styles.label}>{tr('personal')}</Text>
                {matches.length ? matches.map((match, index) => <View key={index} style={styles.alert}>
                  <Text style={styles.body}>{tr('alert', {
                    source: match.source, herb: nameOf(selected),
                    medication: match.medication.name || getMedicationIngredients(match.medication).join(' + '),
                  })}</Text>
                  {sourceLink({ name: match.source, url: match.url, checked: match.checked })}
                  <Text style={styles.caption}>{tr('checked', { date: match.checked })}</Text>
                </View>) : <Text style={styles.body}>{tr('noMatches')}</Text>}
                {missingIngredients && <Text style={styles.body}>{tr('ingredientMissing')}</Text>}
                {footer}
              </>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071426' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#9F8548' },
  home: { width: 140, height: 68 },
  title: { color: '#E2C57D', fontSize: 21, fontWeight: '700', flexShrink: 1 },
  search: { color: '#F3F5F9', borderColor: '#9F8548', borderWidth: 1, borderRadius: 16, margin: 16, padding: 14, backgroundColor: '#10213A' },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { gap: 12, alignItems: 'stretch' },
  card: { flex: 1, maxWidth: '50%', padding: 12, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: '#9F8548', backgroundColor: '#10213A' },
  image: { width: '100%', height: 125, marginBottom: 8 },
  name: { color: '#F4E3B1', fontSize: 16, fontWeight: '600', marginVertical: 6 },
  risk: { color: '#E2C57D', fontSize: 14, lineHeight: 20, marginVertical: 6 },
  caption: { color: '#BAC5D5', fontSize: 12, lineHeight: 18 },
  sourceButton: { paddingVertical: 10 },
  source: { color: '#E2C57D', textDecorationLine: 'underline', fontSize: 12, lineHeight: 18 },
  body: { color: '#F3F5F9', fontSize: 15, lineHeight: 23, marginVertical: 6 },
  label: { color: '#E2C57D', fontSize: 17, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  footer: { color: '#BAC5D5', fontSize: 13, lineHeight: 21, marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderColor: '#9F8548' },
  overlay: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', padding: 16 },
  modal: { maxHeight: '90%', width: '100%', maxWidth: 620, alignSelf: 'center', flexShrink: 1, borderRadius: 20, borderWidth: 1, borderColor: '#9F8548', backgroundColor: '#10213A', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#E2C57D', fontSize: 30 },
  modalScroll: { flexShrink: 1 },
  modalBody: { padding: 20, paddingBottom: 36 },
  modalImage: { width: '100%', height: 190 },
  alert: { borderWidth: 1, borderColor: '#9F8548', borderRadius: 12, padding: 12, marginVertical: 8 },
});
