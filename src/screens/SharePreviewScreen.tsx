import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import FamilyCircleService, { FamilyMember } from '../services/familyCircleService';

interface SharePreviewScreenProps {
  onClose: () => void;
  selectedMemberIds?: string[]; // If provided, only share for these members
}

export default function SharePreviewScreen({ onClose, selectedMemberIds }: SharePreviewScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  const familyService = FamilyCircleService.getInstance();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const allMembers = await familyService.getMembers();
      
      // Filter members
      let membersToShare = allMembers;
      if (selectedMemberIds && selectedMemberIds.length > 0) {
        membersToShare = allMembers.filter(m => selectedMemberIds.includes(m.id));
      }

      // F6: Exclude children from summaries if excludeFromSummaries is true
      membersToShare = membersToShare.filter(m => !m.excludeFromSummaries);

      setMembers(membersToShare);

      // Generate summary (minimal data only)
      if (membersToShare.length === 0) {
        setSummary('No hay información disponible para compartir.');
      } else if (membersToShare.length === 1) {
        const summaryText = await familyService.generateWeeklySummary(membersToShare[0].id);
        setSummary(summaryText);
      } else {
        // Multiple members: combine summaries
        const summaries = await Promise.all(
          membersToShare.map(m => familyService.generateWeeklySummary(m.id))
        );
        setSummary(summaries.join('\n\n'));
      }
    } catch (error) {
      console.error('Error loading summary:', error);
      setSummary('Error al generar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;

    try {
      // F8: Share-sheet only (no direct WhatsApp API)
      await Share.share({
        message: summary,
        title: 'Family Circle - Resumen Semanal',
      });
      
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getMemberNames = () => {
    return members.map(m => m.name).join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>Compartir Resumen</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* F8: Block D preview warning */}
        <View style={[styles.warningCard, { backgroundColor: 'rgba(255, 107, 107, 0.15)', borderColor: getAccentColor() }]}>
          <DynamicText type="card" style={[styles.warningText, { color: getAccentColor() }]}>
            ⚠️ {t('familyCircle.sharePreview', { names: getMemberNames() })}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            Vista Previa del Resumen
          </DynamicText>
          
          {loading ? (
            <DynamicText type="card" style={[styles.summaryText, { color: getCardTextColor() }]}>
              {t('common.loading')}...
            </DynamicText>
          ) : (
            <ScrollView 
              style={[styles.previewBox, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}
              nestedScrollEnabled
            >
              <DynamicText type="card" style={[styles.summaryText, { color: getCardTextColor() }]}>
                {summary}
              </DynamicText>
            </ScrollView>
          )}
        </View>

        <View style={[styles.noteCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.noteText, { color: getCardTextColor() }]}>
            ℹ️ Este resumen contiene solo información básica de dosis registradas. No incluye datos de Health Connect ni información sensible.
          </DynamicText>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: getAccentColor() }]}
          onPress={handleShare}
          disabled={loading || !summary}
        >
          <DynamicText type="button" style={styles.buttonText}>
            {t('familyCircle.shareMinimal')}
          </DynamicText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <DynamicText type="card" style={[styles.cancelButtonText, { color: getCardTextColor() }]}>
            {t('common.cancel')}
          </DynamicText>
        </TouchableOpacity>
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
  warningCard: { borderRadius: 12, borderWidth: 2, padding: 16, marginBottom: 16 },
  warningText: { fontSize: 14, fontWeight: '600', lineHeight: 21 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  previewBox: { maxHeight: 300, borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 8 },
  summaryText: { fontSize: 13, lineHeight: 19, fontFamily: 'monospace' },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  noteText: { fontSize: 13, opacity: 0.75, lineHeight: 19 },
  shareButton: { borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  buttonText: { fontSize: 16, fontWeight: '600', color: buttonTextColor },
  cancelButtonText: { fontSize: 14, opacity: 0.8 },
});
