import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Modal,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import DynamicText from '../components/DynamicText';
import PDFViewer from '../components/PDFViewer';
import { useWallpaper } from '../contexts/WallpaperContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MedicalDocumentsScreenProps {
  navigation: any;
}

interface DocumentItem {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  mimeType: string;
}

const MedicalDocumentsScreen: React.FC<MedicalDocumentsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { wallpaper } = useWallpaper();
  
  // State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [backImageDataUri, setBackImageDataUri] = useState<string | null>(null);
  const [showDualIDViewer, setShowDualIDViewer] = useState(false);
  const [idPair, setIDPair] = useState<{ front: DocumentItem | null, back: DocumentItem | null }>({ front: null, back: null });
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    } else {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    }
  };

  // Load documents
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const documentsDir = FileSystem.documentDirectory + 'documents/';
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
        setDocuments([]);
        return;
      }
      
      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const documentItems: DocumentItem[] = [];
      
      for (const file of files) {
        const filePath = `${documentsDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.isFile) {
          const mimeType = getMimeType(file);
          documentItems.push({
            id: file,
            name: file,
            uri: filePath,
            type: mimeType,
            size: fileInfo.size || 0,
            mimeType: mimeType,
          });
        }
      }
      
      setDocuments(documentItems);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get MIME type
  const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  };

  // Upload document
  const uploadDocument = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic('medium');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const documentsDir = FileSystem.documentDirectory + 'documents/';
        const fileName = asset.name || `document_${Date.now()}.${asset.uri.split('.').pop()}`;
        const destinationUri = `${documentsDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destinationUri,
        });
        
        await loadDocuments();
        triggerHaptic('light');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      Alert.alert('❌ ' + t('error'), 'Failed to upload document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete document
  const deleteDocument = async (document: DocumentItem) => {
    try {
      triggerHaptic('medium');
      
      Alert.alert(
        '🗑️ ' + t('delete'),
        `Are you sure you want to delete "${document.name}"?`,
        [
          {
            text: t('cancel'),
            style: 'cancel'
          },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              await FileSystem.deleteAsync(document.uri);
              await loadDocuments();
              triggerHaptic('light');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to delete document:', error);
      Alert.alert('❌ ' + t('error'), 'Failed to delete document');
    }
  };

  // View document
  const viewDocument = (document: DocumentItem) => {
    triggerHaptic('light');
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  // Share document
  const shareDocument = (document: DocumentItem) => {
    triggerHaptic('light');
    setSelectedDocument(document);
    setShowSharingModal(true);
  };

  // Share to email
  const shareToEmail = async (document: DocumentItem) => {
    try {
      triggerHaptic('light');
      setShowSharingModal(false);
      
      const shareableUri = await convertToShareableUri(document.uri);
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(shareableUri, {
          mimeType: document.mimeType,
          dialogTitle: `Share ${document.name}`,
        });
      } else {
        Alert.alert('❌ ' + t('error'), 'Sharing not available on this device');
      }
    } catch (error) {
      console.error('Failed to share to email:', error);
      Alert.alert('❌ ' + t('error'), 'Failed to share to email');
    }
  };

  // Share to all apps
  const shareToAllApps = async (document: DocumentItem) => {
    try {
      triggerHaptic('light');
      setShowSharingModal(false);
      
      const shareableUri = await convertToShareableUri(document.uri);
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(shareableUri, {
          mimeType: document.mimeType,
          dialogTitle: `Share ${document.name}`,
        });
      } else {
        Alert.alert('❌ ' + t('error'), 'Sharing not available on this device');
      }
    } catch (error) {
      console.error('Failed to share to all apps:', error);
      Alert.alert('❌ ' + t('error'), 'Failed to share to all apps');
    }
  };

  // Convert to shareable URI
  const convertToShareableUri = async (uri: string): Promise<string> => {
    try {
      if (Platform.OS === 'android') {
        const shareableUri = `${FileSystem.documentDirectory}share_${Date.now()}.${uri.split('.').pop()}`;
        await FileSystem.copyAsync({
          from: uri,
          to: shareableUri,
        });
        return shareableUri;
      }
      return uri;
    } catch (error) {
      console.error('Failed to convert URI:', error);
      return uri;
    }
  };

  // Render document item
  const renderDocumentItem = (document: DocumentItem) => {
    const isImage = document.mimeType.startsWith('image/');
    const isPDF = document.mimeType === 'application/pdf';
    
    return (
      <View key={document.id} style={dynamicStyles.documentCard}>
        <TouchableOpacity
          style={dynamicStyles.documentContent}
          onPress={() => viewDocument(document)}
        >
          {isImage ? (
            <Image
              source={{ uri: document.uri }}
              style={dynamicStyles.documentImage}
              onError={() => setImageError(true)}
            />
          ) : isPDF ? (
            <View style={dynamicStyles.documentIcon}>
              <DynamicText type="card" style={dynamicStyles.documentIconText}>📄</DynamicText>
            </View>
          ) : (
            <View style={dynamicStyles.documentIcon}>
              <DynamicText type="card" style={dynamicStyles.documentIconText}>📁</DynamicText>
            </View>
          )}
          
          <View style={dynamicStyles.documentInfo}>
            <DynamicText type="card" style={dynamicStyles.documentName} numberOfLines={2}>
              {document.name}
            </DynamicText>
            <DynamicText type="card" style={dynamicStyles.documentSize}>
              {formatFileSize(document.size)}
            </DynamicText>
          </View>
        </TouchableOpacity>
        
        <View style={dynamicStyles.documentActions}>
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => viewDocument(document)}
          >
            <DynamicText type="card" style={dynamicStyles.actionButtonText}>👁️</DynamicText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => shareDocument(document)}
          >
            <DynamicText type="card" style={dynamicStyles.actionButtonText}>📤</DynamicText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => deleteDocument(document)}
          >
            <DynamicText type="card" style={dynamicStyles.actionButtonText}>🗑️</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Dynamic styles
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: wallpaper === 'dark' ? '#1a1a1a' : '#f8fafc',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    homeButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
      marginRight: 16,
    },
    homeButtonImage: {
      width: 40,
      height: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: wallpaper === 'dark' ? '#ffffff' : '#1f2937',
    },
    uploadButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    uploadButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    documentCard: {
      backgroundColor: wallpaper === 'dark' ? '#2d2d2d' : '#ffffff',
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    documentContent: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'center',
    },
    documentImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 16,
    },
    documentIcon: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: wallpaper === 'dark' ? '#404040' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    documentIconText: {
      fontSize: 24,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: wallpaper === 'dark' ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    documentSize: {
      fontSize: 14,
      color: wallpaper === 'dark' ? '#9ca3af' : '#6b7280',
    },
    documentActions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 16,
      justifyContent: 'space-around',
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: wallpaper === 'dark' ? '#1a1a1a' : '#ffffff',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: wallpaper === 'dark' ? '#404040' : '#e5e7eb',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 20,
      color: wallpaper === 'dark' ? '#ffffff' : '#1f2937',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: wallpaper === 'dark' ? '#ffffff' : '#1f2937',
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    sharingOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    sharingOptionIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    sharingOptionText: {
      flex: 1,
    },
    sharingOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
    },
    sharingOptionSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
  });

  useEffect(() => {
    loadDocuments();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <DynamicText type="card" style={{ marginTop: 16, fontSize: 16 }}>
          {t('loading')}...
        </DynamicText>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <Animated.View
        style={[
          dynamicStyles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView style={dynamicStyles.scrollContent}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity
              style={dynamicStyles.homeButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../../assets/AuricRX_home_button.png')}
                style={dynamicStyles.homeButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <DynamicText type="card" style={dynamicStyles.title}>
              {t('medicalDocuments')}
            </DynamicText>
          </View>

          <TouchableOpacity
            style={dynamicStyles.uploadButton}
            onPress={uploadDocument}
            disabled={isProcessing}
          >
            <DynamicText type="card" style={dynamicStyles.uploadButtonText}>
              {isProcessing ? '⏳ Uploading...' : '📁 Upload Document'}
            </DynamicText>
          </TouchableOpacity>

          {documents.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <DynamicText type="card" style={{ fontSize: 18, marginBottom: 8 }}>
                📁 No documents yet
              </DynamicText>
              <DynamicText type="card" style={{ fontSize: 14, textAlign: 'center', opacity: 0.7 }}>
                Tap "Upload Document" to add your first medical document
              </DynamicText>
            </View>
          ) : (
            documents.map(renderDocumentItem)
          )}
        </ScrollView>

        {/* View Modal */}
        {showViewModal && selectedDocument && (
          <Modal
            visible={showViewModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowViewModal(false)}
          >
            <View style={dynamicStyles.modalContainer}>
              <View style={dynamicStyles.modalHeader}>
                <TouchableOpacity
                  style={dynamicStyles.closeButton}
                  onPress={() => setShowViewModal(false)}
                >
                  <DynamicText type="card" style={dynamicStyles.closeButtonText}>✕</DynamicText>
                </TouchableOpacity>
                <DynamicText type="card" style={dynamicStyles.modalTitle}>
                  {selectedDocument.name}
                </DynamicText>
                <View style={{ width: 30 }} />
              </View>
              
              <View style={dynamicStyles.modalContent}>
                <PDFViewer
                  uri={selectedDocument.uri}
                  onClose={() => setShowViewModal(false)}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Sharing Modal */}
        {showSharingModal && selectedDocument && (
          <Modal
            visible={showSharingModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowSharingModal(false)}
          >
            <View style={dynamicStyles.modalContainer}>
              <View style={dynamicStyles.modalHeader}>
                <TouchableOpacity
                  style={dynamicStyles.closeButton}
                  onPress={() => setShowSharingModal(false)}
                >
                  <DynamicText type="card" style={dynamicStyles.closeButtonText}>✕</DynamicText>
                </TouchableOpacity>
                <DynamicText type="card" style={dynamicStyles.modalTitle}>
                  Share "{selectedDocument.name}"
                </DynamicText>
                <View style={{ width: 30 }} />
              </View>
              
              <View style={dynamicStyles.modalContent}>
                {/* Email Option */}
                <TouchableOpacity
                  style={[dynamicStyles.sharingOption, { backgroundColor: '#EA4335' }]}
                  onPress={() => shareToEmail(selectedDocument)}
                >
                  <DynamicText type="card" style={dynamicStyles.sharingOptionIcon}>📧</DynamicText>
                  <View style={dynamicStyles.sharingOptionText}>
                    <DynamicText type="card" style={dynamicStyles.sharingOptionTitle}>Send to Email</DynamicText>
                    <DynamicText type="card" style={dynamicStyles.sharingOptionSubtitle}>Send via email</DynamicText>
                  </View>
                </TouchableOpacity>

                {/* All Apps Option */}
                <TouchableOpacity
                  style={[dynamicStyles.sharingOption, { backgroundColor: '#34A853' }]}
                  onPress={() => shareToAllApps(selectedDocument)}
                >
                  <DynamicText type="card" style={dynamicStyles.sharingOptionIcon}>📤</DynamicText>
                  <View style={dynamicStyles.sharingOptionText}>
                    <DynamicText type="card" style={dynamicStyles.sharingOptionTitle}>Share</DynamicText>
                    <DynamicText type="card" style={dynamicStyles.sharingOptionSubtitle}>Share with all apps</DynamicText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </Animated.View>
    </View>
  );
};

export default MedicalDocumentsScreen;
