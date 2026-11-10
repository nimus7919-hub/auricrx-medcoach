import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import FamilyCircleService from '../services/familyCircleService';
import PremiumEntitlementService from '../services/premiumEntitlementService';
import { MaterialIcons } from '@expo/vector-icons';

interface AddFamilyMemberScreenProps {
  onClose: () => void;
  onAdded: () => void;
}

type ProfileType = 'regular' | 'device-only-adult' | 'child';

export default function AddFamilyMemberScreen({ onClose, onAdded }: AddFamilyMemberScreenProps) {
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('regular');
  const [deviceOnlyAttested, setDeviceOnlyAttested] = useState(false);
  const [guardianAttested, setGuardianAttested] = useState(false);
  const [adding, setAdding] = useState(false);

  const familyService = FamilyCircleService.getInstance();
  const premiumService = PremiumEntitlementService.getInstance();

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Please enter a name');
      return;
    }

    if (profileType === 'device-only-adult' && !deviceOnlyAttested) {
      Alert.alert(t('common.error'), 'Please confirm the device-only attestation');
      return;
    }

    if (profileType === 'child' && !guardianAttested) {
      Alert.alert(t('common.error'), 'Please confirm you are the parent/guardian');
      return;
    }

    try {
      setAdding(true);

      // Check if can add member (free tier limits)
      const entitlement = await premiumService.checkPremiumAccess();
      const canAdd = await familyService.canAddMember(entitlement.hasPremiumAccess);
      
      if (!canAdd.allowed) {
        Alert.alert(
          t('familyCircle.upgradeToPro'),
          `You've reached the free tier limit. Upgrade to Pro to add more family members.`,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('familyCircle.upgradeToPro'), onPress: () => { /* TODO: Open upgrade screen */ } },
          ]
        );
        return;
      }

      const newMember = await familyService.addMember({
        name: name.trim(),
        relationship: relationship.trim(),
        birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
        // F5: Device-only adult profile
        deviceOnly: profileType === 'device-only-adult',
        managedBy: profileType === 'device-only-adult' ? 'current-user-id' : undefined, // TODO: Get actual user ID
        // F6: Child profile
        isChild: profileType === 'child',
        guardianAttested: profileType === 'child' && guardianAttested,
        excludeFromAI: profileType === 'child', // Default excluded for children
        excludeFromSummaries: profileType === 'child', // Default excluded for children
      });

      Alert.alert(
        t('common.success'),
        `${newMember.name} has been added to your Family Circle`,
        [
          {
            text: t('common.ok'),
            onPress: () => {
              onAdded();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert(t('common.error'), 'Failed to add family member. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('familyCircle.addMember')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.label, { color: getCardTextColor() }]}>
            {t('familyCircle.memberName')}
          </DynamicText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: getCardBackgroundColor(),
                borderColor: getCardBorderColor(),
                color: getCardTextColor(),
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor={getCardTextColor() + '80'}
          />

          <DynamicText type="card" style={[styles.label, { color: getCardTextColor() }]}>
            {t('familyCircle.relationship')}
          </DynamicText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: getCardBackgroundColor(),
                borderColor: getCardBorderColor(),
                color: getCardTextColor(),
              }
            ]}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g., Mom, Dad, Son, Daughter"
            placeholderTextColor={getCardTextColor() + '80'}
          />

          <DynamicText type="card" style={[styles.label, { color: getCardTextColor() }]}>
            Birth Year (optional)
          </DynamicText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: getCardBackgroundColor(),
                borderColor: getCardBorderColor(),
                color: getCardTextColor(),
              }
            ]}
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="e.g., 1980"
            placeholderTextColor={getCardTextColor() + '80'}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            Profile Type
          </DynamicText>

          <TouchableOpacity
            style={[styles.typeOption, profileType === 'regular' && styles.typeOptionSelected]}
            onPress={() => setProfileType('regular')}
          >
            <MaterialIcons
              name={profileType === 'regular' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profileType === 'regular' ? getAccentColor() : getCardTextColor()}
            />
            <View style={styles.typeTextContainer}>
              <DynamicText type="card" style={[styles.typeTitle, { color: getCardTextColor() }]}>
                Regular Profile
              </DynamicText>
              <DynamicText type="card" style={[styles.typeDescription, { color: getCardTextColor() }]}>
                For family members who use the app
              </DynamicText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeOption, profileType === 'device-only-adult' && styles.typeOptionSelected]}
            onPress={() => setProfileType('device-only-adult')}
          >
            <MaterialIcons
              name={profileType === 'device-only-adult' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profileType === 'device-only-adult' ? getAccentColor() : getCardTextColor()}
            />
            <View style={styles.typeTextContainer}>
              <DynamicText type="card" style={[styles.typeTitle, { color: getCardTextColor() }]}>
                {t('familyCircle.deviceOnlyProfile')}
              </DynamicText>
              <DynamicText type="card" style={[styles.typeDescription, { color: getCardTextColor() }]}>
                For adults without phones (managed on your device)
              </DynamicText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeOption, profileType === 'child' && styles.typeOptionSelected]}
            onPress={() => setProfileType('child')}
          >
            <MaterialIcons
              name={profileType === 'child' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profileType === 'child' ? getAccentColor() : getCardTextColor()}
            />
            <View style={styles.typeTextContainer}>
              <DynamicText type="card" style={[styles.typeTitle, { color: getCardTextColor() }]}>
                {t('familyCircle.childProfile')}
              </DynamicText>
              <DynamicText type="card" style={[styles.typeDescription, { color: getCardTextColor() }]}>
                {t('familyCircle.childNoLogin')}
              </DynamicText>
            </View>
          </TouchableOpacity>
        </View>

        {profileType === 'device-only-adult' && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <TouchableOpacity
              style={styles.attestationRow}
              onPress={() => setDeviceOnlyAttested(!deviceOnlyAttested)}
            >
              <MaterialIcons
                name={deviceOnlyAttested ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={deviceOnlyAttested ? getAccentColor() : getCardTextColor()}
              />
              <DynamicText type="card" style={[styles.attestationText, { color: getCardTextColor() }]}>
                {t('familyCircle.deviceOnlyAttestation')}
              </DynamicText>
            </TouchableOpacity>
          </View>
        )}

        {profileType === 'child' && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <TouchableOpacity
              style={styles.attestationRow}
              onPress={() => setGuardianAttested(!guardianAttested)}
            >
              <MaterialIcons
                name={guardianAttested ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={guardianAttested ? getAccentColor() : getCardTextColor()}
              />
              <DynamicText type="card" style={[styles.attestationText, { color: getCardTextColor() }]}>
                {t('familyCircle.guardianAttestation', { name })}
              </DynamicText>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: getAccentColor() }]}
          onPress={handleAdd}
          disabled={adding}
        >
          <DynamicText type="button" style={styles.buttonText}>
            {adding ? t('common.loading') : t('familyCircle.addMember')}
          </DynamicText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  const buttonTextColor = '#17130B';
  
  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    closeButton: { fontSize: 16, color: getAccentColor() },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  typeOption: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 8, marginBottom: 12 },
  typeOptionSelected: { backgroundColor: 'rgba(219, 182, 92, 0.1)' },
  typeTextContainer: { flex: 1, marginLeft: 12 },
  typeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  typeDescription: { fontSize: 13, opacity: 0.75, lineHeight: 18 },
  attestationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  attestationText: { flex: 1, fontSize: 14, marginLeft: 12, lineHeight: 20 },
    addButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600', color: buttonTextColor },
  });
