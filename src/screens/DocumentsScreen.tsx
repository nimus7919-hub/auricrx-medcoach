import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';


type DocumentPage = {
  id: string;
  uri: string;
  timestamp: number;
};

export default function DocumentsScreen({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Debug logging
  console.log('🎨 Documents Screen Dynamic Colors:', {
    cardBg: getCardBackgroundColor(),
    cardBorder: getCardBorderColor(),
    cardText: getCardTextColor()
  });

  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [exporting, setExporting] = useState(false);

  // Create docs directory on mount
  useEffect(() => {
    createDocsDirectory();
  }, []);

  const createDocsDirectory = async () => {
    try {
      const docsDir = FileSystem.documentDirectory + 'docs/';
      const dirInfo = await FileSystem.getInfoAsync(docsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
      }
    } catch (error) {
      console.log('Error creating docs directory:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return true;
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('documents.galleryPermissionNeeded'));
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t('common.error'), t('documents.cameraNotAvailable'));
      return false;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('documents.permissionNeeded'));
      return false;
    }
    return true;
  };

  const addFromCamera = async () => {
    if (!(await requestCameraPermissions())) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const newPage: DocumentPage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          timestamp: Date.now(),
        };
        setPages(prev => [...prev, newPage]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('documents.failedToCapture'));
    }
  };

  const addFromGallery = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newPages: DocumentPage[] = result.assets.map((asset, index) => ({
          id: (Date.now() + index).toString(),
          uri: asset.uri,
          timestamp: Date.now() + index,
        }));
        setPages(prev => [...prev, ...newPages]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('documents.failedToSelect'));
    }
  };

  const removePage = (id: string) => {
    setPages(prev => prev.filter(page => page.id !== id));
  };

  const movePage = (id: string, direction: 'up' | 'down') => {
    setPages(prev => {
      const index = prev.findIndex(page => page.id === id);
      if (index === -1) return prev;
      
      const newPages = [...prev];
      if (direction === 'up' && index > 0) {
        [newPages[index], newPages[index - 1]] = [newPages[index - 1], newPages[index]];
      } else if (direction === 'down' && index < newPages.length - 1) {
        [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
      }
      return newPages;
    });
  };

  const exportToPDF = async () => {
    if (pages.length === 0) {
      Alert.alert(t('common.error'), t('documents.noPagesToExport'));
      return;
    }

    setExporting(true);
    try {
      // Create HTML content for PDF
      const imageHtml = pages.map(page => 
        `<img src="${page.uri}" style="width: 100%; max-width: 800px; margin: 20px 0; display: block;" />`
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${t('documents.title')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .page { page-break-after: always; }
              .page:last-child { page-break-after: auto; }
            </style>
          </head>
          <body>
            <h1>${t('documents.title')}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            ${imageHtml}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      // Save to docs directory
      const docsDir = FileSystem.documentDirectory + 'docs/';
      const fileName = `documents_${Date.now()}.pdf`;
      const finalUri = docsDir + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(finalUri, {
          mimeType: 'application/pdf',
          dialogTitle: t('documents.title'),
        });
      }

      Alert.alert(t('common.success'), t('documents.pdfExported'));
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert(t('common.error'), t('documents.failedToExport'));
    } finally {
      setExporting(false);
    }
  };

  const renderPage = ({ item, index }: { item: DocumentPage; index: number }) => (
    <View style={styles.pageContainer}>
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <View style={styles.pageControls}>
        <TouchableOpacity 
          onPress={() => movePage(item.id, 'up')}
          disabled={index === 0}
          style={[styles.controlButton, { backgroundColor: '#3A7BFD' + 'CC' }, index === 0 && styles.disabledButton]}
        >
          <DynamicText type="card" style={styles.controlButtonText}>↑</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => movePage(item.id, 'down')}
          disabled={index === pages.length - 1}
          style={[styles.controlButton, { backgroundColor: '#3A7BFD' + 'CC' }, index === pages.length - 1 && styles.disabledButton]}
        >
          <DynamicText type="card" style={styles.controlButtonText}>↓</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => removePage(item.id)}
          style={[styles.controlButton, styles.deleteButton]}
        >
          <DynamicText type="card" style={styles.controlButtonText}>✕</DynamicText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: 50 }]}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor() + 'CC', borderBottomColor: getCardBorderColor() }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <DynamicText type="card" style={styles.closeButtonText}>←</DynamicText>
        </TouchableOpacity>
        <DynamicText type="primary" style={styles.title}>{t('documents.title')}</DynamicText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            onPress={addFromCamera}
            style={[styles.actionButton, { backgroundColor: '#D4AF37' + 'CC' }]}
          >
            <DynamicText type="card" style={styles.actionButtonText}>
              {Platform.OS === 'web' ? t('documents.addPhotos') : t('documents.addFromCamera')}
            </DynamicText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={addFromGallery}
            style={[styles.actionButton, { backgroundColor: '#D4AF37' + 'CC' }]}
          >
            <DynamicText type="card" style={styles.actionButtonText}>
              {t('documents.addFromGallery')}
            </DynamicText>
          </TouchableOpacity>
        </View>

        {pages.length === 0 ? (
          <View style={styles.emptyState}>
            <DynamicText type="secondary" style={styles.emptyStateText}>
              {t('documents.noPages')}
            </DynamicText>
          </View>
        ) : (
          <>
            <FlatList
              data={pages}
              renderItem={renderPage}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pagesList}
            />
            
            <TouchableOpacity 
              onPress={exportToPDF}
              disabled={exporting}
              style={[styles.exportButton, { backgroundColor: '#D4AF37' + 'CC' }, exporting && styles.disabledButton]}
            >
              <DynamicText type="card" style={styles.exportButtonText}>
                {exporting ? t('documents.exporting') : t('documents.exportPDF')}
              </DynamicText>
            </TouchableOpacity>
          </>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagesList: {
    paddingBottom: 16,
  },
  pageContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 12,
    marginBottom: 12,
  },
  pageControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteButton: {
    backgroundColor: '#EF4444' + 'CC',
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  exportButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  exportButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});
