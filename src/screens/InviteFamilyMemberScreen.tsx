import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import FamilyCircleService from '../services/familyCircleService';
import { MaterialIcons } from '@expo/vector-icons';

interface InviteFamilyMemberScreenProps {
  onClose: () => void;
  memberId: string;
  memberName: string;
}

export default function InviteFamilyMemberScreen({ 
  onClose, 
  memberId, 
  memberName 
}: InviteFamilyMemberScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    viewMeds: false,
    editDoses: false,
    receiveAlerts: false,
  });
  const [generating, setGenerating] = useState(false);

  const familyService = FamilyCircleService.getInstance();

  const handleGenerateInvite = async () => {
    try {
      setGenerating(true);
      const code = await familyService.generateInviteCode(memberId);
      setInviteCode(code);
    } catch (error) {
      console.error('Error generating invite:', error);
      Alert.alert(t('common.error'), 'Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareInvite = async () => {
    if (!inviteCode) return;

    const message = `${memberName} invited you to their Family Circle on AuricRX MedCoach!\n\nInvite code: ${inviteCode}\n\nDownload the app and enter this code to join.`;

    try {
      await Share.share({
        message,
        title: t('familyCircle.inviteAdult'),
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('familyCircle.inviteAdult')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.infoText, { color: getCardTextColor() }]}>
            {t('familyCircle.inviteInstructions')}
          </DynamicText>
        </View>

        {!inviteCode && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
              {t('familyCircle.permissionsTitle')}
            </DynamicText>

            <TouchableOpacity
              style={styles.permissionRow}
              onPress={() => togglePermission('viewMeds')}
            >
              <MaterialIcons
                name={permissions.viewMeds ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={permissions.viewMeds ? getAccentColor() : getCardTextColor()}
              />
              <DynamicText type="card" style={[styles.permissionLabel, { color: getCardTextColor() }]}>
                {t('familyCircle.permViewMeds')}
              </DynamicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.permissionRow}
              onPress={() => togglePermission('editDoses')}
            >
              <MaterialIcons
                name={permissions.editDoses ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={permissions.editDoses ? getAccentColor() : getCardTextColor()}
              />
              <DynamicText type="card" style={[styles.permissionLabel, { color: getCardTextColor() }]}>
                {t('familyCircle.permEditDoses')}
              </DynamicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.permissionRow}
              onPress={() => togglePermission('receiveAlerts')}
            >
              <MaterialIcons
                name={permissions.receiveAlerts ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={permissions.receiveAlerts ? getAccentColor() : getCardTextColor()}
              />
              <DynamicText type="card" style={[styles.permissionLabel, { color: getCardTextColor() }]}>
                {t('familyCircle.permReceiveAlerts')}
              </DynamicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: getAccentColor() }]}
              onPress={handleGenerateInvite}
              disabled={generating}
            >
              <DynamicText type="button" style={styles.buttonText}>
                {generating ? t('common.loading') : t('familyCircle.inviteAdult')}
              </DynamicText>
            </TouchableOpacity>
          </View>
        )}

        {inviteCode && (
          <>
            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={[styles.codeTitle, { color: getCardTextColor() }]}>
                {t('familyCircle.inviteCode', { code: '' })}
              </DynamicText>
              <View style={[styles.codeBox, { backgroundColor: '#10213A', borderColor: getAccentColor() }]}>
                <DynamicText type="card" style={[styles.codeText, { color: getAccentColor() }]}>
                  {inviteCode}
                </DynamicText>
              </View>

              <DynamicText type="card" style={[styles.helperText, { color: getCardTextColor() }]}>
                Permissions: {permissions.viewMeds ? '📋 ' : ''}{permissions.editDoses ? '✓ ' : ''}{permissions.receiveAlerts ? '🔔 ' : ''}
              </DynamicText>
            </View>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: getAccentColor() }]}
              onPress={handleShareInvite}
            >
              <MaterialIcons name="share" size={20} color="#17130B" />
              <DynamicText type="button" style={[styles.buttonText, { marginLeft: 8 }]}>
                {t('familyCircle.shareMinimal')}
              </DynamicText>
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.noteCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.noteText, { color: getCardTextColor() }]}>
            ℹ️ {t('familyCircle.leaveMessage', { name: memberName })}
          </DynamicText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 16, color: '#DBB65C' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  infoText: { fontSize: 14, opacity: 0.85, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  permissionLabel: { flex: 1, fontSize: 14, marginLeft: 12, lineHeight: 20 },
  generateButton: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  shareButton: { borderRadius: 8, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#17130B' },
  codeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  codeBox: { borderRadius: 8, borderWidth: 2, padding: 16, alignItems: 'center', marginBottom: 12 },
  codeText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  helperText: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  noteText: { fontSize: 13, opacity: 0.75, lineHeight: 19 },
});
