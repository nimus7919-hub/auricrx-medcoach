/**
 * Medication Reference Screen
 * 
 * A user-initiated reference lookup for medication pairing information.
 * Shows unedited source text from official sources.
 * 
 * COMPLIANCE: Designed for COFEPRIS compliance (Mexico medical device regulations).
 * - User must manually select two medications
 * - No automatic checking or background analysis
 * - No severity ratings, clinical advice, or recommendations
 * - No "no interactions found" messages (shows disclaimer instead)
 * - Always directs users to consult healthcare providers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicationReferenceService, {
  MedicationReferenceEntry,
  ReferenceSource,
} from '../services/medicationReferenceService';
import { validateComplianceText } from '../config/complianceFeatures';

interface Medication {
  id: string;
  name: string;
  type?: string;
}

export default function MedicationReferenceScreen() {
  const { t, i18n } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMed1, setSelectedMed1] = useState<string>('');
  const [selectedMed2, setSelectedMed2] = useState<string>('');
  const [manualMed1, setManualMed1] = useState<string>('');
  const [manualMed2, setManualMed2] = useState<string>('');
  const [results, setResults] = useState<MedicationReferenceEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const referenceService = MedicationReferenceService.getInstance();
  const currentLanguage = i18n.language === 'es' ? 'es' : 'en';

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const medicationsData = await AsyncStorage.getItem('medications');
      const supplementsData = await AsyncStorage.getItem('supplements');
      
      const loadedMedications: Medication[] = [];
      
      if (medicationsData) {
        const meds = JSON.parse(medicationsData);
        loadedMedications.push(...meds.map((m: any) => ({
          id: m.id,
          name: m.name,
          type: 'medication'
        })));
      }
      
      if (supplementsData) {
        const supps = JSON.parse(supplementsData);
        loadedMedications.push(...supps.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: 'supplement'
        })));
      }
      
      setMedications(loadedMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const handleSearch = () => {
    const med1 = selectedMed1 || manualMed1;
    const med2 = selectedMed2 || manualMed2;

    if (!med1 || !med2) {
      Alert.alert(
        t('medicationReference.title'),
        t('medicationReference.needTwoMedications')
      );
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Simulate a brief search delay for better UX
    setTimeout(() => {
      const searchResults = referenceService.searchReferences(med1, med2);
      setResults(searchResults);
      setIsSearching(false);
    }, 500);
  };

  const handleOpenSource = (sourceUrl: string) => {
    Linking.openURL(sourceUrl).catch(err => {
      console.error('Error opening source URL:', err);
      Alert.alert(
        t('ui.error'),
        'Could not open link'
      );
    });
  };

  const renderReferenceEntry = (entry: MedicationReferenceEntry) => {
    const source = referenceService.getSource(entry.sourceId);
    if (!source) return null;

    const sourceName = currentLanguage === 'es' ? source.nameEs : source.name;
    const sourceText = currentLanguage === 'es' ? entry.sourceTextEs : entry.sourceText;

    // Validate compliance in development
    if (__DEV__) {
      validateComplianceText(sourceText, 'Reference entry display');
    }

    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.medicationPair}>
          <Text style={styles.medicationPairText}>
            {entry.medication1} + {entry.medication2}
          </Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {t('medicationReference.referenceDisclaimer')}
          </Text>
        </View>

        <View style={styles.sourceTextBox}>
          <Text style={styles.sourceTextLabel}>
            {t('medicationReference.sourceText')}
          </Text>
          <Text style={styles.sourceText}>
            {sourceText}
          </Text>
        </View>

        <View style={styles.sourceInfo}>
          <Text style={styles.sourceLabel}>
            {t('medicationReference.source')}:
          </Text>
          <Text style={styles.sourceName}>{sourceName}</Text>
          
          <Text style={styles.sourceLabel}>
            {t('medicationReference.lastChecked')}:
          </Text>
          <Text style={styles.sourceDate}>{entry.lastUpdated}</Text>

          {entry.sourceUrl && (
            <TouchableOpacity
              style={styles.viewSourceButton}
              onPress={() => handleOpenSource(entry.sourceUrl!)}
            >
              <Text style={styles.viewSourceButtonText}>
                {t('medicationReference.viewSource')} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderNoResults = () => {
    if (!hasSearched) return null;

    const disclaimerText = referenceService.getNoMatchDisclaimerText(currentLanguage);

    return (
      <View style={styles.noResultsContainer}>
        <Text style={styles.noResultsTitle}>
          {t('medicationReference.noMatchFound')}
        </Text>
        
        <View style={styles.noMatchDisclaimerBox}>
          <Text style={styles.noMatchDisclaimerText}>
            {disclaimerText}
          </Text>
        </View>

        <Text style={styles.alwaysConsultText}>
          {t('medicationReference.alwaysConsult')}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('medicationReference.title')}</Text>
        <Text style={styles.subtitle}>{t('medicationReference.subtitle')}</Text>
      </View>

      <View style={styles.selectionSection}>
        <Text style={styles.sectionTitle}>
          {t('medicationReference.selectTwoMedications')}
        </Text>

        {medications.length > 0 && (
          <View style={styles.pickListSection}>
            <Text style={styles.pickListLabel}>
              {t('medicationReference.pickFromYourList')}
            </Text>
            
            <View style={styles.medicationPicker}>
              <Text style={styles.pickerLabel}>
                {t('medicationReference.selectFirstMedication')}
              </Text>
              <ScrollView style={styles.medicationList} horizontal>
                {medications.map(med => (
                  <TouchableOpacity
                    key={`med1-${med.id}`}
                    style={[
                      styles.medicationChip,
                      selectedMed1 === med.name && styles.medicationChipSelected
                    ]}
                    onPress={() => {
                      setSelectedMed1(med.name);
                      setManualMed1('');
                    }}
                  >
                    <Text style={[
                      styles.medicationChipText,
                      selectedMed1 === med.name && styles.medicationChipTextSelected
                    ]}>
                      {med.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.medicationPicker}>
              <Text style={styles.pickerLabel}>
                {t('medicationReference.selectSecondMedication')}
              </Text>
              <ScrollView style={styles.medicationList} horizontal>
                {medications.map(med => (
                  <TouchableOpacity
                    key={`med2-${med.id}`}
                    style={[
                      styles.medicationChip,
                      selectedMed2 === med.name && styles.medicationChipSelected
                    ]}
                    onPress={() => {
                      setSelectedMed2(med.name);
                      setManualMed2('');
                    }}
                  >
                    <Text style={[
                      styles.medicationChipText,
                      selectedMed2 === med.name && styles.medicationChipTextSelected
                    ]}>
                      {med.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        <View style={styles.manualEntrySection}>
          <Text style={styles.orText}>
            {t('medicationReference.orEnterManually')}
          </Text>
          
          <TextInput
            style={styles.textInput}
            placeholder={t('medicationReference.medication1Placeholder')}
            value={manualMed1}
            onChangeText={text => {
              setManualMed1(text);
              setSelectedMed1('');
            }}
          />
          
          <TextInput
            style={styles.textInput}
            placeholder={t('medicationReference.medication2Placeholder')}
            value={manualMed2}
            onChangeText={text => {
              setManualMed2(text);
              setSelectedMed2('');
            }}
          />
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          <Text style={styles.searchButtonText}>
            {isSearching
              ? t('medicationReference.searchingReferences')
              : t('medicationReference.searchReferences')}
          </Text>
        </TouchableOpacity>
      </View>

      {hasSearched && (
        <View style={styles.resultsSection}>
          {results.length > 0 ? (
            results.map(renderReferenceEntry)
          ) : (
            renderNoResults()
          )}
        </View>
      )}

      <View style={styles.sourcesSection}>
        <Text style={styles.sourcesTitle}>{t('medicationReference.sources')}</Text>
        {referenceService.getAllSources().map((source: ReferenceSource) => (
          <TouchableOpacity
            key={source.id}
            style={styles.sourceItem}
            onPress={() => handleOpenSource(source.url)}
          >
            <Text style={styles.sourceItemName}>
              {currentLanguage === 'es' ? source.nameEs : source.name}
            </Text>
            <Text style={styles.sourceItemDate}>
              {t('medicationReference.lastChecked')}: {source.lastChecked}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectionSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  pickListSection: {
    marginBottom: 20,
  },
  pickListLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 12,
  },
  medicationPicker: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  medicationList: {
    flexDirection: 'row',
  },
  medicationChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  medicationChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  medicationChipText: {
    fontSize: 14,
    color: '#333',
  },
  medicationChipTextSelected: {
    color: '#fff',
  },
  manualEntrySection: {
    marginTop: 8,
  },
  orText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    margin: 16,
  },
  entryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationPair: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationPairText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  sourceTextBox: {
    marginBottom: 16,
  },
  sourceTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  sourceInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  sourceDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  viewSourceButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSourceButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noResultsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  noMatchDisclaimerBox: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  noMatchDisclaimerText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
    textAlign: 'center',
  },
  alwaysConsultText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
  sourcesSection: {
    margin: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sourceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sourceItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  sourceItemDate: {
    fontSize: 12,
    color: '#888',
  },
});
