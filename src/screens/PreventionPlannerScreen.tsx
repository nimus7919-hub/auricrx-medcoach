import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import PreventionPlannerService, { CheckupTemplate, ScheduledCheckup } from '../services/preventionPlannerService';
import { getRegion } from '../services/region';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDateTimePickerLocale } from '../utils/dateTimeLocale';

export default function PreventionPlannerScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  
  const [checkups, setCheckups] = useState<ScheduledCheckup[]>([]);
  const [templates, setTemplates] = useState<CheckupTemplate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CheckupTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'screening' | 'checkup' | 'vaccine'>('checkup');
  
  const service = PreventionPlannerService.getInstance();
  const region = getRegion();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const c = await service.getScheduledCheckups();
    const t = service.getTemplates(region as 'MX' | 'US');
    setCheckups(c);
    setTemplates(t);
  };

  const handleAddFromTemplate = async (template: CheckupTemplate) => {
    setSelectedTemplate(template);
    setCustomName(t(template.nameKey));
    setCustomDescription(t(template.descriptionKey));
    setShowTemplates(false);
    setShowAddModal(true);
  };

  const handleAddCustom = () => {
    setSelectedTemplate(null);
    setCustomName('');
    setCustomDescription('');
    setShowTemplates(false);
    setShowAddModal(true);
  };

  const handleSaveCheckup = async () => {
    if (!customName.trim()) {
      Alert.alert(t('common.error'), t('prevention.enterName'));
      return;
    }

    await service.addCheckup({
      templateId: selectedTemplate?.id,
      name: customName.trim(),
      description: customDescription.trim(),
      category: selectedCategory,
      scheduledDate: selectedDate.toISOString(),
      completed: false,
      guidelineUrl: selectedTemplate?.guidelineUrl,
    });

    setShowAddModal(false);
    setCustomName('');
    setCustomDescription('');
    loadData();
  };

  const handleMarkCompleted = async (id: string, name: string) => {
    Alert.alert(
      t('prevention.markCompleted'),
      t('prevention.markCompletedMessage', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('prevention.markComplete'),
          onPress: async () => {
            await service.markCompleted(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      t('common.confirmDelete'),
      t('prevention.deleteMessage', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await service.deleteCheckup(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleOpenGuideline = (url: string) => {
    Linking.openURL(url);
  };

  const upcomingCheckups = checkups.filter(c => !c.completed && new Date(c.scheduledDate) >= new Date());
  const completedCheckups = checkups.filter(c => c.completed);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('prevention.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.description}>{t('prevention.screenBlurb')}</DynamicText>
          <DynamicText type="card" style={styles.disclaimer}>{t('prevention.disclaimer')}</DynamicText>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.halfButton, { backgroundColor: getAccentColor() }]}
              onPress={() => setShowTemplates(true)}
            >
              <DynamicText type="button" style={styles.buttonText}>{t('prevention.fromTemplate')}</DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.halfButton, { backgroundColor: getCardBorderColor() }]}
              onPress={handleAddCustom}
            >
              <DynamicText type="button" style={styles.buttonText}>{t('prevention.addCustom')}</DynamicText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('prevention.upcoming')}</DynamicText>
          
          {upcomingCheckups.length === 0 && (
            <DynamicText type="card" style={styles.emptyText}>{t('prevention.noUpcoming')}</DynamicText>
          )}

          {upcomingCheckups.map(checkup => (
            <View key={checkup.id} style={[styles.checkupCard, { borderColor: getCardBorderColor() }]}>
              <View style={styles.checkupHeader}>
                <DynamicText type="card" style={styles.checkupName}>{checkup.name}</DynamicText>
                <DynamicText type="card" style={styles.checkupCategory}>
                  {t(`prevention.category.${checkup.category}`)}
                </DynamicText>
              </View>
              <DynamicText type="card" style={styles.checkupDate}>
                📅 {new Date(checkup.scheduledDate).toLocaleDateString(getDateTimePickerLocale())}
              </DynamicText>
              {checkup.description && (
                <DynamicText type="card" style={styles.checkupDescription}>{checkup.description}</DynamicText>
              )}
              <View style={styles.checkupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: getAccentColor() }]}
                  onPress={() => handleMarkCompleted(checkup.id, checkup.name)}
                >
                  <DynamicText type="button" style={styles.actionButtonText}>✓ {t('prevention.complete')}</DynamicText>
                </TouchableOpacity>
                {checkup.guidelineUrl && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: getCardBorderColor() }]}
                    onPress={() => handleOpenGuideline(checkup.guidelineUrl!)}
                  >
                    <DynamicText type="button" style={styles.actionButtonText}>ℹ️ {t('prevention.info')}</DynamicText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {completedCheckups.length > 0 && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.sectionTitle}>{t('prevention.completed')}</DynamicText>
            
            {completedCheckups.map(checkup => (
              <View key={checkup.id} style={[styles.checkupCard, { borderColor: getCardBorderColor(), opacity: 0.7 }]}>
                <DynamicText type="card" style={styles.checkupName}>✓ {checkup.name}</DynamicText>
                <DynamicText type="card" style={styles.checkupDate}>
                  {t('prevention.completedOn')} {checkup.completedDate ? new Date(checkup.completedDate).toLocaleDateString(getDateTimePickerLocale()) : ''}
                </DynamicText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showTemplates} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('prevention.selectTemplate')}</DynamicText>
            
            <ScrollView style={styles.templateList}>
              {templates.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateItem, { borderColor: getCardBorderColor() }]}
                  onPress={() => handleAddFromTemplate(template)}
                >
                  <DynamicText type="card" style={styles.templateName}>{t(template.nameKey)}</DynamicText>
                  <DynamicText type="card" style={styles.templateDescription}>{t(template.descriptionKey)}</DynamicText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#666', marginTop: 12 }]}
              onPress={() => setShowTemplates(false)}
            >
              <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('prevention.scheduleCheckup')}</DynamicText>
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('prevention.checkupName')}
              placeholderTextColor="#999"
              value={customName}
              onChangeText={setCustomName}
            />
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor(), height: 80 }]}
              placeholder={t('prevention.description')}
              placeholderTextColor="#999"
              value={customDescription}
              onChangeText={setCustomDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: getCardBorderColor() }]}
              onPress={() => setShowDatePicker(true)}
            >
              <DynamicText type="card">{t('prevention.date')}: {selectedDate.toLocaleDateString(getDateTimePickerLocale())}</DynamicText>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                locale={getDateTimePickerLocale()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowAddModal(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleSaveCheckup}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 16, color: '#DBB65C' },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  description: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  disclaimer: { fontSize: 12, opacity: 0.7, marginBottom: 16, fontStyle: 'italic', lineHeight: 18 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  halfButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
  button: { borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { fontSize: 14, opacity: 0.6, fontStyle: 'italic' },
  checkupCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  checkupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  checkupName: { fontSize: 16, fontWeight: '600', flex: 1 },
  checkupCategory: { fontSize: 12, opacity: 0.7, marginLeft: 8 },
  checkupDate: { fontSize: 14, marginBottom: 4 },
  checkupDescription: { fontSize: 13, opacity: 0.8, marginTop: 8, lineHeight: 18 },
  checkupActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, borderRadius: 6, padding: 10, alignItems: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '80%', borderRadius: 12, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  templateList: { maxHeight: 400, marginBottom: 12 },
  templateItem: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  templateName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  templateDescription: { fontSize: 13, opacity: 0.8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  dateButton: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
});
