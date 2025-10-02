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
} from 'react-native';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';

interface FastingProfileScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
  fastingProfile: any;
  setFastingProfile: (profile: any) => void;
  saveFastingProfileToDB?: (profile: any) => void;
}

export default function FastingProfileScreen({ 
  onClose, 
  theme, 
  S, 
  fastingProfile, 
  setFastingProfile,
  saveFastingProfileToDB
}: FastingProfileScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor, getAccentColor } = useWallpaper();
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
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
    
    Alert.alert(
      t('profileSaved'),
      t('fastingProfileSavedMessage'),
      [{ text: t('ok') }]
    );
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
        <DynamicText type="card" style={[styles.sliderValue, { color: getCardTextColor() }]}>{fastingProfile[key]} hours</DynamicText>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            onPress={() => updateProfile(key, Math.max(min, fastingProfile[key] - step))}
            style={[styles.sliderButton, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
          >
            <DynamicText type="card" style={[styles.sliderButtonText, { color: getCardTextColor() }]}>-</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateProfile(key, Math.min(max, fastingProfile[key] + step))}
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
        value={fastingProfile[key]}
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
    <View style={[styles.container, { backgroundColor: getCardBackgroundColor() }]}>
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
            {t('fastingProfile')}
          </DynamicText>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Basic Information */}
          {renderSection(t('basicInfo'), (
            <View style={styles.sectionContent}>
              {renderTextInput('weight', t('weight'), 'Enter your weight', 'numeric')}
              {renderUnitSelect('weightUnit', t('weightUnit'), [
                { value: 'kg', label: t('kg') },
                { value: 'lbs', label: t('lbs') },
              ])}
              {renderTextInput('height', t('height'), 'Enter your height', 'numeric')}
              {renderUnitSelect('heightUnit', t('heightUnit'), [
                { value: 'cm', label: t('cm') },
                { value: 'ft', label: t('ft') },
              ])}
            </View>
          ))}

          {/* Health Conditions */}
          {renderSection(t('healthConditions'), (
            <View style={styles.sectionContent}>
              {renderSwitch('diabetes', t('diabetes'))}
              {renderSwitch('hypoglycemia', t('hypoglycemia'))}
              {renderSwitch('heartConditions', t('heartConditions'))}
              {renderSwitch('kidneyDisease', t('kidneyDisease'))}
              {renderSwitch('liverDisease', t('liverDisease'))}
              {renderSwitch('eatingDisorders', t('eatingDisorders'))}
              {renderSwitch('pregnancy', t('pregnancy'))}
              {renderSwitch('breastfeeding', t('breastfeeding'))}
              {renderSwitch('gastrointestinalIssues', t('gastrointestinalIssues'))}
              
              {/* Other Health Conditions */}
              <View style={styles.otherHealthConditionsSection}>
                <DynamicText type="card" style={[styles.subsectionTitle, { color: getCardTextColor() }]}>
                  {t('otherHealthConditions')}
                </DynamicText>
                
                {/* Add new health condition */}
                <View style={styles.addHealthConditionRow}>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: getCardBackgroundColor(), 
                      borderColor: getCardBorderColor(),
                      color: getCardTextColor(),
                      flex: 1,
                      marginRight: 8
                    }]}
                    value={fastingProfile.customHealthCondition}
                    onChangeText={(text) => updateProfile('customHealthCondition', text)}
                    placeholder={t('enterHealthCondition')}
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
                      {t('addHealthCondition')}
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
                        {t('removeHealthCondition')}
                      </DynamicText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Nutritional Status & Body Composition */}
          {renderSection(t('nutritionalStatus'), (
            <View style={styles.sectionContent}>
              {renderSelect('bodyFatLevel', t('bodyFatLevel'), [
                { value: 'low', label: t('low') },
                { value: 'normal', label: t('normal') },
                { value: 'high', label: t('high') }
              ])}
              {renderSelect('muscleMass', t('muscleMass'), [
                { value: 'low', label: t('low') },
                { value: 'normal', label: t('normal') },
                { value: 'high', label: t('high') }
              ])}
              {renderSelect('micronutrientLevels', t('micronutrientLevels'), [
                { value: 'low', label: t('low') },
                { value: 'normal', label: t('normal') },
                { value: 'high', label: t('high') }
              ])}
              {renderSelect('hydrationLevel', t('hydrationLevel'), [
                { value: 'poor', label: t('poor') },
                { value: 'good', label: t('good') },
                { value: 'excellent', label: t('excellent') }
              ])}
            </View>
          ))}

          {/* Mental Health & Cognitive Demands */}
          {renderSection(t('mentalHealth'), (
            <View style={styles.sectionContent}>
              {renderSwitch('highStressEnvironment', t('highStressEnvironment'))}
              {renderSwitch('intensiveMentalTasks', t('intensiveMentalTasks'))}
              {renderSwitch('anxiety', t('anxiety'))}
              {renderSwitch('depression', t('depression'))}
            </View>
          ))}

          {/* Lifestyle & Activity Level */}
          {renderSection(t('lifestyleActivity'), (
            <View style={styles.sectionContent}>
              {renderSelect('activityLevel', t('activityLevel'), [
                { value: 'sedentary', label: t('sedentary') },
                { value: 'light', label: t('light') },
                { value: 'moderate', label: t('moderate') },
                { value: 'high', label: t('high') },
                { value: 'athlete', label: t('athlete') }
              ])}
              {renderSwitch('physicalLabor', t('physicalLabor'))}
              {renderSwitch('longShifts', t('longShifts'))}
              {renderSelect('sleepQuality', t('sleepQuality'), [
                { value: 'poor', label: t('poor') },
                { value: 'fair', label: t('fair') },
                { value: 'good', label: t('good') },
                { value: 'excellent', label: t('excellent') }
              ])}
            </View>
          ))}

          {/* Fasting Protocol Preferences */}
          {renderSection(t('fastingPreferences'), (
            <View style={styles.sectionContent}>
              {renderSelect('preferredFastingType', t('preferredFastingType'), [
                { value: 'timeRestricted', label: t('timeRestricted') },
                { value: 'alternateDay', label: t('alternateDay') },
                { value: 'extended', label: t('extended') },
                { value: 'custom', label: t('custom') }
              ])}
              {renderSlider('maxFastingHours', t('maxFastingHours'), 8, 24, 2)}
              {renderSelect('fastingFrequency', t('fastingFrequency'), [
                { value: 'daily', label: t('daily') },
                { value: 'weekly', label: t('weekly') },
                { value: 'monthly', label: t('monthly') }
              ])}
            </View>
          ))}

          {/* Goals */}
          {renderSection(t('fastingGoals'), (
            <View style={styles.sectionContent}>
              {renderSelect('primaryGoal', t('primaryGoal'), [
                { value: 'weightLoss', label: t('weightLoss') },
                { value: 'metabolicHealth', label: t('metabolicHealth') },
                { value: 'generalHealth', label: t('generalHealth') },
                { value: 'spiritual', label: t('spiritual') },
                { value: 'medical', label: t('medical') }
              ])}
            </View>
          ))}

          {/* Medical Supervision & Monitoring */}
          {renderSection(t('medicalSupervision'), (
            <View style={styles.sectionContent}>
              {renderSwitch('medicalSupervision', t('medicalSupervision'))}
              {renderSwitch('selfMonitoring', t('selfMonitoring'))}
              {renderSwitch('wearableDevices', t('wearableDevices'))}
            </View>
          ))}

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveProfile}
            style={[styles.saveButton, { backgroundColor: getAccentColor(), borderColor: getCardBorderColor() }]}
          >
            <DynamicText type="card" style={[styles.saveButtonText, { color: '#ffffff' }]}>
              {t('saveProfile')}
            </DynamicText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor handled by getAccentColor()
    // borderColor handled by getCardBorderColor
  },
  addButtonText: {
    fontSize: 14,
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
});
