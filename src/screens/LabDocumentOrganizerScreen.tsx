import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { useWallpaper } from '../contexts/WallpaperContext';
import LabDocumentService, { Document, LabValue, DoctorQuestion } from '../services/labDocumentService';
import FamilyCircleService, { FamilyMember } from '../services/familyCircleService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDateTimePickerLocale } from '../utils/dateTimeLocale';

type Tab = 'documents' | 'labValues' | 'glossary' | 'questions';

export default function LabDocumentOrganizerScreen({ onClose, openFindLab }: { onClose: () => void; openFindLab?: () => void }) {
  const { t, i18n } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddLabValue, setShowAddLabValue] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [newLabTest, setNewLabTest] = useState('');
  const [newLabValue, setNewLabValue] = useState('');
  const [newLabUnit, setNewLabUnit] = useState('');
  const [newLabDate, setNewLabDate] = useState(new Date());
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  
  const [newQuestion, setNewQuestion] = useState('');
  
  const labService = LabDocumentService.getInstance();
  const familyService = FamilyCircleService.getInstance();
  const glossary = labService.getLabGlossary();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const docs = await labService.getDocuments();
    const values = await labService.getLabValues();
    const qs = await labService.getDoctorQuestions();
    const members = await familyService.getMembers();
    setDocuments(docs);
    setLabValues(values);
    setQuestions(qs);
    setFamilyMembers(members);
  };

  const handleAddLabValue = async () => {
    if (!newLabTest.trim() || !newLabValue.trim()) {
      Alert.alert(t('common.error'), t('labOrganizer.enterTestAndValue'));
      return;
    }

    await labService.addLabValue({
      testName: newLabTest.trim(),
      value: newLabValue.trim(),
      unit: newLabUnit.trim(),
      date: newLabDate.toISOString(),
      familyMemberId: selectedMemberId,
      memberName: selectedMemberId ? familyMembers.find(m => m.id === selectedMemberId)?.name : undefined,
    });

    setNewLabTest('');
    setNewLabValue('');
    setNewLabUnit('');
    setNewLabDate(new Date());
    setSelectedMemberId(undefined);
    setShowAddLabValue(false);
    loadData();
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert(t('common.error'), t('labOrganizer.enterQuestion'));
      return;
    }

    await labService.addDoctorQuestion({
      question: newQuestion.trim(),
    });

    setNewQuestion('');
    setShowAddQuestion(false);
    loadData();
  };

  const handleDeleteLabValue = async (id: string) => {
    Alert.alert(
      t('common.confirmDelete'),
      t('labOrganizer.deleteLabValue'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await labService.deleteLabValue(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteQuestion = async (id: string) => {
    Alert.alert(
      t('common.confirmDelete'),
      t('labOrganizer.deleteQuestion'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await labService.deleteDoctorQuestion(id);
            loadData();
          },
        },
      ]
    );
  };

  const renderDocuments = () => (
    <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
      <DynamicText type="card" style={styles.sectionTitle}>{t('labOrganizer.documents')}</DynamicText>
      <DynamicText type="card" style={styles.sectionDescription}>{t('labOrganizer.documentsDescription')}</DynamicText>
      
      {documents.length === 0 && (
        <DynamicText type="card" style={styles.emptyText}>{t('labOrganizer.noDocuments')}</DynamicText>
      )}

      {documents.map(doc => (
        <View key={doc.id} style={[styles.itemCard, { borderColor: getCardBorderColor() }]}>
          <View style={styles.itemHeader}>
            <DynamicText type="card" style={styles.itemTitle}>{doc.title}</DynamicText>
            <DynamicText type="card" style={styles.itemTag}>{t(`labOrganizer.types.${doc.type}`)}</DynamicText>
          </View>
          <DynamicText type="card" style={styles.itemDate}>📅 {new Date(doc.date).toLocaleDateString()}</DynamicText>
          {doc.memberName && (
            <DynamicText type="card" style={styles.itemMember}>👤 {doc.memberName}</DynamicText>
          )}
        </View>
      ))}

      <DynamicText type="card" style={styles.infoText}>{t('labOrganizer.documentsInfo')}</DynamicText>
    </View>
  );

  const renderLabValues = () => (
    <View>
      <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.sectionTitle}>{t('labOrganizer.labValues')}</DynamicText>
        <DynamicText type="card" style={styles.sectionDescription}>{t('labOrganizer.labValuesDescription')}</DynamicText>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getAccentColor() }]}
          onPress={() => setShowAddLabValue(true)}
        >
          <DynamicText type="button" style={styles.buttonText}>{t('labOrganizer.addLabValue')}</DynamicText>
        </TouchableOpacity>
      </View>

      {labValues.length === 0 && (
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.emptyText}>{t('labOrganizer.noLabValues')}</DynamicText>
        </View>
      )}

      {labValues.map(value => (
        <View key={value.id} style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <View style={styles.itemHeader}>
            <DynamicText type="card" style={styles.itemTitle}>{value.testName}</DynamicText>
            <TouchableOpacity onPress={() => handleDeleteLabValue(value.id)}>
              <DynamicText type="card" style={{ color: '#ff6b6b' }}>✕</DynamicText>
            </TouchableOpacity>
          </View>
          <DynamicText type="card" style={styles.labValueText}>
            {value.value} {value.unit}
          </DynamicText>
          <DynamicText type="card" style={styles.itemDate}>
            📅 {new Date(value.date).toLocaleDateString(getDateTimePickerLocale())}
          </DynamicText>
          {value.memberName && (
            <DynamicText type="card" style={styles.itemMember}>👤 {value.memberName}</DynamicText>
          )}
        </View>
      ))}

      <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.disclaimer}>{t('labOrganizer.noInterpretation')}</DynamicText>
      </View>
    </View>
  );

  const renderGlossary = () => (
    <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
      <DynamicText type="card" style={styles.sectionTitle}>{t('labOrganizer.glossary')}</DynamicText>
      <DynamicText type="card" style={styles.sectionDescription}>{t('labOrganizer.glossaryDescription')}</DynamicText>
      
      {Object.entries(glossary).map(([key, definitions]) => {
        const text = (i18n.language || '').startsWith('es') ? definitions.es : definitions.en;
        return (
          <View key={key} style={[styles.glossaryItem, { borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.glossaryText}>{text}</DynamicText>
          </View>
        );
      })}

      <DynamicText type="card" style={styles.disclaimer}>{t('labOrganizer.glossaryDisclaimer')}</DynamicText>
    </View>
  );

  const renderQuestions = () => (
    <View>
      <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.sectionTitle}>{t('labOrganizer.doctorQuestions')}</DynamicText>
        <DynamicText type="card" style={styles.sectionDescription}>{t('labOrganizer.doctorQuestionsDescription')}</DynamicText>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getAccentColor() }]}
          onPress={() => setShowAddQuestion(true)}
        >
          <DynamicText type="button" style={styles.buttonText}>{t('labOrganizer.addQuestion')}</DynamicText>
        </TouchableOpacity>
      </View>

      {questions.length === 0 && (
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.emptyText}>{t('labOrganizer.noQuestions')}</DynamicText>
        </View>
      )}

      {questions.map(q => (
        <View key={q.id} style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <View style={styles.itemHeader}>
            <DynamicText type="card" style={styles.questionText}>• {q.question}</DynamicText>
            <TouchableOpacity onPress={() => handleDeleteQuestion(q.id)}>
              <DynamicText type="card" style={{ color: '#ff6b6b' }}>✕</DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ModalScreenHeader
        title={t('labOrganizer.title')}
        onClose={onClose}
        backgroundColor={getCardBackgroundColor()}
        borderBottomColor={getCardBorderColor()}
      />

      <View style={[styles.tabs, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && { borderBottomColor: getAccentColor(), borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('documents')}
        >
          <DynamicText type="card" style={[styles.tabText, activeTab === 'documents' && { color: getAccentColor() }]}>
            {t('labOrganizer.documents')}
          </DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'labValues' && { borderBottomColor: getAccentColor(), borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('labValues')}
        >
          <DynamicText type="card" style={[styles.tabText, activeTab === 'labValues' && { color: getAccentColor() }]}>
            {t('labOrganizer.values')}
          </DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'glossary' && { borderBottomColor: getAccentColor(), borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('glossary')}
        >
          <DynamicText type="card" style={[styles.tabText, activeTab === 'glossary' && { color: getAccentColor() }]}>
            {t('labOrganizer.glossary')}
          </DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && { borderBottomColor: getAccentColor(), borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('questions')}
        >
          <DynamicText type="card" style={[styles.tabText, activeTab === 'questions' && { color: getAccentColor() }]}>
            {t('labOrganizer.questions')}
          </DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: FAB_SCROLL_PADDING }}>
        {/* F14: Lab organizer guardrail banner - Block I */}
        <View style={[styles.bannerCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.bannerText}>⚠️ {t('labOrganizer.banner')}</DynamicText>
        </View>

        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'labValues' && renderLabValues()}
        {activeTab === 'glossary' && renderGlossary()}
        {activeTab === 'questions' && renderQuestions()}
      </ScrollView>

      <Modal visible={showAddLabValue} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('labOrganizer.addLabValue')}</DynamicText>
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('labOrganizer.testName')}
              placeholderTextColor="#999"
              value={newLabTest}
              onChangeText={setNewLabTest}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
                placeholder={t('labOrganizer.value')}
                placeholderTextColor="#999"
                value={newLabValue}
                onChangeText={setNewLabValue}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.input, styles.halfInput, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
                placeholder={t('labOrganizer.unit')}
                placeholderTextColor="#999"
                value={newLabUnit}
                onChangeText={setNewLabUnit}
              />
            </View>

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: getCardBorderColor() }]}
              onPress={() => setShowDatePicker(true)}
            >
              <DynamicText type="card">{t('labOrganizer.date')}: {newLabDate.toLocaleDateString(getDateTimePickerLocale())}</DynamicText>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={newLabDate}
                mode="date"
                display="default"
                locale={getDateTimePickerLocale()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setNewLabDate(date);
                }}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowAddLabValue(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleAddLabValue}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.save')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddQuestion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('labOrganizer.addQuestion')}</DynamicText>
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor(), height: 100 }]}
              placeholder={t('labOrganizer.questionPlaceholder')}
              placeholderTextColor="#999"
              value={newQuestion}
              onChangeText={setNewQuestion}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowAddQuestion(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleAddQuestion}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.save')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  bannerCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16, backgroundColor: 'rgba(219, 182, 92, 0.1)' },
  bannerText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sectionDescription: { fontSize: 14, opacity: 0.8, marginBottom: 16, lineHeight: 20 },
  emptyText: { fontSize: 14, opacity: 0.6, fontStyle: 'italic' },
  itemCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  itemTag: { fontSize: 12, opacity: 0.7, marginLeft: 8 },
  itemDate: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  itemMember: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  labValueText: { fontSize: 18, fontWeight: 'bold', marginTop: 4, color: '#DBB65C' },
  glossaryItem: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  glossaryText: { fontSize: 14, lineHeight: 20 },
  questionText: { fontSize: 15, lineHeight: 22, flex: 1 },
  infoText: { fontSize: 13, opacity: 0.7, marginTop: 8, fontStyle: 'italic' },
  disclaimer: { fontSize: 12, opacity: 0.7, marginTop: 12, fontStyle: 'italic', lineHeight: 18 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 12, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  dateButton: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
});
