import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import { MaterialIcons } from '@expo/vector-icons';
import FamilyCircleService, { FamilyMember } from '../services/familyCircleService';
import FamilyDocumentsService, { FamilyDocument } from '../services/familyDocumentsService';
import PremiumEntitlementService from '../services/premiumEntitlementService';
import PremiumUpgradeScreen from './PremiumUpgradeScreen';
import * as ImagePicker from 'expo-image-picker';

interface FamilyDocumentsScreenProps {
  onClose: () => void;
}

export default function FamilyDocumentsScreen({ onClose }: FamilyDocumentsScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [hasPremium, setHasPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'prescription' | 'lab_result' | 'vaccine' | 'insurance' | 'other'>('other');

  const familyService = FamilyCircleService.getInstance();
  const docsService = FamilyDocumentsService.getInstance();
  const premiumService = PremiumEntitlementService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const familyMembers = await familyService.getMembers();
      const premium = await premiumService.isPremiumUser();
      
      setMembers(familyMembers);
      setHasPremium(premium);
      
      if (!premium) {
        setShowUpgrade(true);
      }
    } catch (error) {
      console.error('Error loading family documents data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentsForMember = async (member: FamilyMember) => {
    setSelectedMember(member);
    const docs = await docsService.getDocumentsForMember(member.id);
    setDocuments(docs);
  };

  const handleAddDocument = async () => {
    if (!selectedMember || !newDocName.trim()) {
      Alert.alert(t('common.error'), t('familyDocuments.nameRequired'));
      return;
    }

    // Check if user can add (requires premium + permission)
    const access = docsService.canAccessMemberDocuments(
      selectedMember.id,
      hasPremium,
      selectedMember.permissions
    );

    if (!access.canAdd) {
      Alert.alert(
        t('familyDocuments.premiumRequired'),
        t('familyDocuments.addRequiresPremium')
      );
      setShowUpgrade(true);
      return;
    }

    try {
      // Request camera/photo permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('familyDocuments.photoPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await docsService.addDocument({
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          name: newDocName,
          category: newDocCategory,
          tags: [],
          photoUri: result.assets[0].uri,
          uploadedBy: 'current-user', // TODO: Get actual user ID
        });

        setNewDocName('');
        setNewDocCategory('other');
        setShowAddDocument(false);
        loadDocumentsForMember(selectedMember);
        Alert.alert(t('common.success'), t('familyDocuments.documentAdded'));
      }
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    Alert.alert(
      t('familyDocuments.deleteDocument'),
      t('familyDocuments.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await docsService.deleteDocument(docId);
            if (selectedMember) {
              loadDocumentsForMember(selectedMember);
            }
          },
        },
      ]
    );
  };

  const handleExportDocuments = async () => {
    if (!selectedMember) return;

    try {
      const exported = await docsService.exportDocumentsForMember(selectedMember.id);
      Alert.alert(
        t('familyDocuments.exportSuccess'),
        t('familyDocuments.exportDetails'),
        [{ text: t('common.ok') }]
      );
      // TODO: Share exported JSON via share sheet
    } catch (error) {
      console.error('Error exporting documents:', error);
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription': return 'medication';
      case 'lab_result': return 'science';
      case 'vaccine': return 'vaccines';
      case 'insurance': return 'card-membership';
      default: return 'insert-drive-file';
    }
  };

  const buttonTextColor = '#17130B';

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    closeButton: { fontSize: 16 },
    content: { flex: 1 },
    contentContainer: { padding: 16, paddingBottom: 32 },
    infoCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
    infoText: { fontSize: 13, lineHeight: 19 },
    memberCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    memberName: { fontSize: 16, fontWeight: '600' },
    memberDetails: { fontSize: 13, opacity: 0.75, marginTop: 4 },
    documentCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    documentName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    documentMeta: { fontSize: 12, opacity: 0.7 },
    emptyState: { fontSize: 14, opacity: 0.6, textAlign: 'center', marginTop: 32 },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    button: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
    buttonSecondary: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1 },
    buttonText: { fontSize: 15, fontWeight: '600', color: buttonTextColor },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { fontSize: 15, marginLeft: 4 },
  });

  if (showUpgrade) {
    return (
      <PremiumUpgradeScreen
        onClose={onClose}
        entitlement={{
          hasPremiumAccess: false,
          isInTrial: false,
          trialDaysRemaining: 14,
          isPremium: false,
        }}
        feature="familyCircle"
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.title}>{t('familyDocuments.title')}</DynamicText>
          <TouchableOpacity onPress={onClose}>
            <DynamicText type="card" style={[styles.closeButton, { color: getAccentColor() }]}>{t('common.close')}</DynamicText>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <DynamicText type="card" style={{ textAlign: 'center', marginTop: 32 }}>{t('common.loading')}</DynamicText>
        </View>
      </View>
    );
  }

  // Member documents view
  if (selectedMember) {
    const access = docsService.canAccessMemberDocuments(selectedMember.id, hasPremium, selectedMember.permissions);

    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.title}>{selectedMember.name}</DynamicText>
          <TouchableOpacity onPress={() => setSelectedMember(null)}>
            <DynamicText type="card" style={[styles.closeButton, { color: getAccentColor() }]}>{t('common.back')}</DynamicText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.infoCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.infoText}>
              {t('familyDocuments.memberFolderDescription')}
            </DynamicText>
          </View>

          <DynamicText type="card" style={styles.sectionTitle}>{t('familyDocuments.documents')}</DynamicText>

          {documents.length === 0 ? (
            <DynamicText type="card" style={styles.emptyState}>{t('familyDocuments.noDocuments')}</DynamicText>
          ) : (
            documents.map(doc => (
              <View
                key={doc.id}
                style={[styles.documentCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
              >
                <MaterialIcons name={getCategoryIcon(doc.category) as any} size={32} color={getAccentColor()} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <DynamicText type="card" style={styles.documentName}>{doc.name}</DynamicText>
                  <DynamicText type="card" style={styles.documentMeta}>
                    {t(`familyDocuments.categories.${doc.category}`)} • {new Date(doc.createdAt).toLocaleDateString()}
                  </DynamicText>
                </View>
                <TouchableOpacity onPress={() => handleDeleteDocument(doc.id)}>
                  <MaterialIcons name="delete" size={24} color={getAccentColor()} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.buttonRow}>
            {access.canAdd ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: getAccentColor() }]}
                onPress={() => setShowAddDocument(true)}
              >
                <DynamicText type="accent" style={styles.buttonText}>{t('familyDocuments.addDocument')}</DynamicText>
              </TouchableOpacity>
            ) : (
              <View style={[styles.infoCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
                <DynamicText type="card" style={styles.infoText}>
                  {t('familyDocuments.readOnlyAccess')}
                </DynamicText>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.buttonSecondary, { borderColor: getAccentColor() }]}
              onPress={handleExportDocuments}
            >
              <DynamicText type="accent" style={[styles.buttonText, { color: getAccentColor() }]}>{t('familyDocuments.export')}</DynamicText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Member list view
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('familyDocuments.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={[styles.closeButton, { color: getAccentColor() }]}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.infoCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.infoText}>
            {t('familyDocuments.description')}
          </DynamicText>
        </View>

        <DynamicText type="card" style={styles.sectionTitle}>{t('familyDocuments.familyMembers')}</DynamicText>

        {members.length === 0 ? (
          <DynamicText type="card" style={styles.emptyState}>{t('familyDocuments.noMembers')}</DynamicText>
        ) : (
          members.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
              onPress={() => loadDocumentsForMember(member)}
            >
              <View style={{ flex: 1 }}>
                <DynamicText type="card" style={styles.memberName}>{member.name}</DynamicText>
                <DynamicText type="card" style={styles.memberDetails}>
                  {member.relationship}{member.isChild ? ` • ${t('familyCircle.childProfile')}` : ''}
                </DynamicText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={getAccentColor()} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
