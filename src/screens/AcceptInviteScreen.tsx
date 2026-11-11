import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import FamilyCircleService from '../services/familyCircleService';
import { MaterialIcons } from '@expo/vector-icons';

interface AcceptInviteScreenProps {
  onClose: () => void;
  onAccepted: () => void;
}

export default function AcceptInviteScreen({ onClose, onAccepted }: AcceptInviteScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  const [inviteCode, setInviteCode] = useState('');
  const [permissions, setPermissions] = useState({
    viewMeds: false,
    editDoses: false,
    receiveAlerts: false,
    shareDocuments: false, // Family Documents: OFF by default
  });
  const [accepting, setAccepting] = useState(false);

  const familyService = FamilyCircleService.getInstance();

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('familyCircle.enterInviteCode'));
      return;
    }

    try {
      setAccepting(true);
      
      const member = await familyService.acceptInvite(inviteCode.trim(), permissions);
      
      if (!member) {
        Alert.alert(t('common.error'), t('familyCircle.invalidInviteCode'));
        return;
      }

      Alert.alert(
        t('common.success'),
        t('familyCircle.acceptInviteTitle'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              onAccepted();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert(t('common.error'), t('familyCircle.acceptInviteFailed'));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('familyCircle.acceptInvite')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('familyCircle.enterInviteCode')}
          </DynamicText>
          
          <TextInput
            style={[
              styles.codeInput,
              { 
                backgroundColor: getCardBackgroundColor(),
                borderColor: getCardBorderColor(),
                color: getCardTextColor(),
              }
            ]}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="FC123456ABCD"
            placeholderTextColor={getCardTextColor() + '80'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
          />
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('familyCircle.acceptPermissions')}
          </DynamicText>
          
          <DynamicText type="card" style={[styles.helperText, { color: getCardTextColor(), marginBottom: 16 }]}>
            All permissions are OFF by default. Choose what you want to allow:
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
            style={styles.permissionRow}
            onPress={() => togglePermission('shareDocuments')}
          >
            <MaterialIcons
              name={permissions.shareDocuments ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={permissions.shareDocuments ? getAccentColor() : getCardTextColor()}
            />
            <DynamicText type="card" style={[styles.permissionLabel, { color: getCardTextColor() }]}>
              {t('familyCircle.permShareDocuments')}
            </DynamicText>
          </TouchableOpacity>
        </View>

        <View style={[styles.noteCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.noteText, { color: getCardTextColor() }]}>
            ℹ️ You can leave the Family Circle at any time. Alerts will stop when you leave.
          </DynamicText>
        </View>

        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: getAccentColor() }]}
          onPress={handleAcceptInvite}
          disabled={accepting}
        >
          <DynamicText type="button" style={styles.buttonText}>
            {accepting ? t('common.loading') : t('familyCircle.acceptButton')}
          </DynamicText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const buttonTextColor = '#17130B';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 16, color: '#DBB65C' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  codeInput: { borderRadius: 8, borderWidth: 1, padding: 14, fontSize: 18, fontWeight: '600', textAlign: 'center', letterSpacing: 1 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  permissionLabel: { flex: 1, fontSize: 14, marginLeft: 12, lineHeight: 20 },
  helperText: { fontSize: 13, opacity: 0.7, lineHeight: 19 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  noteText: { fontSize: 13, opacity: 0.75, lineHeight: 19 },
  acceptButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: buttonTextColor },
});
