import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import FamilyCircleService, { FamilyMember, DoseLog } from '../services/familyCircleService';
import PremiumEntitlementService, { PremiumEntitlement } from '../services/premiumEntitlementService';
import PremiumUpgradeScreen from './PremiumUpgradeScreen';
import * as Sharing from 'expo-sharing';

export default function FamilyCircleScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDoseLog, setShowDoseLog] = useState(false);
  const [showShareConsent, setShowShareConsent] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [entitlement, setEntitlement] = useState<PremiumEntitlement | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  
  const service = FamilyCircleService.getInstance();
  const premiumService = PremiumEntitlementService.getInstance();

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    const ent = await premiumService.checkPremiumAccess();
    setEntitlement(ent);
    
    if (!ent.hasPremiumAccess && ent.trialStartDate) {
      // Trial ended, show upgrade screen
      setShowUpgrade(true);
    } else {
      // Has access (trial active or premium), start trial if needed
      if (!ent.trialStartDate && !ent.isPremium) {
        await premiumService.startPremiumTrial();
      }
      loadData();
    }
  };

  const loadData = async () => {
    const m = await service.getMembers();
    const logs = await service.getDoseLogs();
    setMembers(m);
    setDoseLogs(logs);
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert(t('common.error'), t('familyCircle.enterName'));
      return;
    }

    await service.addMember({
      name: newMemberName.trim(),
      relationship: newMemberRelation.trim() || t('familyCircle.familyMember'),
    });

    setNewMemberName('');
    setNewMemberRelation('');
    setShowAddMember(false);
    loadData();
  };

  const handleDeleteMember = async (id: string, name: string) => {
    Alert.alert(
      t('familyCircle.confirmDelete'),
      t('familyCircle.confirmDeleteMessage', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await service.deleteMember(id);
            loadData();
          },
        },
      ]
    );
  };

  const handleShareSummary = async (memberId?: string) => {
    const consent = memberId ? await service.getShareConsent(memberId) : null;
    
    if (memberId && !consent) {
      setSelectedMemberId(memberId);
      setShowShareConsent(true);
      return;
    }

    const summary = await service.generateWeeklySummary(memberId);
    
    if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
      Alert.alert(
        t('familyCircle.shareVia'),
        t('familyCircle.shareViaMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('familyCircle.shareWhatsApp'),
            onPress: () => {
              Sharing.shareAsync('data:text/plain,' + encodeURIComponent(summary), {
                dialogTitle: t('familyCircle.weeklySummary'),
              });
            },
          },
        ]
      );
    }
  };

  const handleGrantShareConsent = async () => {
    if (selectedMemberId) {
      await service.recordShareConsent(selectedMemberId, 7);
      setShowShareConsent(false);
      handleShareSummary(selectedMemberId);
    }
  };

  if (showUpgrade && entitlement) {
    return <PremiumUpgradeScreen onClose={onClose} entitlement={entitlement} feature="familyCircle" />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('familyCircle.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('familyCircle.members')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('familyCircle.membersDescription')}</DynamicText>
          
          {members.length === 0 && (
            <DynamicText type="card" style={styles.emptyText}>{t('familyCircle.noMembers')}</DynamicText>
          )}

          {members.map(member => (
            <View key={member.id} style={[styles.memberCard, { borderColor: getCardBorderColor() }]}>
              <View style={styles.memberInfo}>
                <DynamicText type="card" style={styles.memberName}>{member.name}</DynamicText>
                <DynamicText type="card" style={styles.memberRelation}>{member.relationship}</DynamicText>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteMember(member.id, member.name)}
                style={styles.deleteButton}
              >
                <DynamicText type="card" style={{ color: '#ff6b6b' }}>✕</DynamicText>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: getAccentColor() }]}
            onPress={() => setShowAddMember(true)}
          >
            <DynamicText type="button" style={styles.buttonText}>{t('familyCircle.addMember')}</DynamicText>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('familyCircle.doseLog')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('familyCircle.doseLogDescription')}</DynamicText>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: getAccentColor() }]}
            onPress={() => setShowDoseLog(true)}
          >
            <DynamicText type="button" style={styles.buttonText}>{t('familyCircle.viewLog')}</DynamicText>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('familyCircle.shareSummary')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('familyCircle.shareSummaryDescription')}</DynamicText>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: getAccentColor() }]}
            onPress={() => handleShareSummary()}
          >
            <DynamicText type="button" style={styles.buttonText}>{t('familyCircle.generateSummary')}</DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showAddMember} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('familyCircle.addMember')}</DynamicText>
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('familyCircle.memberName')}
              placeholderTextColor="#999"
              value={newMemberName}
              onChangeText={setNewMemberName}
            />
            
            <TextInput
              style={[styles.input, { borderColor: getCardBorderColor(), color: getAccentColor() }]}
              placeholder={t('familyCircle.relationship')}
              placeholderTextColor="#999"
              value={newMemberRelation}
              onChangeText={setNewMemberRelation}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowAddMember(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleAddMember}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.save')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showShareConsent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{t('familyCircle.shareConsentTitle')}</DynamicText>
            <DynamicText type="card" style={styles.modalDescription}>{t('familyCircle.shareConsentMessage')}</DynamicText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowShareConsent(false)}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('common.cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getAccentColor() }]}
                onPress={handleGrantShareConsent}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('familyCircle.grantConsent')}</DynamicText>
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sectionDescription: { fontSize: 14, opacity: 0.8, marginBottom: 16 },
  emptyText: { fontSize: 14, opacity: 0.6, fontStyle: 'italic', marginBottom: 16 },
  memberCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberRelation: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  deleteButton: { padding: 8 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 12, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalDescription: { fontSize: 14, marginBottom: 20, opacity: 0.9, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
});
