import { useTranslation as useScreenTranslation } from "react-i18next";
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from '../../components/KeyboardForm';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';

interface FastingProfile {
  customHealthCondition: string;
  otherHealthConditions: string[];
  [key: string]: unknown;
}
interface FastingProfileScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
  fastingProfile: FastingProfile;
  setFastingProfile: React.Dispatch<React.SetStateAction<FastingProfile>>;
  saveFastingProfileToDB?: (profile: FastingProfile) => void;
}

export default function FastingProfileScreen({ 
  onClose, 
  theme, 
  S, 
  fastingProfile, 
  setFastingProfile,
  saveFastingProfileToDB
}: FastingProfileScreenProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor, getAccentColor } = useWallpaper();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Use S object for translations, fallback to key if not available
  const { t } = useScreenTranslation();
  
  const updateProfile = (key: string, value: any) => {
    setFastingProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addHealthCondition = () => {
    if (fastingProfile.customHealthCondition.trim()) {
      setFastingProfile(prev => ({
        ...prev,
        otherHealthConditions: [...prev.otherHealthConditions, prev.customHealthCondition.trim()],
        customHealthCondition: ''
      }));
    }
  };

  const removeHealthCondition = (index: number) => {
    setFastingProfile(prev => ({
      ...prev,
      otherHealthConditions: prev.otherHealthConditions.filter((_, i) => i !== index)
    }));
  };

  const saveProfile = () => {
    // Save to database if function is provided
    if (saveFastingProfileToDB) {
      saveFastingProfileToDB(fastingProfile);
    }
    
    // Show themed success modal
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={[styles.section, { 
      backgroundColor: getCardBackgroundColor() + 'CC', 
      borderColor: getCardBorderColor() 
    }]}>
      <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>{title}</DynamicText>
      {children}
    </View>
  );

  const renderSwitch = (key: string, label: string) => (
    <View style={styles.switchRow}>
      <DynamicText type="card" style={[styles.switchLabel, { color: getCardTextColor() }]}>{label}</DynamicText>
      <TouchableOpacity
        onPress={() => updateProfile(key, !fastingProfile[key])}
        style={[
          styles.switch,
          { 
            backgroundColor: fastingProfile[key] ? getAccentColor() : getCardBackgroundColor(),
            borderColor: getCardBorderColor()
          }
        ]}
      >
        <View style={[
          styles.switchThumb,
          { 
            backgroundColor: '#ffffff',
            transform: [{ translateX: fastingProfile[key] ? 20 : 2 }]
          }
        ]} />
      </TouchableOpacity>
    </View>
  );

  const renderSelect = (key: string, label: string, options: { value: string; label: string }[]) => (
    <View style={styles.selectRow}>
      <DynamicText type="card" style={[styles.selectLabel, { color: getCardTextColor() }]}>{label}</DynamicText>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => updateProfile(key, option.value)}
            style={[
              styles.selectOption,
              {
                backgroundColor: fastingProfile[key] === option.value ? getAccentColor() : getCardBackgroundColor(),
                borderColor: getCardBorderColor()
              }
            ]}
          >
            <DynamicText type="card" style={[
              styles.selectOptionText,
              { 
                color: fastingProfile[key] === option.value ? '#ffffff' : getCardTextColor()
              }
            ]}>
              {option.label}
            </DynamicText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSlider = (key: string, label: string, min: number, max: number, step: number = 1) => (
    <View style={styles.sliderRow}>
      <DynamicText type="card" style={[styles.sliderLabel, { color: getCardTextColor() }]}>{label}</DynamicText>
      <View style={styles.sliderContainer}>
        <DynamicText type="card" style={[styles.sliderValue, { color: getCardTextColor() }]}>{Number(fastingProfile[key])}{uiI18n.t("ui.hours")}</DynamicText>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            onPress={() => updateProfile(key, Math.max(min, Number(fastingProfile[key]) - step))}
            style={[styles.sliderButton, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
          >
            <DynamicText type="card" style={[styles.sliderButtonText, { color: getCardTextColor() }]}>-</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateProfile(key, Math.min(max, Number(fastingProfile[key]) + step))}
            style={[styles.sliderButton, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
          >
            <DynamicText type="card" style={[styles.sliderButtonText, { color: getCardTextColor() }]}>+</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTextInput = (key: string, label: string, placeholder: string, keyboardType: any = 'default') => (
    <View style={styles.inputRow}>
      <DynamicText type="card" style={[styles.inputLabel, { color: getCardTextColor() }]}>{label}</DynamicText>
      <TextInput
        style={[styles.textInput, { 
          backgroundColor: getCardBackgroundColor(), 
          borderColor: getCardBorderColor(),
          color: getCardTextColor()
        }]}
        value={String(fastingProfile[key] ?? '')}
        onChangeText={(text) => updateProfile(key, text)}
        placeholder={placeholder}
        placeholderTextColor={getSubTextColor()}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderUnitSelect = (key: string, label: string, options: { value: string; label: string }[]) => (
    <View style={styles.selectRow}>
      <DynamicText type="card" style={[styles.selectLabel, { color: getCardTextColor() }]}>{label}</DynamicText>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => updateProfile(key, option.value)}
            style={[
              styles.selectOption,
              {
                backgroundColor: fastingProfile[key] === option.value ? getAccentColor() : getCardBackgroundColor(),
                borderColor: getCardBorderColor()
              }
            ]}
          >
            <DynamicText type="card" style={[
              styles.selectOptionText,
              { 
                color: fastingProfile[key] === option.value ? '#ffffff' : getCardTextColor()
              }
            ]}>
              {option.label}
            </DynamicText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardForm><View style={[styles.container, { backgroundColor: getCardBackgroundColor() }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.container, { backgroundColor: getCardBackgroundColor() }]}>
        {/* Header */}
        <View style={[styles.header, { borderColor: getCardBorderColor() }]}>
          <TouchableOpacity style={[styles.homeButton, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2 }]} onPress={onClose}>
            <Image 
              source={require('../../assets/dashboard Emojies/close Window.png')} 
              style={styles.closeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <DynamicText type="primary" style={[styles.title, { color: getCardTextColor() }]}>
            {S.healthProfile}
          </DynamicText>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={true}
        >
          {/* Basic Information */}
          {renderSection(t("healthProfile.basicInfo"), (
            <View style={styles.sectionContent}>
              {renderTextInput('weight', t("healthProfile.weight"), uiI18n.t("ui.enterYourWeight"), 'numeric')}
              {renderUnitSelect('weightUnit', t("healthProfile.weightUnit"), [
                { value: 'kg', label: t("healthProfile.kg") },
                { value: 'lbs', label: t("healthProfile.lbs") },
              ])}
              {renderTextInput('height', t("healthProfile.height"), uiI18n.t("ui.enterYourHeight"), 'numeric')}
              {renderUnitSelect('heightUnit', t("healthProfile.heightUnit"), [
                { value: 'cm', label: t("healthProfile.cm") },
                { value: 'ft', label: t("healthProfile.ft") },
              ])}
            </View>
          ))}

          {/* Health Conditions */}
          {renderSection(t("healthProfile.healthConditions"), (
            <View style={styles.sectionContent}>
              {renderSwitch('diabetes', t("healthProfile.diabetes"))}
              {renderSwitch('hypoglycemia', t("healthProfile.hypoglycemia"))}
              {renderSwitch('heartConditions', t("healthProfile.heartConditions"))}
              {renderSwitch('kidneyDisease', t("healthProfile.kidneyDisease"))}
              {renderSwitch('liverDisease', t("healthProfile.liverDisease"))}
              {renderSwitch('eatingDisorders', t("healthProfile.eatingDisorders"))}
              {renderSwitch('pregnancy', t("healthProfile.pregnancy"))}
              {renderSwitch('breastfeeding', t("healthProfile.breastfeeding"))}
              {renderSwitch('gastrointestinalIssues', t("healthProfile.gastrointestinalIssues"))}
              
              {/* Other Health Conditions */}
              <View style={styles.otherHealthConditionsSection}>
                <DynamicText type="card" style={[styles.subsectionTitle, { color: getCardTextColor() }]}>
                  {t("healthProfile.otherHealthConditions")}
                </DynamicText>
                
                {/* Add new health condition */}
                <View style={styles.addHealthConditionRow}>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: getCardBackgroundColor(), 
                      borderColor: getCardBorderColor(),
                      color: getCardTextColor(),
                      flex: 1,
                      marginRight: 8,
                      minHeight: 48
                    }]}
                    value={fastingProfile.customHealthCondition}
                    onChangeText={(text) => updateProfile('customHealthCondition', text)}
                    placeholder={t("healthProfile.enterHealthCondition")}
                    placeholderTextColor={getSubTextColor()}
                  />
                  <TouchableOpacity
                    onPress={addHealthCondition}
                    style={[styles.addButton, { 
                      backgroundColor: getAccentColor(),
                      borderColor: getCardBorderColor()
                    }]}
                  >
                    <DynamicText type="card" style={[styles.addButtonText, { color: '#ffffff' }]}>
                      {t("healthProfile.others") || uiI18n.t("ui.others")}
                    </DynamicText>
                  </TouchableOpacity>
                </View>
                
                {/* List of added health conditions */}
                {fastingProfile.otherHealthConditions.map((condition, index) => (
                  <View key={index} style={styles.healthConditionItem}>
                    <DynamicText type="card" style={[styles.healthConditionText, { color: getCardTextColor() }]}>
                      {condition}
                    </DynamicText>
                    <TouchableOpacity
                      onPress={() => removeHealthCondition(index)}
                      style={[styles.removeButton, { 
                        backgroundColor: '#f87171',
                        borderColor: getCardBorderColor()
                      }]}
                    >
                      <DynamicText type="card" style={[styles.removeButtonText, { color: '#ffffff' }]}>
                        {t("healthProfile.removeHealthCondition")}
                      </DynamicText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Nutritional Status & Body Composition */}
          {renderSection(t("healthProfile.nutritionalStatus"), (
            <View style={styles.sectionContent}>
              {renderSelect('bodyFatLevel', t("healthProfile.bodyFatLevel"), [
                { value: 'low', label: t("healthProfile.low") },
                { value: 'normal', label: t("healthProfile.normal") },
                { value: 'high', label: t("healthProfile.high") }
              ])}
              {renderSelect('muscleMass', t("healthProfile.muscleMass"), [
                { value: 'low', label: t("healthProfile.low") },
                { value: 'normal', label: t("healthProfile.normal") },
                { value: 'high', label: t("healthProfile.high") }
              ])}
              {renderSelect('micronutrientLevels', t("healthProfile.micronutrientLevels"), [
                { value: 'low', label: t("healthProfile.low") },
                { value: 'normal', label: t("healthProfile.normal") },
                { value: 'high', label: t("healthProfile.high") }
              ])}
              {renderSelect('hydrationLevel', t("healthProfile.hydrationLevel"), [
                { value: 'poor', label: t("healthProfile.poor") },
                { value: 'good', label: t("healthProfile.good") },
                { value: 'excellent', label: t("healthProfile.excellent") }
              ])}
            </View>
          ))}

          {/* Mental Health & Cognitive Demands */}
          {renderSection(t("healthProfile.mentalHealth"), (
            <View style={styles.sectionContent}>
              {renderSwitch('highStressEnvironment', t("healthProfile.highStressEnvironment"))}
              {renderSwitch('intensiveMentalTasks', t("healthProfile.intensiveMentalTasks"))}
              {renderSwitch('anxiety', t("healthProfile.anxiety"))}
              {renderSwitch('depression', t("healthProfile.depression"))}
            </View>
          ))}

          {/* Lifestyle & Activity Level */}
          {renderSection(t("healthProfile.lifestyleActivity"), (
            <View style={styles.sectionContent}>
              {renderSelect('activityLevel', t("healthProfile.activityLevel"), [
                { value: 'sedentary', label: t("healthProfile.sedentary") },
                { value: 'light', label: t("healthProfile.light") },
                { value: 'moderate', label: t("healthProfile.moderate") },
                { value: 'high', label: t("healthProfile.high") },
                { value: 'athlete', label: t("healthProfile.athlete") }
              ])}
              {renderSwitch('physicalLabor', t("healthProfile.physicalLabor"))}
              {renderSwitch('longShifts', t("healthProfile.longShifts"))}
              {renderSelect('sleepQuality', t("healthProfile.sleepQuality"), [
                { value: 'poor', label: t("healthProfile.poor") },
                { value: 'fair', label: t("healthProfile.fair") },
                { value: 'good', label: t("healthProfile.good") },
                { value: 'excellent', label: t("healthProfile.excellent") }
              ])}
            </View>
          ))}

          {/* Fasting Protocol Preferences */}
          {renderSection(t("healthProfile.fastingPreferences"), (
            <View style={styles.sectionContent}>
              {renderSelect('preferredFastingType', t("healthProfile.preferredFastingType"), [
                { value: 'timeRestricted', label: t("healthProfile.timeRestricted") },
                { value: 'alternateDay', label: t("healthProfile.alternateDay") },
                { value: 'extended', label: t("healthProfile.extended") },
                { value: 'custom', label: t("healthProfile.custom") }
              ])}
              {renderSlider('maxFastingHours', t("healthProfile.maxFastingHours"), 8, 24, 2)}
              {renderSelect('fastingFrequency', t("healthProfile.fastingFrequency"), [
                { value: 'daily', label: t("healthProfile.daily") },
                { value: 'weekly', label: t("healthProfile.weekly") },
                { value: 'monthly', label: t("healthProfile.monthly") }
              ])}
            </View>
          ))}

          {/* Goals */}
          {renderSection(t("healthProfile.fastingGoals"), (
            <View style={styles.sectionContent}>
              {renderSelect('primaryGoal', t("healthProfile.primaryGoal"), [
                { value: 'weightLoss', label: t("healthProfile.weightLoss") },
                { value: 'metabolicHealth', label: t("healthProfile.metabolicHealth") },
                { value: 'generalHealth', label: t("healthProfile.generalHealth") },
                { value: 'spiritual', label: t("healthProfile.spiritual") },
                { value: 'medical', label: t("healthProfile.medical") }
              ])}
            </View>
          ))}

          {/* Health Monitoring & Tracking */}
          {renderSection(t("healthProfile.healthMonitoring"), (
            <View style={styles.sectionContent}>
              {renderSwitch('medicalSupervision', t("healthProfile.medicalSupervision"))}
              {renderSwitch('selfMonitoring', t("healthProfile.selfMonitoring"))}
              {renderSwitch('wearableDevices', t("healthProfile.wearableDevices"))}
            </View>
          ))}

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveProfile}
            style={[styles.saveButton, { backgroundColor: getAccentColor(), borderColor: getCardBorderColor() }]}
          >
            <DynamicText type="card" style={[styles.saveButtonText, { color: '#ffffff' }]}>
              {t("healthProfile.saveProfile")}
            </DynamicText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Success Modal - Themed */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: getCardBackgroundColor(),
            borderColor: getCardBorderColor(),
          }]}>
            <DynamicText type="primary" style={[styles.modalTitle, { color: getCardTextColor() }]}>
              {S.profileSaved}
            </DynamicText>
            <DynamicText type="card" style={[styles.modalMessage, { color: getSubTextColor() }]}>
              {S.healthProfileSavedMessage}
            </DynamicText>
            <TouchableOpacity
              onPress={handleSuccessModalClose}
              style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
            >
              <DynamicText type="card" style={[styles.modalButtonText, { color: '#ffffff' }]}>
                {S.ok || uiI18n.t("adminProfile.ok")}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View></KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  homeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 2,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectRow: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
  },
  sliderRow: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // New styles for weight/height and other health conditions
  inputRow: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    // color handled by getCardTextColor
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    // backgroundColor, borderColor, color handled by getCardBackgroundColor, getCardBorderColor, getCardTextColor
  },
  otherHealthConditionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    // color handled by getCardTextColor
  },
  addHealthConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    // backgroundColor handled by getAccentColor()
    // borderColor handled by getCardBorderColor
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    // color: '#ffffff', // Always white
  },
  healthConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  healthConditionText: {
    fontSize: 14,
    flex: 1,
    // color handled by getCardTextColor
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    // backgroundColor: '#f87171', // Red
    // borderColor handled by getCardBorderColor
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    // color: '#ffffff', // Always white
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: '85%',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
